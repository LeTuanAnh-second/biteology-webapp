
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import * as crypto from 'https://deno.land/std@0.110.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-payos-signature',
}

const PAYOS_CHECKSUM_KEY = Deno.env.get('PAYOS_CHECKSUM_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get request body raw text for signature verification
    const bodyText = await req.text()
    const signature = req.headers.get('x-payos-signature')

    console.log('Received webhook request')
    console.log('Signature:', signature)
    
    // Validate signature if checksum key is available
    if (PAYOS_CHECKSUM_KEY && signature) {
      try {
        const computedSignature = crypto
          .createHmac('sha256', PAYOS_CHECKSUM_KEY)
          .update(bodyText)
          .digest('hex')
        
        console.log('Computed signature:', computedSignature)
        
        if (computedSignature !== signature) {
          console.error('Invalid signature')
          return new Response(
            JSON.stringify({ error: 'Invalid signature' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } catch (signError) {
        console.error('Error verifying signature:', signError)
      }
    } else if (!signature) {
      console.error('Missing PayOS signature')
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the webhook data
    const webhookData = JSON.parse(bodyText)
    console.log('Webhook data:', webhookData)

    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    )

    const { orderCode, status, amount, transactionId } = webhookData

    if (!orderCode) {
      console.error('Missing orderCode in webhook data')
      return new Response(
        JSON.stringify({ error: 'Invalid webhook data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find the payment transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', orderCode)
      .single()

    if (transactionError || !transaction) {
      console.error('Transaction not found:', transactionError)
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found transaction:', transaction)

    // Update transaction status
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({ 
        status: status,
        payment_id: transactionId,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderCode)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If payment is successful, create or update subscription
    if (status === 'PAID') {
      // Get plan details from premium_plans table
      const { data: plan, error: planError } = await supabase
        .from('premium_plans')
        .select('*')
        .eq('id', transaction.plan_id)
        .single()

      if (planError || !plan) {
        console.error('Plan not found:', planError)
        return new Response(
          JSON.stringify({ error: 'Plan not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Found plan:', plan)

      // Calculate end date based on plan duration
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + plan.duration_days)

      // Check if there's an existing subscription for the user
      const { data: existingSubscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', transaction.user_id)
        .maybeSingle()

      if (existingSubscription) {
        // Update existing subscription
        const { error: subUpdateError } = await supabase
          .from('user_subscriptions')
          .update({
            plan_id: plan.id,
            transaction_id: transaction.id,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id)

        if (subUpdateError) {
          console.error('Error updating subscription:', subUpdateError)
        } else {
          console.log('Updated existing subscription')
        }
      } else {
        // Create new subscription
        const { error: subCreateError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: transaction.user_id,
            plan_id: plan.id,
            transaction_id: transaction.id,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: 'active'
          })

        if (subCreateError) {
          console.error('Error creating subscription:', subCreateError)
        } else {
          console.log('Created new subscription')
        }
      }

      // Also check and update subscription_detail table for backward compatibility
      const { data: existingLegacySubscription } = await supabase
        .from('subscription_detail')
        .select('*')
        .eq('user_id', transaction.user_id)
        .maybeSingle()

      if (existingLegacySubscription) {
        // Update existing subscription in legacy table
        const { error: legacySubUpdateError } = await supabase
          .from('subscription_detail')
          .update({
            plan_name: plan.name,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: 'ACTIVE'
          })
          .eq('id', existingLegacySubscription.id)

        if (legacySubUpdateError) {
          console.error('Error updating legacy subscription:', legacySubUpdateError)
        }
      }

      // Update user's premium status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', transaction.user_id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
      } else {
        console.log('Updated profile premium status')
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
        } 
      }
    )
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
