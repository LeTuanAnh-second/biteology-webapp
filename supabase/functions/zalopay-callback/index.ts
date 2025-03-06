
// Follow this setup guide to integrate the Deno runtime and the Edge library:
// https://supabase.com/docs/guides/functions/getting-started#create-a-function

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import * as crypto from 'https://deno.land/std@0.167.0/crypto/mod.ts'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const data = await req.json()
    console.log('ZaloPay callback received:', data)

    // In a real implementation, verify the callback data with ZaloPay
    // For demo purposes, we'll simulate successful payment

    // ZaloPay configuration
    const ZALOPAY_KEY2 = Deno.env.get('ZALOPAY_KEY2') ?? ''

    if (!ZALOPAY_KEY2) {
      return new Response(
        JSON.stringify({ error: 'ZaloPay configuration is missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // In a real implementation, verify the callback data signature
    // const dataToVerify = `data=${JSON.stringify(data.data)}&mac=${data.mac}`
    // const calculatedMac = await generateHmacSha256(dataToVerify, ZALOPAY_KEY2)
    // if (calculatedMac !== data.mac) {
    //   return new Response(
    //     JSON.stringify({ error: 'Invalid signature' }),
    //     { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    //   )
    // }

    // Simulated data for demo
    const orderId = data.app_trans_id
    const isSuccess = data.status === 1 // 1 means success in ZaloPay

    // Update the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .update({ 
        status: isSuccess ? 'completed' : 'failed',
        payment_id: data.zp_trans_id || null,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId)
      .select()
      .single()

    if (transactionError || !transaction) {
      console.error('Error updating transaction:', transactionError)
      return new Response(
        JSON.stringify({ error: 'Transaction not found or update failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If payment is successful, create or update subscription
    if (isSuccess) {
      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from('premium_plans')
        .select('*')
        .eq('id', transaction.plan_id)
        .single()

      if (planError || !plan) {
        console.error('Error fetching plan:', planError)
        return new Response(
          JSON.stringify({ error: 'Plan not found' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate subscription end date
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + plan.duration_days)

      // Check if user already has a subscription
      const { data: existingSubscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', transaction.user_id)
        .single()

      if (existingSubscription) {
        // Update existing subscription
        await supabase
          .from('user_subscriptions')
          .update({
            plan_id: plan.id,
            transaction_id: transaction.id,
            start_date: new Date().toISOString(),
            end_date: endDate.toISOString(),
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id)
      } else {
        // Create new subscription
        await supabase
          .from('user_subscriptions')
          .insert({
            user_id: transaction.user_id,
            plan_id: plan.id,
            transaction_id: transaction.id,
            start_date: new Date().toISOString(),
            end_date: endDate.toISOString(),
            status: 'active'
          })
      }

      // Update user's premium status
      await supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', transaction.user_id)
    }

    return new Response(
      JSON.stringify({ return_code: 1, return_message: 'success' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing ZaloPay callback:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
