
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

serve(async (req) => {
  console.log("Function started: payos-create-order");
  
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authorization token' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Parse request body
    const requestData = await req.json();
    const { planId } = requestData;

    if (!planId) {
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
      return new Response(
        JSON.stringify({ success: false, error: "Plan not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Create order ID
    const orderId = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const amount = Math.round(plan.price);
    const description = `Nâng cấp tài khoản Premium - ${plan.name}`;
    
    // Create a transaction record
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        amount,
        payment_method: 'payos',
        status: 'pending',
        order_id: orderId
      });

    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create transaction" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Create PayOS payment request
    const returnUrl = `https://biteology.netlify.app/payment-result?orderCode=${orderId}`;
    const cancelUrl = `https://biteology.netlify.app/payment-result?status=cancelled&orderCode=${orderId}`;
    const webhookUrl = `${supabaseUrl}/functions/v1/payos-webhook`;
    
    const paymentData = {
      orderCode: orderId,
      amount,
      description,
      cancelUrl,
      returnUrl,
      expiredAt: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes from now
      items: [
        {
          name: `Gói Premium ${plan.name}`,
          quantity: 1,
          price: amount
        }
      ]
    };

    console.log("Creating PayOS payment request:", paymentData);
    console.log("PayOS API URL:", PAYOS_API_URL);
    console.log("PayOS Client ID:", PAYOS_CLIENT_ID ? "Set" : "Not set");
    console.log("PayOS API Key:", PAYOS_API_KEY ? "Set" : "Not set");

    try {
      const payosResponse = await fetch(`${PAYOS_API_URL}/payment-requests`, {
        method: 'POST',
        headers: {
          'x-client-id': PAYOS_CLIENT_ID,
          'x-api-key': PAYOS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const responseText = await payosResponse.text();
      console.log(`PayOS API response (${payosResponse.status}):`, responseText);
      
      if (!payosResponse.ok) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `PayOS API error: ${payosResponse.status}`,
            details: responseText
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      const payosResult = JSON.parse(responseText);
      console.log("PayOS parsed response:", payosResult);

      if (!payosResult.code || payosResult.code !== '00' || !payosResult.data) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Invalid PayOS response", 
            details: payosResult
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      // Return successful response
      return new Response(
        JSON.stringify({
          success: true,
          orderId,
          checkoutUrl: payosResult.data.checkoutUrl,
          qrCode: payosResult.data.qrCode
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );

    } catch (error) {
      console.error("PayOS API error:", error);
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
