
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { create } from 'https://deno.land/x/djwt@v2.8/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    )

    // Get request data and headers
    const webhookData = await req.json()
    const signature = req.headers.get('x-payos-signature')

    if (!signature) {
      console.error('Missing PayOS signature')
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Received webhook data:', webhookData)
    console.log('Signature:', signature)

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
      // Get plan details
      const { data: plan } = await supabase
        .from('premium_plans')
        .select('*')
        .eq('id', transaction.plan_id)
        .single()

      if (!plan) {
        console.error('Plan not found')
        return new Response(
          JSON.stringify({ error: 'Plan not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate end date based on plan duration
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + plan.duration_days)

      // Create subscription
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: transaction.user_id,
          plan_id: plan.id,
          transaction_id: transaction.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'active'
        })

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError)
        return new Response(
          JSON.stringify({ error: 'Failed to create subscription' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update user's premium status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', transaction.user_id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
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
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
