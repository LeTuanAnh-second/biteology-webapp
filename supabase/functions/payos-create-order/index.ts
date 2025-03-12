
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get the request body
    const { planId } = await req.json()
    
    // Get the JWT token from the request header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      console.error('Auth error:', authError)
      throw new Error('Unauthorized')
    }

    // Get plan details
    const { data: plan, error: planError } = await supabaseClient
      .from('premium_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      console.error('Error fetching plan:', planError)
      throw new Error('Plan not found')
    }

    const orderId = uuidv4()
    const amount = Math.round(plan.price)
    const description = `Nâng cấp tài khoản lên gói ${plan.name}`
    
    console.log('Creating payment request with params:', {
      orderId,
      amount,
      description,
      planId,
      userId: user.id
    })

    const PAYOS_CLIENT_ID = Deno.env.get('PAYOS_CLIENT_ID')
    const PAYOS_API_KEY = Deno.env.get('PAYOS_API_KEY')
    const PUBLIC_SITE_URL = Deno.env.get('PUBLIC_SITE_URL') || 'https://biteology-webapp.lovable.app'

    if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY) {
      console.error('Missing PayOS configuration')
      throw new Error('PayOS configuration is missing')
    }

    // Using the production PayOS API URL
    const payosApiUrl = 'https://api.payos.vn/v2/payment-requests'
    
    try {
      // Create payment request to PayOS
      const payosResponse = await fetch(payosApiUrl, {
        method: 'POST',
        headers: {
          'x-client-id': PAYOS_CLIENT_ID,
          'x-api-key': PAYOS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderCode: orderId,
          amount,
          description,
          cancelUrl: `${PUBLIC_SITE_URL}/premium`,
          returnUrl: `${PUBLIC_SITE_URL}/payment-result?orderCode=${orderId}`,
          signature: '', // PayOS will calculate this
        }),
      })

      if (!payosResponse.ok) {
        const errorText = await payosResponse.text()
        console.error('PayOS API error:', {
          status: payosResponse.status,
          statusText: payosResponse.statusText,
          body: errorText
        })
        
        return new Response(
          JSON.stringify({
            success: false,
            error: `PayOS API error: ${payosResponse.status} ${payosResponse.statusText}`,
            details: errorText
          }),
          { 
            status: 400, // Return 400 instead of 500 to avoid non-2xx status code error
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const payosData = await payosResponse.json()
      console.log('PayOS response:', payosData)

      // Store transaction in database
      const { error: transactionError } = await supabaseClient
        .from('payment_transactions')
        .insert({
          id: orderId,
          user_id: user.id,
          plan_id: planId,
          amount: amount,
          payment_method: 'payos',
          status: 'pending'
        })

      if (transactionError) {
        console.error('Error creating transaction:', transactionError)
        throw new Error('Failed to create transaction record')
      }

      // Return the payment URLs
      return new Response(
        JSON.stringify({
          success: true,
          checkoutUrl: payosData.checkoutUrl,
          qrCode: payosData.qrCode,
          orderId: orderId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (fetchError) {
      console.error('Error calling PayOS API:', fetchError)
      throw new Error(`Error sending request to PayOS: ${fetchError.message}`)
    }
  } catch (error) {
    console.error('Error in payos-create-order:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { 
        status: 400, // Return 400 instead of 500 to avoid non-2xx status code error
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
