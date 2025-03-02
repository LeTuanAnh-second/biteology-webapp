
// Deno edge function to create a PayOS payment order

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import * as crypto from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

// Set up the Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// PayOS API configuration
const PAYOS_CLIENT_ID = "584c3026-5cb1-4ddb-b94b-cfdea981eda3";
const PAYOS_API_KEY = "2905ca16-e50e-4932-9024-f25ba3035b6d";
const PAYOS_CHECKSUM_KEY = "a74c993745c88673adbd40ec0ba6e84efffd656f4f51f70889fee905ffa67ff9";
const PAYOS_API_URL = "https://api-merchant.payos.vn";

// Set CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a random order code
function generateOrderCode() {
  return 'ORDER_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

async function createOrder(planId: string, userId: string) {
  try {
    console.log(`Creating order for plan ${planId} and user ${userId}`);
    console.log("Environment variables:", {
      supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
    });
    
    // Fetch plan details
    const { data: plan, error: planError } = await supabase
      .from('premium_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (planError || !plan) {
      console.error('Error fetching plan:', planError);
      return { success: false, error: 'Plan not found' };
    }
    
    const orderCode = generateOrderCode();
    const amount = plan.price;
    const orderInfo = `Nâng cấp tài khoản Premium - ${plan.name}`;
    
    console.log("Order details:", {
      orderCode,
      amount,
      orderInfo,
      planName: plan.name
    });
    
    // Create order record in the database first
    const { error: orderError } = await supabase
      .from('premium_orders')
      .insert({
        id: orderCode,
        user_id: userId,
        plan_id: planId,
        amount: amount,
        status: 'pending',
        payment_method: 'payos',
        order_info: orderInfo
      });
    
    if (orderError) {
      console.error('Error creating order record:', orderError);
      return { success: false, error: 'Failed to create order record' };
    }
    
    // Calculate checksum for PayOS API
    const dataStr = `amount=${amount}&cancelUrl=https://biteology.app/premium&description=${orderInfo}&orderCode=${orderCode}&returnUrl=https://biteology.app/payment-result?orderCode=${orderCode}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(dataStr + PAYOS_CHECKSUM_KEY);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log("PayOS API request details:", {
      url: `${PAYOS_API_URL}/v2/payment-requests`,
      orderCode,
      amount,
      description: orderInfo,
      signature: hashHex.substring(0, 10) + "..." // Log chỉ một phần của signature để bảo mật
    });
    
    // Call PayOS API to create payment order
    const payosResponse = await fetch(`${PAYOS_API_URL}/v2/payment-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': PAYOS_CLIENT_ID,
        'x-api-key': PAYOS_API_KEY
      },
      body: JSON.stringify({
        orderCode: orderCode,
        amount: amount,
        description: orderInfo,
        buyerName: userId,
        cancelUrl: `https://biteology.app/premium`,
        returnUrl: `https://biteology.app/payment-result?orderCode=${orderCode}`,
        signature: hashHex
      })
    });
    
    if (!payosResponse.ok) {
      console.error('PayOS API error:', payosResponse.status, payosResponse.statusText);
      const errorBody = await payosResponse.text();
      console.error('PayOS error response:', errorBody);
      
      await supabase
        .from('premium_orders')
        .update({ status: 'failed' })
        .eq('id', orderCode);
        
      return { success: false, error: 'Failed to create payment with PayOS' };
    }
    
    const payosResult = await payosResponse.json();
    console.log('PayOS response:', payosResult);
    
    if (!payosResult.success) {
      await supabase
        .from('premium_orders')
        .update({ status: 'failed' })
        .eq('id', orderCode);
        
      return { success: false, error: payosResult.message || 'Failed to create payment' };
    }
    
    console.log('Successfully created order with QR code');
    
    // Return QR code data
    return {
      success: true,
      data: {
        orderId: orderCode,
        qrCodeUrl: payosResult.data?.qrCode || '',
        amount: amount,
        orderInfo: orderInfo,
        status: 'pending'
      }
    };
    
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: 'Failed to create payment order' };
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
    if (req.method === 'POST') {
      console.log("Processing POST request");
      const body = await req.json();
      const { planId, userId } = body;
      
      console.log("Request body:", { planId, userId });
      
      if (!planId || !userId) {
        console.error("Missing required fields");
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required fields: planId or userId' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      const result = await createOrder(planId, userId);
      console.log("Order creation result:", result);
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.error("Method not allowed:", req.method);
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
