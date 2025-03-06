
// Follow this setup guide to integrate the Deno runtime and the Edge library:
// https://supabase.com/docs/guides/functions/getting-started#create-a-function

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import * as crypto from 'https://deno.land/std@0.167.0/crypto/mod.ts'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to encode to base64
function encodeBase64(input: string): string {
  return btoa(input)
}

// Helper function to generate a unique order ID
function generateOrderId(): string {
  return Date.now().toString()
}

// Helper function to generate HMAC-SHA256 signature
async function generateHmacSha256(message: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secretKey)
  const messageData = encoder.encode(message)
  
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  
  const signature = await crypto.subtle.sign("HMAC", key, messageData)
  const hashArray = Array.from(new Uint8Array(signature))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseKey)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    // Get request body
    const { planId, userId } = await req.json()

    if (!planId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: planId or userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the premium plan details
    const { data: plan, error: planError } = await supabase
      .from('premium_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      console.error('Error fetching plan:', planError)
      return new Response(
        JSON.stringify({ error: 'Plan not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ZaloPay configuration (these should be stored as secrets)
    const ZALOPAY_APP_ID = Deno.env.get('ZALOPAY_APP_ID') ?? ''
    const ZALOPAY_KEY1 = Deno.env.get('ZALOPAY_KEY1') ?? ''
    const ZALOPAY_API_URL = 'https://sandbox.zalopay.com.vn/v001/tpe/createorder'

    if (!ZALOPAY_APP_ID || !ZALOPAY_KEY1) {
      return new Response(
        JSON.stringify({ error: 'ZaloPay configuration is missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate order data
    const orderId = generateOrderId()
    const amount = Math.round(Number(plan.price))
    const description = `Thanh toán gói ${plan.name}`
    const appUser = userId
    const callbackUrl = `${supabaseUrl}/functions/v1/zalopay-callback`
    const embedData = JSON.stringify({
      planId: plan.id,
      userId: userId,
      redirectUrl: `${window.location.origin}/payment-result`,
    })

    // Generate order data string for signature
    const orderDataStr = `appid=${ZALOPAY_APP_ID}&appuser=${appUser}&apptime=${Date.now()}&amount=${amount}&apptransid=${orderId}&embeddata=${encodeBase64(embedData)}&item=[]&description=${description}`
    
    // Generate MAC
    const mac = await generateHmacSha256(orderDataStr, ZALOPAY_KEY1)

    // Prepare order data for ZaloPay
    const orderData = {
      app_id: ZALOPAY_APP_ID,
      app_user: appUser,
      app_time: Date.now(),
      amount: amount,
      app_trans_id: orderId,
      embed_data: encodeBase64(embedData),
      item: '[]',
      description: description,
      mac: mac,
      callback_url: callbackUrl
    }

    // Create a new transaction record in our database
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        plan_id: planId,
        amount: plan.price,
        status: 'pending',
        payment_method: 'zalopay',
        order_id: orderId
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // In a production environment, you would make an actual API call to ZaloPay
    // For sandbox/demo purposes, we'll simulate the response
    // In a real implementation, replace this with an actual fetch call to ZALOPAY_API_URL
    
    // Simulated ZaloPay response (for demo/sandbox)
    const simulatedZaloPayResponse = {
      return_code: 1, // 1 means success
      return_message: 'success',
      sub_return_code: 1,
      sub_return_message: 'success',
      order_url: `https://sbgateway.zalopay.vn/pay?order=demo_${orderId}`,
      zp_trans_token: `zalo_${Date.now()}`
    }

    // For real implementation, uncomment and use this:
    /*
    const zaloResponse = await fetch(ZALOPAY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    })
    const zaloPayResponse = await zaloResponse.json()
    */

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          transactionId: transaction.id,
          order_url: simulatedZaloPayResponse.order_url,
          zp_trans_token: simulatedZaloPayResponse.zp_trans_token
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
