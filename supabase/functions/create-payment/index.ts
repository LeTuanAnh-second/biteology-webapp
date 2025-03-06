
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PAYOS_CLIENT_ID = Deno.env.get('PAYOS_CLIENT_ID')
const PAYOS_API_KEY = Deno.env.get('PAYOS_API_KEY')
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

    // Get request body
    const { planId, userId } = await req.json()

    // Validate parameters
    if (!planId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get plan details from the premium_plans table
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

    // Generate unique orderCode (using UUID v4 for better uniqueness)
    const orderCode = crypto.randomUUID()

    // Call PayOS API to create payment request
    const paymentResponse = await fetch('https://api.payos.vn/v2/payment-requests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYOS_API_KEY}`,
        'Content-Type': 'application/json',
        'x-client-id': PAYOS_CLIENT_ID
      },
      body: JSON.stringify({
        amount: plan.price,
        description: `Thanh toán gói ${plan.name} Biteology`,
        orderCode: orderCode,
        returnUrl: 'https://biteology.netlify.app/payment-success',
        cancelUrl: 'https://biteology.netlify.app/payment-cancel',
        webhookUrl: 'https://ijvtkufzaweqzwczpvgr.supabase.co/functions/v1/webhook-payment'
      })
    })

    const paymentData = await paymentResponse.json()
    console.log('PayOS response:', paymentData)

    if (!paymentData.checkoutUrl) {
      console.error('PayOS error:', paymentData)
      return new Response(
        JSON.stringify({ error: 'Failed to create payment request', details: paymentData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store payment information in Supabase
    const { data: transactionData, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        plan_id: plan.id,
        amount: plan.price,
        payment_method: 'payos',
        status: 'pending',
        order_id: orderCode
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

    // Return the checkout URL and order code
    return new Response(
      JSON.stringify({ 
        checkoutUrl: paymentData.checkoutUrl,
        orderCode: orderCode,
        transactionId: transactionData.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
