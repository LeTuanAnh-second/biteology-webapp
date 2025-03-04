
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

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

serve(async (req) => {
  console.log("Function started: payos-webhook");
  
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  try {
    // Verify request method
    if (req.method !== 'POST') {
      console.error("Method not allowed:", req.method);
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
      );
    }

    // Parse webhook payload
    let payload;
    try {
      payload = await req.json();
      console.log("Received webhook payload:", JSON.stringify(payload));
    } catch (error) {
      console.error("Invalid JSON payload:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid payload" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate PayOS webhook signature (optional but recommended)
    // Here you would validate the signature using PAYOS_CHECKSUM_KEY
    // This step depends on PayOS webhook implementation

    // Process the webhook based on event type
    // The exact structure depends on PayOS webhook format
    const { transactionInfo, orderCode, amount, status } = payload;
    
    if (!orderCode) {
      console.error("Missing order code in webhook payload");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid webhook data" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Lookup the transaction in our database
    const { data: transaction, error: lookupError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', orderCode)
      .single();

    if (lookupError || !transaction) {
      console.error("Transaction not found:", orderCode, lookupError);
      return new Response(
        JSON.stringify({ success: false, error: "Transaction not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    console.log("Found transaction:", transaction);

    // Update transaction status based on webhook data
    if (status === 'PAID' || status === 'COMPLETED' || status === 'SUCCESS') {
      // Payment successful - update transaction and activate subscription
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({ 
          status: 'success',
          updated_at: new Date().toISOString(),
          payment_data: payload
        })
        .eq('order_id', orderCode);

      if (updateError) {
        console.error("Error updating transaction:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to update transaction" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      // Activate subscription
      const { data: plan } = await supabase
        .from('premium_plans')
        .select('duration_days')
        .eq('id', transaction.plan_id)
        .single();

      if (plan) {
        const durationDays = plan.duration_days || 30; // Default to 30 days if not specified
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + durationDays);

        const { error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: transaction.user_id,
            plan_id: transaction.plan_id,
            start_date: new Date().toISOString(),
            end_date: endDate.toISOString(),
            status: 'active',
            payment_transaction_id: transaction.id
          });

        if (subscriptionError) {
          console.error("Error creating subscription:", subscriptionError);
          // We don't return an error here as the payment was still successful
        }
      }

      console.log("Payment processed successfully");
    } else if (status === 'CANCELLED' || status === 'FAILED' || status === 'ERROR') {
      // Payment failed or cancelled
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString(),
          payment_data: payload
        })
        .eq('order_id', orderCode);

      if (updateError) {
        console.error("Error updating transaction:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to update transaction" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      console.log("Payment failed or cancelled");
    } else {
      // Status is pending or unknown
      console.log("Payment status is pending or unknown:", status);
    }

    // Return success response to acknowledge webhook receipt
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Unexpected error processing webhook:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
})
