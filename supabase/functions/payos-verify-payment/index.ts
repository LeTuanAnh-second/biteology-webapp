
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

// PayOS API configuration
const PAYOS_CLIENT_ID = Deno.env.get("PAYOS_CLIENT_ID") || "";
const PAYOS_API_KEY = Deno.env.get("PAYOS_API_KEY") || "";
const PAYOS_API_URL = "https://api.payos.vn/v2";

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
    
    // Verify that we have all needed PayOS credentials
    if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY) {
      console.error('Missing PayOS credentials required for verification');
      return { success: false, message: 'Payment provider configuration error' };
    }
    
    try {
      // Call PayOS API to check payment status with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const payosEndpoint = `${PAYOS_API_URL}/payment-requests/${orderId}`;
      console.log(`Calling PayOS API at ${payosEndpoint}`);
      
      let payosResponse;
      try {
        payosResponse = await fetch(payosEndpoint, {
          method: 'GET',
          headers: {
            'x-client-id': PAYOS_CLIENT_ID,
            'x-api-key': PAYOS_API_KEY,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
      } catch (fetchError) {
        console.error('Fetch error when checking payment status:', fetchError);
        clearTimeout(timeoutId);
        
        // Fall back to checking our database status
        if (transaction.status === 'completed') {
          return { success: true, message: 'Payment already completed' };
        }
        return { 
          success: false, 
          message: 'Failed to verify payment with provider', 
          error: fetchError.message 
        };
      } finally {
        clearTimeout(timeoutId);
      }
      
      // Log the raw response status and body
      console.log(`PayOS API response status: ${payosResponse.status}`);
      const rawBody = await payosResponse.text();
      console.log('PayOS API response body:', rawBody);
      
      if (!payosResponse.ok) {
        // Fall back to checking our database status
        if (transaction.status === 'completed') {
          return { success: true, message: 'Payment already completed' };
        }
        return { 
          success: false, 
          message: 'Failed to verify payment with provider', 
          error: `Status ${payosResponse.status}: ${rawBody}`
        };
      }
      
      // Parse the JSON response
      let payosResult;
      try {
        payosResult = JSON.parse(rawBody);
        console.log('PayOS verification result:', payosResult);
      } catch (jsonError) {
        console.error('Failed to parse PayOS response:', jsonError);
        // Fall back to checking our database status
        if (transaction.status === 'completed') {
          return { success: true, message: 'Payment already completed' };
        }
        return { 
          success: false, 
          message: 'Invalid response from payment provider', 
          error: jsonError.message
        };
      }
      
      // Check for successful payment status
      const isSuccessful = payosResult.code === '00' && 
                         payosResult.data && 
                         (payosResult.data.status === 'PAID' || 
                          payosResult.data.status === 'COMPLETED');
      
      if (isSuccessful) {
        console.log('Payment verification successful');
        
        // Update transaction status
        await supabase
          .from('payment_transactions')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('order_id', orderId);
          
        // Create user subscription record
        const endDate = new Date();
        const { data: plan } = await supabase
          .from('premium_plans')
          .select('duration_days')
          .eq('id', transaction.plan_id)
          .maybeSingle();
        
        console.log('Plan data for subscription:', plan);
        
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
            console.log('Updating existing subscription:', existingSub.id);
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
            console.log('Creating new subscription for user:', transaction.user_id);
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
        console.log('Updating user profile to premium:', transaction.user_id);
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
        console.log('Payment not completed or verification failed');
        return { 
          success: false, 
          message: 'Payment verification failed or payment not completed',
          details: payosResult
        };
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
    // Parse request body for POST requests
    let orderId;
    if (req.method === 'POST') {
      const body = await req.json();
      orderId = body.orderId;
    } else {
      // Extract orderId from query params for GET requests
      const url = new URL(req.url);
      orderId = url.searchParams.get('orderId');
    }
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing orderId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // For security in production, you should validate the user's permission to check this order
    // Currently simplified for the demo
    
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
