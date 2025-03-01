
// Follow this setup guide to integrate the Deno runtime and the Edge library:
// https://supabase.com/docs/guides/functions/getting-started#create-a-function

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import * as crypto from 'https://deno.land/std@0.167.0/crypto/mod.ts'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to generate a unique order ID
function generateOrderId(): string {
  return Date.now().toString();
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

    // MoMo configuration (these should be stored as secrets)
    const MOMO_PARTNER_CODE = Deno.env.get('MOMO_PARTNER_CODE') ?? ''
    const MOMO_ACCESS_KEY = Deno.env.get('MOMO_ACCESS_KEY') ?? ''
    const MOMO_SECRET_KEY = Deno.env.get('MOMO_SECRET_KEY') ?? ''
    const MOMO_ENDPOINT = Deno.env.get('MOMO_ENDPOINT') ?? 'https://test-payment.momo.vn/v2/gateway/api/create'

    if (!MOMO_PARTNER_CODE || !MOMO_ACCESS_KEY || !MOMO_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'MoMo configuration is missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate order data
    const orderId = generateOrderId()
    const requestId = orderId
    const amount = Math.round(Number(plan.price))
    const orderInfo = `Thanh toán gói ${plan.name}`
    const redirectUrl = `${Deno.env.get('PUBLIC_URL') || 'http://localhost:5173'}/payment-result`
    const ipnUrl = `${supabaseUrl}/functions/v1/momo-verify-payment`
    const extraData = JSON.stringify({
      planId: plan.id,
      userId: userId
    })

    // Prepare order data for MoMo
    const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_PARTNER_CODE}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureWallet`
    
    // Generate signature
    const encoder = new TextEncoder()
    const data = encoder.encode(rawSignature)
    const key = encoder.encode(MOMO_SECRET_KEY)
    
    const hmac = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )
    
    const signature = await crypto.subtle.sign("HMAC", hmac, data)
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Prepare payload for MoMo
    const requestBody = {
      partnerCode: MOMO_PARTNER_CODE,
      accessKey: MOMO_ACCESS_KEY,
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: redirectUrl,
      ipnUrl: ipnUrl,
      extraData: extraData,
      requestType: "captureWallet",
      signature: signatureHex,
      lang: "vi"
    }

    // Create a new transaction record in our database
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        plan_id: planId,
        amount: plan.price,
        status: 'pending',
        payment_method: 'momo',
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

    // Make request to MoMo API
    try {
      const momoResponse = await fetch(MOMO_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      const momoData = await momoResponse.json()
      
      if (momoData.resultCode !== 0) {
        console.error('MoMo API error:', momoData)
        return new Response(
          JSON.stringify({ error: momoData.message || 'Failed to create MoMo payment' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            orderId: orderId,
            payUrl: momoData.payUrl
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      console.error('Error calling MoMo API:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to communicate with MoMo API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
