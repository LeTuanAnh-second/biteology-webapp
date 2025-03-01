
// Follow this setup guide to integrate the Deno runtime and the Edge library:
// https://supabase.com/docs/guides/functions/getting-started#create-a-function

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import * as crypto from 'https://deno.land/std@0.167.0/crypto/mod.ts'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  try {
    const url = new URL(req.url)
    const orderId = url.searchParams.get('orderId')
    const resultCode = url.searchParams.get('resultCode')

    if (!orderId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing order ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the transaction from our database
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (transactionError || !transaction) {
      console.error('Error fetching transaction:', transactionError)
      return new Response(
        JSON.stringify({ success: false, message: 'Transaction not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if payment is successful (resultCode 0 means success in MoMo)
    const isSuccess = resultCode === '0'
    
    // Update the transaction status
    await supabase
      .from('payment_transactions')
      .update({ 
        status: isSuccess ? 'completed' : 'failed',
        payment_id: url.searchParams.get('transId') || null,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId)

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
          JSON.stringify({ success: false, message: 'Plan not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        .eq('status', 'active')
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
      
      return new Response(
        JSON.stringify({ success: true, message: 'Payment verified and subscription updated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Payment was not successful' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error verifying payment:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Error verifying payment', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
