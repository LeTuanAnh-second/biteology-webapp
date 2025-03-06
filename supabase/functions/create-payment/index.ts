
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
    const { amount, planName, userId } = await req.json()

    // Validate parameters
    if (!amount || !planName || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate unique orderCode
    const orderCode = `${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Call PayOS API to create payment request
    const paymentResponse = await fetch('https://api.payos.vn/v2/payment-requests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYOS_API_KEY}`,
        'Content-Type': 'application/json',
        'x-client-id': PAYOS_CLIENT_ID
      },
      body: JSON.stringify({
        amount: amount,
        description: `Thanh toán gói ${planName} Biteology`,
        orderCode: orderCode,
        returnUrl: 'https://biteology.netlify.app/payment-success',
        cancelUrl: 'https://biteology.netlify.app/payment-cancel',
        webhookUrl: 'https://biteology.netlify.app/api/payment-webhook'
      })
    })

    const paymentData = await paymentResponse.json()

    if (!paymentData.checkoutUrl) {
      console.error('PayOS error:', paymentData)
      return new Response(
        JSON.stringify({ error: 'Failed to create payment request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store payment information in Supabase
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        order_code: orderCode,
        amount: amount,
        plan_name: planName,
        status: 'PENDING',
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Supabase error:', error)
    }

    // Return the checkout URL
    return new Response(
      JSON.stringify({ 
        checkoutUrl: paymentData.checkoutUrl,
        orderCode: orderCode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
