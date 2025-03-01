
// Deno edge function to verify a PayOS payment

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

// Set up the Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// PayOS API configuration
const PAYOS_CLIENT_ID = "584c3026-5cb1-4ddb-b94b-cfdea981eda3";
const PAYOS_API_KEY = "2905ca16-e50e-4932-9024-f25ba3035b6d";
const PAYOS_API_URL = "https://api-merchant.payos.vn";

// Set CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifyPayment(orderId: string) {
  try {
    console.log(`Verifying payment for order ${orderId}`);
    
    // First check if the payment is already processed
    const { data: order, error: orderError } = await supabase
      .from('premium_orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      return { success: false, message: 'Order not found' };
    }
    
    if (order.status === 'completed') {
      return { success: true, message: 'Payment already confirmed', data: order };
    }
    
    if (order.status === 'failed') {
      return { success: false, message: 'Payment failed' };
    }
    
    // Call PayOS API to check payment status
    const payosResponse = await fetch(`${PAYOS_API_URL}/v2/payment-requests/${orderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': PAYOS_CLIENT_ID,
        'x-api-key': PAYOS_API_KEY
      }
    });
    
    const payosResult = await payosResponse.json();
    console.log('PayOS payment status response:', payosResult);
    
    if (!payosResult.success) {
      return { success: false, message: payosResult.message || 'Failed to verify payment status' };
    }
    
    const paymentData = payosResult.data;
    const status = paymentData?.status;
    
    // PAID means the payment was successful
    if (status === "PAID") {
      // Get plan details for subscription duration
      const { data: plan, error: planError } = await supabase
        .from('premium_plans')
        .select('*')
        .eq('id', order.plan_id)
        .single();
      
      if (planError || !plan) {
        console.error('Error fetching plan:', planError);
        return { success: false, message: 'Plan not found' };
      }
      
      // Update order status
      await supabase
        .from('premium_orders')
        .update({ status: 'completed' })
        .eq('id', orderId);
      
      // Calculate subscription end date
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(now.getDate() + plan.duration_days);
      
      // Create or update user's subscription
      const { error: subscriptionError } = await supabase
        .from('premium_subscriptions')
        .upsert({
          user_id: order.user_id,
          plan_id: order.plan_id,
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          order_id: orderId
        });
      
      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
        return { success: false, message: 'Failed to create subscription' };
      }
      
      return { 
        success: true, 
        message: 'Payment verified and subscription activated', 
        data: {
          orderId: orderId,
          status: 'completed',
          planName: plan.name,
          endDate: endDate.toISOString()
        }
      };
    } else if (status === "PENDING") {
      return { success: false, message: 'Payment is still pending' };
    } else {
      // Update order status to failed
      await supabase
        .from('premium_orders')
        .update({ status: 'failed' })
        .eq('id', orderId);
        
      return { success: false, message: 'Payment failed or was cancelled' };
    }
    
  } catch (error) {
    console.error('Error verifying payment:', error);
    return { success: false, message: 'Failed to verify payment' };
  }
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing order ID' }),
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
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
