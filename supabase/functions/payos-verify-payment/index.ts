import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// PayOS configs
const PAYOS_CLIENT_ID = Deno.env.get("PAYOS_CLIENT_ID") || "";
const PAYOS_API_KEY = Deno.env.get("PAYOS_API_KEY") || "";
const PAYOS_CHECKSUM_KEY = Deno.env.get("PAYOS_CHECKSUM_KEY") || "";
const PAYOS_API_URL = "https://api.payos.vn/v2";
const USE_MOCK_RESPONSE = false;

serve(async (req) => {
  console.log("Function started: payos-verify-payment");
  
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  try {
    // Support both GET and POST methods
    let orderId;
    
    if (req.method === 'GET') {
      // Extract orderId from query parameters
      const url = new URL(req.url);
      orderId = url.searchParams.get('orderId');
    } else if (req.method === 'POST') {
      // Extract orderId from request body
      const { orderId: bodyOrderId } = await req.json();
      orderId = bodyOrderId;
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
      );
    }

    if (!orderId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing orderId parameter" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get transaction details from database
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (transactionError) {
      console.error("Error fetching transaction:", transactionError);
      return new Response(
        JSON.stringify({ success: false, error: "Transaction not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // If the transaction is already marked as completed, return success
    if (transaction.status === 'completed') {
      return new Response(
        JSON.stringify({ success: true, message: "Payment already completed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // For testing purposes, use mock response
    if (USE_MOCK_RESPONSE) {
      console.log("Using mock response for verify payment");
      
      // Simulate a successful payment (with 30% chance of success for testing)
      const isSuccess = Math.random() < 0.3;
      
      if (isSuccess) {
        // Update transaction status
        await supabase
          .from('payment_transactions')
          .update({ status: 'completed' })
          .eq('order_id', orderId);

        // Get plan details from the transaction
        const { data: plan } = await supabase
          .from('premium_plans')
          .select('*')
          .eq('id', transaction.plan_id)
          .single();

        if (plan) {
          // Calculate subscription end date
          const now = new Date();
          const endDate = new Date(now);
          endDate.setDate(now.getDate() + plan.duration_days);

          // Create subscription record
          await supabase
            .from('user_subscriptions')
            .insert({
              user_id: transaction.user_id,
              plan_id: transaction.plan_id,
              payment_id: transaction.id,
              start_date: now.toISOString(),
              end_date: endDate.toISOString(),
              status: 'active'
            });

          // Update user profile to premium
          await supabase
            .from('profiles')
            .update({ is_premium: true })
            .eq('id', transaction.user_id);
        }

        return new Response(
          JSON.stringify({ success: true, message: "Payment completed successfully" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      } else {
        return new Response(
          JSON.stringify({ success: false, message: "Payment is still pending" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // Make request to PayOS API to check payment status
    try {
      const payosResponse = await fetch(`${PAYOS_API_URL}/payment-requests/${orderId}`, {
        method: 'GET',
        headers: {
          'x-client-id': PAYOS_CLIENT_ID,
          'x-api-key': PAYOS_API_KEY
        }
      });

      if (!payosResponse.ok) {
        console.error(`PayOS API error: ${payosResponse.status}`);
        return new Response(
          JSON.stringify({ success: false, error: "Error checking payment status" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      const payosResult = await payosResponse.json();
      console.log("PayOS payment status response:", payosResult);

      if (!payosResult.code || payosResult.code !== '00') {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid PayOS response" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      const paymentStatus = payosResult.data.status;
      
      // Handle different payment statuses
      if (paymentStatus === 'PAID') {
        // Update transaction status
        await supabase
          .from('payment_transactions')
          .update({ status: 'completed' })
          .eq('order_id', orderId);

        // Get plan details from the transaction
        const { data: plan } = await supabase
          .from('premium_plans')
          .select('*')
          .eq('id', transaction.plan_id)
          .single();

        if (plan) {
          // Calculate subscription end date
          const now = new Date();
          const endDate = new Date(now);
          endDate.setDate(now.getDate() + plan.duration_days);

          // Create subscription record
          await supabase
            .from('user_subscriptions')
            .insert({
              user_id: transaction.user_id,
              plan_id: transaction.plan_id,
              payment_id: transaction.id,
              start_date: now.toISOString(),
              end_date: endDate.toISOString(),
              status: 'active'
            });

          // Update user profile to premium
          await supabase
            .from('profiles')
            .update({ is_premium: true })
            .eq('id', transaction.user_id);
        }

        return new Response(
          JSON.stringify({ success: true, message: "Payment completed successfully" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      } else if (paymentStatus === 'CANCELLED' || paymentStatus === 'EXPIRED') {
        // Update transaction status
        await supabase
          .from('payment_transactions')
          .update({ status: 'failed' })
          .eq('order_id', orderId);

        return new Response(
          JSON.stringify({ success: false, message: "Payment was cancelled or expired" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      } else {
        // Payment is still pending
        return new Response(
          JSON.stringify({ success: false, message: "Payment is still pending" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    } catch (error) {
      console.error("Error verifying payment with PayOS:", error);
      return new Response(
        JSON.stringify({ success: false, error: String(error) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
