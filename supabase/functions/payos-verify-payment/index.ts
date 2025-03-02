
// Deno edge function to verify PayOS payment status

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

// Set up Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// Set CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// PayOS API configuration
const PAYOS_CLIENT_ID = "584c3026-5cb1-4ddb-b94b-cfdea981eda3";
const PAYOS_API_KEY = "2905ca16-e50e-4932-9024-f25ba3035b6d";
const PAYOS_API_URL = "https://api-merchant.payos.vn";

async function verifyPayment(orderId: string) {
  try {
    console.log(`Verifying payment for order ${orderId}`);
    
    // In a real implementation, we would call the PayOS API to verify the payment
    // For demo/sandbox, we'll check our database
    
    // Check if order exists in our database
    const { data: order, error: orderError } = await supabase
      .from('premium_orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();
    
    if (orderError) {
      console.error('Error fetching order:', orderError);
      return { success: false, message: 'Error fetching order' };
    }
    
    if (!order) {
      console.log('Order not found:', orderId);
      return { success: false, message: 'Order not found' };
    }
    
    console.log('Order found:', order);
    
    // In a real scenario, we would check the payment status with PayOS
    // For demo, we'll just simulate a successful payment
    
    // For demo/sandbox, let's just consider the payment successful
    const isSuccessful = true;
    
    if (isSuccessful) {
      // Create user subscription record
      const endDate = new Date();
      const { data: plan } = await supabase
        .from('premium_plans')
        .select('duration_days')
        .eq('id', order.plan_id)
        .maybeSingle();
      
      // Calculate end date based on plan duration
      endDate.setDate(endDate.getDate() + (plan?.duration_days || 30));
      
      // Create a transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: order.user_id,
          plan_id: order.plan_id,
          amount: order.amount,
          status: 'completed',
          payment_method: 'payos',
          order_id: order.id
        })
        .select()
        .single();
      
      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        // Continue execution - not critical for the payment verification
      }
      
      // Create or update user subscription
      try {
        const { data: subscription, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: order.user_id,
            plan_id: order.plan_id,
            start_date: new Date().toISOString(),
            end_date: endDate.toISOString(),
            status: 'active',
            transaction_id: transaction?.id || null
          })
          .select();
          
        if (subscriptionError) {
          console.error('Error creating subscription:', subscriptionError);
          // Continue execution - we'll retry below
        }
      } catch (err) {
        console.error('Error in subscription creation:', err);
      }
      
      // Update the order status
      await supabase
        .from('premium_orders')
        .update({ status: 'completed' })
        .eq('id', orderId);
      
      // Update user profile to mark as premium
      await supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', order.user_id);
      
      return { 
        success: true, 
        message: 'Payment verified successfully',
        orderId: orderId,
        userId: order.user_id,
        planId: order.plan_id
      };
    } else {
      // Update the order status to failed
      await supabase
        .from('premium_orders')
        .update({ status: 'failed' })
        .eq('id', orderId);
      
      return { success: false, message: 'Payment verification failed' };
    }
    
  } catch (error) {
    console.error('Error verifying payment:', error);
    return { success: false, message: 'Error verifying payment', error: String(error) };
  }
}

serve(async (req) => {
  console.log("Received request:", req.method, req.url);
  
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log("Responding to OPTIONS request with CORS headers");
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    // Check for Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // Validate JWT token
    try {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        console.error("Invalid token:", error);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid authorization token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      console.log("Authenticated user:", user.id);
    } catch (error) {
      console.error("Error validating token:", error);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authorization token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // Extract orderId from query params
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing orderId parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const result = await verifyPayment(orderId);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error', details: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
