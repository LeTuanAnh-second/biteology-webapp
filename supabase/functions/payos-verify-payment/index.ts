
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
const PAYOS_API_URL = "https://api-sandbox.payos.vn/v2"; // Using sandbox URL for testing

serve(async (req) => {
  console.log("Function started: payos-verify-payment");
  
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  try {
    let orderId: string;
    
    // Handle both GET and POST methods
    if (req.method === 'GET') {
      // Extract orderId from URL params
      const url = new URL(req.url);
      orderId = url.searchParams.get('orderId') || '';
      
      if (!orderId) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing orderId parameter" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
    } else if (req.method === 'POST') {
      // Extract orderId from request body
      const requestData = await req.json();
      orderId = requestData.orderId || '';
      
      if (!orderId) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing orderId in request body" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First check if the transaction is already completed in our database
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (transactionError) {
      console.error("Error fetching transaction:", transactionError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch transaction" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!transaction) {
      return new Response(
        JSON.stringify({ success: false, error: "Transaction not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    console.log("Found transaction:", transaction);
    
    // If transaction is already completed, return success
    if (transaction.status === 'completed') {
      return new Response(
        JSON.stringify({ success: true, message: "Payment already completed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Call PayOS API to check payment status
    try {
      console.log(`Checking payment status for order: ${orderId}`);
      
      const payosResponse = await fetch(`${PAYOS_API_URL}/payment-requests/${orderId}`, {
        method: 'GET',
        headers: {
          'x-client-id': PAYOS_CLIENT_ID,
          'x-api-key': PAYOS_API_KEY,
        }
      });

      const responseText = await payosResponse.text();
      console.log(`PayOS API response (${payosResponse.status}):`, responseText);

      if (!payosResponse.ok) {
        // If PayOS API returns an error, we'll try to parse it and return a meaningful error
        let errorMessage = "Failed to check payment status";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse the error, just use the default message
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: errorMessage,
            details: responseText
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      // Parse the response
      let payosData;
      try {
        payosData = JSON.parse(responseText);
      } catch (e) {
        console.error("Error parsing PayOS response:", e);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid response from PayOS" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      console.log("PayOS parsed data:", payosData);

      // Check if the payment was successful
      const isPaymentSuccess = 
        payosData.code === '00' && 
        payosData.data && 
        payosData.data.status === 'PAID';

      if (isPaymentSuccess) {
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
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
          );
        }

        // Get plan details
        const { data: plan } = await supabase
          .from('premium_plans')
          .select('duration_days')
          .eq('id', transaction.plan_id)
          .single();

        if (plan) {
          // Calculate subscription end date
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + (plan.duration_days || 30));

          // Check if user already has a subscription
          const { data: existingSub } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', transaction.user_id)
            .eq('status', 'active')
            .maybeSingle();

          if (existingSub) {
            // Update existing subscription
            await supabase
              .from('user_subscriptions')
              .update({
                plan_id: transaction.plan_id,
                start_date: new Date().toISOString(),
                end_date: endDate.toISOString(),
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
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Payment successful and subscription updated"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      } else {
        // Payment not successful yet
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Payment not completed yet",
            status: payosData.data?.status || "UNKNOWN"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    } catch (error) {
      console.error("Error checking payment with PayOS:", error);
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
