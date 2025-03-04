
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
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);
  
  // Always log the headers for debugging
  console.log("Request headers:", Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log("Responding to OPTIONS request with CORS headers");
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Accept all HTTP methods for maximum compatibility with PayOS webhook
    console.log("Processing webhook request");
    
    // Get the request body for POST requests
    let payload = {};
    let requestBody = "";
    
    if (req.method === 'POST') {
      try {
        // First try to parse as JSON
        try {
          payload = await req.json();
          console.log("Received webhook JSON payload:", payload);
        } catch (jsonError) {
          // If it's not JSON, get the raw text
          requestBody = await req.text();
          console.log("Received webhook text payload:", requestBody);
          
          // Try to parse it as JSON anyway (sometimes content-type is wrong)
          try {
            payload = JSON.parse(requestBody);
            console.log("Successfully parsed text as JSON:", payload);
          } catch (parseError) {
            console.log("Could not parse as JSON, treating as form data or plain text");
            
            // Try to handle as form data if it looks like it
            if (requestBody.includes('=')) {
              const formData = new URLSearchParams(requestBody);
              payload = Object.fromEntries(formData.entries());
              console.log("Parsed as form data:", payload);
            }
          }
        }
      } catch (error) {
        console.error("Error processing request body:", error);
        // Continue anyway - we'll still acknowledge the webhook
      }
    } else if (req.method === 'GET') {
      // For GET requests, extract parameters from URL
      const url = new URL(req.url);
      payload = Object.fromEntries(url.searchParams.entries());
      console.log("GET parameters:", payload);
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
      // Still return 200 OK for webhook verification
      return new Response(
        JSON.stringify({ success: true, message: "Webhook received but database connection not available" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // For GET requests or webhook verification, just acknowledge it
    if (req.method === 'GET' || Object.keys(payload).length === 0) {
      console.log("Acknowledging GET request or empty webhook verification");
      return new Response(
        JSON.stringify({ success: true, message: "Webhook endpoint is active" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Extract order information from the payload
    // PayOS webhook might send data in different formats, so we check multiple possible structures
    const orderCode = payload.orderCode || payload.order_code || 
                      (payload.data && payload.data.orderCode) || 
                      (payload.orderInfo && payload.orderInfo.orderCode);
                      
    const status = payload.status || 
                   (payload.data && payload.data.status) || 
                   (payload.orderInfo && payload.orderInfo.status);
    
    console.log("Extracted orderCode:", orderCode);
    console.log("Extracted status:", status);
    
    if (orderCode) {
      // Look up the transaction in our database
      const { data: transaction, error: lookupError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('order_id', orderCode)
        .single();

      if (lookupError) {
        console.error("Transaction lookup error:", lookupError);
        // Still return 200 to acknowledge webhook
        return new Response(
          JSON.stringify({ success: true, message: "Webhook received, but transaction lookup failed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      if (!transaction) {
        console.log("Transaction not found for orderCode:", orderCode);
        // Still return 200 to acknowledge webhook
        return new Response(
          JSON.stringify({ success: true, message: "Webhook received, but transaction not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      console.log("Found transaction:", transaction);

      // Update transaction based on webhook data
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
        } else {
          console.log("Transaction updated to success");
          
          // Activate subscription
          const { data: plan } = await supabase
            .from('premium_plans')
            .select('duration_days')
            .eq('id', transaction.plan_id)
            .single();

          if (plan) {
            const durationDays = plan.duration_days || 30;
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
            } else {
              console.log("Subscription created successfully");
            }
          }
        }
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
        } else {
          console.log("Transaction updated to failed");
        }
      } else {
        // Status is pending or unknown
        console.log("Payment status is pending or unknown:", status);
      }
    } else {
      console.log("No orderCode found in webhook payload");
    }

    // Always return success with 200 status to acknowledge webhook
    return new Response(
      JSON.stringify({ success: true, message: "Webhook processed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Unexpected error in webhook handler:", error);
    // Still return 200 OK to acknowledge receipt of the webhook
    return new Response(
      JSON.stringify({ success: true, message: "Webhook received, but processing failed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
})
