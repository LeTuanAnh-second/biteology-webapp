
// PayOS webhook handler for payment notifications

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
};

serve(async (req) => {
  console.log("PayOS webhook received:", req.method);
  
  // Always respond with 200 OK for OPTIONS requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  
  // Create Supabase client
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    let paymentData: any;
    
    // Handle both GET and POST methods
    if (req.method === 'GET') {
      // For GET requests, look for data in URL query parameters
      const url = new URL(req.url);
      const orderCode = url.searchParams.get('orderCode');
      if (orderCode) {
        paymentData = { orderCode };
      } else {
        console.log("No orderCode found in GET parameters");
      }
    } else {
      // For POST requests, try to parse the request body
      try {
        const contentType = req.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
          paymentData = await req.json();
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const formData = await req.formData();
          paymentData = {};
          for (const [key, value] of formData.entries()) {
            paymentData[key] = value;
          }
        } else {
          // Try to parse as JSON anyway
          const text = await req.text();
          try {
            paymentData = JSON.parse(text);
          } catch {
            console.log("Unable to parse request body as JSON:", text);
            // Store raw text for debugging
            paymentData = { rawData: text };
          }
        }
      } catch (error) {
        console.error("Error parsing request body:", error);
      }
    }
    
    console.log("Payment webhook data:", paymentData);
    
    // Extract order code/ID from the PayOS webhook data
    let orderId: string | null = null;
    
    if (paymentData) {
      // Try different possible field names
      orderId = paymentData.orderCode || 
                paymentData.order_code || 
                (paymentData.data && paymentData.data.orderCode) ||
                (paymentData.data && paymentData.data.order_code) ||
                null;
    }
    
    console.log("Extracted order ID:", orderId);
    
    if (orderId) {
      // Store the webhook receipt for debugging
      await supabase.from('webhook_logs').insert({
        source: 'payos',
        event_type: 'payment_notification',
        data: paymentData,
        processed: false,
        order_id: orderId
      });
      
      // Find transaction by order ID
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();
      
      if (transactionError) {
        console.error("Error fetching transaction:", transactionError);
      } else if (transaction) {
        console.log("Found transaction:", transaction);
        
        // Update transaction status
        await supabase
          .from('payment_transactions')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.id);
        
        // Create or update user subscription
        const endDate = new Date();
        
        // Get plan details for duration
        const { data: plan } = await supabase
          .from('premium_plans')
          .select('*')
          .eq('id', transaction.plan_id)
          .maybeSingle();
        
        if (plan) {
          endDate.setDate(endDate.getDate() + (plan.duration_days || 30));
          
          // Try to get existing subscription
          const { data: existingSub } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', transaction.user_id)
            .maybeSingle();
          
          if (existingSub) {
            // Update existing subscription
            await supabase
              .from('user_subscriptions')
              .update({
                plan_id: transaction.plan_id,
                start_date: new Date().toISOString(),
                end_date: endDate.toISOString(),
                status: 'active',
                transaction_id: transaction.id
              })
              .eq('id', existingSub.id);
          } else {
            // Create new subscription
            await supabase
              .from('user_subscriptions')
              .insert({
                user_id: transaction.user_id,
                plan_id: transaction.plan_id,
                start_date: new Date().toISOString(),
                end_date: endDate.toISOString(),
                status: 'active',
                transaction_id: transaction.id
              });
          }
          
          // Update user premium status
          await supabase
            .from('profiles')
            .update({ is_premium: true })
            .eq('id', transaction.user_id);
            
          // Update webhook log as processed
          await supabase
            .from('webhook_logs')
            .update({ processed: true })
            .eq('order_id', orderId);
            
          console.log("Payment processing completed successfully");
        } else {
          console.error("Plan not found:", transaction.plan_id);
        }
      } else {
        console.log("No transaction found for order ID:", orderId);
      }
    }
    
    // Always return success to the PayOS webhook caller
    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    
    // Still return 200 to prevent PayOS from retrying
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 even on error to avoid retries
      }
    );
  }
});
