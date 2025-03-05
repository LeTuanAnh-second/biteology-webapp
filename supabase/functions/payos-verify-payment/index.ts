
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
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// PayOS API configuration - production URL
const PAYOS_CLIENT_ID = Deno.env.get("PAYOS_CLIENT_ID") || "";
const PAYOS_API_KEY = Deno.env.get("PAYOS_API_KEY") || "";
const PAYOS_API_URL = "https://api.payos.vn";

async function verifyPayment(orderId: string) {
  try {
    console.log(`Verifying payment for order ${orderId}`);
    
    // Check if transaction exists in our database
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();
    
    if (transactionError) {
      console.error('Error fetching transaction:', transactionError);
      return { success: false, message: 'Error fetching transaction' };
    }
    
    if (!transaction) {
      console.log('Transaction not found:', orderId);
      return { success: false, message: 'Transaction not found' };
    }
    
    console.log('Transaction found:', transaction);
    
    try {
      // Call PayOS API to check payment status with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      console.log(`Calling PayOS API at ${PAYOS_API_URL}/v1/payment-requests/${orderId}`);
      
      const payosResponse = await fetch(`${PAYOS_API_URL}/v1/payment-requests/${orderId}`, {
        method: 'GET',
        headers: {
          'x-client-id': PAYOS_CLIENT_ID,
          'x-api-key': PAYOS_API_KEY
        },
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));
      
      if (!payosResponse.ok) {
        console.error('PayOS API error:', payosResponse.status);
        // Log response body if available
        try {
          const errorBody = await payosResponse.text();
          console.error('Error response body:', errorBody);
        } catch (e) {
          console.error('Could not read error response body');
        }
        
        // Fall back to checking our database status
        if (transaction.status === 'completed') {
          return { success: true, message: 'Payment already completed' };
        }
        return { success: false, message: 'Failed to verify payment with provider' };
      }
      
      const payosResult = await payosResponse.json();
      console.log('PayOS verification result:', payosResult);
      
      const isSuccessful = payosResult.data && 
                         (payosResult.data.status === 'PAID' || 
                          payosResult.data.status === 'COMPLETED');
      
      if (isSuccessful) {
        // Update transaction status
        await supabase
          .from('payment_transactions')
          .update({ status: 'completed' })
          .eq('order_id', orderId);
          
        // Create user subscription record
        const endDate = new Date();
        const { data: plan } = await supabase
          .from('premium_plans')
          .select('duration_days')
          .eq('id', transaction.plan_id)
          .maybeSingle();
        
        // Calculate end date based on plan duration
        endDate.setDate(endDate.getDate() + (plan?.duration_days || 30));
        
        // Create or update user subscription
        try {
          // Check if subscription exists
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
              .eq('user_id', transaction.user_id);
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
        } catch (err) {
          console.error('Error handling subscription:', err);
        }
        
        // Update user profile to mark as premium
        await supabase
          .from('profiles')
          .update({ is_premium: true })
          .eq('id', transaction.user_id);
        
        return { 
          success: true, 
          message: 'Payment verified successfully',
          orderId: orderId,
          userId: transaction.user_id,
          planId: transaction.plan_id
        };
      } else {
        return { success: false, message: 'Payment verification failed or payment not completed' };
      }
    } catch (error) {
      console.error('Error calling PayOS API:', error);
      // Fall back to checking our database status
      if (transaction.status === 'completed') {
        return { success: true, message: 'Payment already completed' };
      }
      return { success: false, message: 'Error verifying payment', error: String(error) };
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
    return new Response(null, { 
      headers: corsHeaders, 
      status: 204 
    });
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
