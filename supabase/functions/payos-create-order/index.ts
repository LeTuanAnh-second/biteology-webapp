
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

// PayOS configs - we'll add direct request validation
const PAYOS_CLIENT_ID = Deno.env.get("PAYOS_CLIENT_ID") || "";
const PAYOS_API_KEY = Deno.env.get("PAYOS_API_KEY") || "";
const PAYOS_CHECKSUM_KEY = Deno.env.get("PAYOS_CHECKSUM_KEY") || "";
// Use production URL
const PAYOS_API_URL = "https://api.payos.vn";

serve(async (req) => {
  console.log("Function started: payos-create-order");
  
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  try {
    // Verify request body
    if (req.method !== 'POST') {
      console.error("Method not allowed:", req.method);
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
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

    console.log("Environment variables:", {
      supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasPayosClientId: !!PAYOS_CLIENT_ID,
      hasPayosApiKey: !!PAYOS_API_KEY,
      hasPayosChecksumKey: !!PAYOS_CHECKSUM_KEY
    });

    // Validate PayOS credentials before proceeding
    if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY) {
      console.error("Missing PayOS credentials");
      return new Response(
        JSON.stringify({ success: false, error: "Payment provider configuration error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized", details: authError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Parse request body
    const requestData = await req.json();
    const { planId, userId, callbackUrl } = requestData;

    console.log("Request data:", { planId, userId, callbackUrl });

    if (!planId || !userId) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('premium_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      console.error("Error fetching plan:", planError);
      return new Response(
        JSON.stringify({ success: false, error: "Plan not found", details: planError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    console.log("Plan details:", plan);

    // Create a unique order ID
    const orderId = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const amount = Math.round(plan.price); // Ensure amount is an integer
    const description = `Nâng cấp tài khoản Premium - ${plan.name}`;

    // Use application base URL or fallback
    const appBaseUrl = callbackUrl || "https://biteology-webapp.lovable.app";
    
    // Get webhook URL from the base app URL
    const webhookUrl = `${supabaseUrl}/functions/v1/payos-webhook`;
    console.log("Using webhook URL:", webhookUrl);
    
    // Create PayOS order
    const paymentData = {
      orderCode: orderId,
      amount,
      description,
      cancelUrl: `${appBaseUrl}/payment-result?status=cancelled&orderCode=${orderId}`,
      returnUrl: `${appBaseUrl}/payment-result?orderCode=${orderId}`,
      expiredAt: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
      webhookUrl: webhookUrl
    };

    console.log("Payment data:", paymentData);

    // Store transaction in database first (before the API call)
    try {
      const { error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: userId,
          plan_id: planId,
          amount,
          payment_method: 'payos',
          status: 'pending',
          order_id: orderId
        });

      if (transactionError) {
        console.error("Error storing transaction:", transactionError);
        // We'll continue despite the error to not block the payment process
      }
    } catch (dbError) {
      console.error("Database error:", dbError);
      // Continue anyway to try the payment provider
    }

    // Call PayOS API to create payment with timeout
    try {
      // Set a timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      console.log("Calling PayOS API...");
      const payosResponse = await fetch(`${PAYOS_API_URL}/v1/payment-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': PAYOS_CLIENT_ID,
          'x-api-key': PAYOS_API_KEY
        },
        body: JSON.stringify(paymentData),
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));

      console.log("PayOS response status:", payosResponse.status);

      if (!payosResponse.ok) {
        const errorText = await payosResponse.text();
        console.error("PayOS API error:", payosResponse.status, errorText);
        throw new Error(`PayOS API error: ${payosResponse.status} - ${errorText}`);
      }

      const payosResult = await payosResponse.json();
      console.log("PayOS response:", payosResult);

      if (!payosResult.data || !payosResult.data.checkoutUrl) {
        console.error("Invalid PayOS response:", payosResult);
        throw new Error("Invalid response from payment provider");
      }

      // Return success with payment data
      const responseData = {
        success: true,
        data: {
          orderId,
          qrCodeUrl: payosResult.data.qrCode,
          amount,
          orderInfo: description,
          status: 'pending',
          paymentUrl: payosResult.data.checkoutUrl
        }
      };

      console.log("Response data:", responseData);
      return new Response(
        JSON.stringify(responseData),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } catch (payosError) {
      console.error("PayOS API request error:", payosError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to connect to payment provider", 
          details: payosError.message || "Unknown error" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Failed to create payment order", 
        details: error.message || "Unknown error" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
})
