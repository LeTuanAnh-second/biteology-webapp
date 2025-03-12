
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import * as crypto from "https://deno.land/std@0.168.0/node/crypto.ts";

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-payos-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log("PayOS webhook received:", req.method);
  
  // Handle CORS preflight requests
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
  const checksumKey = Deno.env.get("PAYOS_CHECKSUM_KEY") || "";
  
  try {
    // Get the PayOS signature from headers
    const payosSignature = req.headers.get('x-payos-signature');
    console.log("PayOS Signature:", payosSignature);
    
    if (!payosSignature) {
      console.error("Missing PayOS signature");
      return new Response(
        JSON.stringify({ success: false, error: "Missing signature" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Get request body
    const body = await req.text();
    console.log("Webhook body:", body);
    
    // Verify signature
    const hmac = crypto.createHmac('sha256', checksumKey);
    hmac.update(body);
    const calculatedSignature = hmac.digest('hex');
    
    console.log("Calculated signature:", calculatedSignature);
    
    if (calculatedSignature !== payosSignature) {
      console.error("Invalid signature");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid signature" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // Parse webhook data
    const webhookData = JSON.parse(body);
    console.log("Parsed webhook data:", webhookData);

    const { orderCode, status, amount, description } = webhookData;

    if (status === "PAID") {
      // Find transaction by order ID
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('order_id', orderCode)
        .maybeSingle();
      
      if (transactionError) {
        console.error("Error fetching transaction:", transactionError);
        return new Response(
          JSON.stringify({ success: false, error: "Database error" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      if (!transaction) {
        console.error("Transaction not found:", orderCode);
        return new Response(
          JSON.stringify({ success: false, error: "Transaction not found" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      console.log("Found transaction:", transaction);

      // Update transaction status
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error("Error updating transaction:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to update transaction" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Get plan details
      const { data: plan } = await supabase
        .from('premium_plans')
        .select('duration_days')
        .eq('id', transaction.plan_id)
        .single();

      // Calculate subscription end date
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (plan?.duration_days || 30));

      // Create or update subscription
      const { data: existingSub } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', transaction.user_id)
        .maybeSingle();

      if (existingSub) {
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
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
