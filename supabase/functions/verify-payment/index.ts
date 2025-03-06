
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
    const { orderCode } = await req.json()

    if (!orderCode) {
      return new Response(
        JSON.stringify({ error: 'Missing orderCode parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify payment status with PayOS
    const verifyResponse = await fetch(`https://api.payos.vn/v2/payment-requests/${orderCode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYOS_API_KEY}`,
        'x-client-id': PAYOS_CLIENT_ID,
      }
    })

    const verifyData = await verifyResponse.json()
    console.log('Payment verification response:', verifyData)

    if (verifyData.error) {
      return new Response(
        JSON.stringify({ error: 'Failed to verify payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update payment status in database
    const isPaid = verifyData.status === 'PAID'

    // Get the transaction record
    const { data: transactionData, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_code', orderCode)
      .single()

    if (transactionError) {
      console.error('Error fetching transaction:', transactionError)
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the transaction status
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({ 
        status: verifyData.status,
        updated_at: new Date().toISOString()
      })
      .eq('order_code', orderCode)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
    }

    // If paid, update user's subscription
    if (isPaid && transactionData) {
      const currentDate = new Date()
      let endDate = new Date(currentDate)
      
      // Set subscription end date based on plan
      if (transactionData.plan_name.includes('Monthly')) {
        endDate.setMonth(endDate.getMonth() + 1)
      } else if (transactionData.plan_name.includes('Yearly')) {
        endDate.setFullYear(endDate.getFullYear() + 1)
      }

      // Update or create subscription
      const { data: existingSubscription } = await supabase
        .from('subscription_detail')
        .select('*')
        .eq('user_id', transactionData.user_id)
        .single()

      if (existingSubscription) {
        // Update existing subscription
        const { error: subError } = await supabase
          .from('subscription_detail')
          .update({
            plan_name: transactionData.plan_name,
            start_date: currentDate.toISOString(),
            end_date: endDate.toISOString(),
            status: 'ACTIVE'
          })
          .eq('user_id', transactionData.user_id)

        if (subError) console.error('Error updating subscription:', subError)
      } else {
        // Create new subscription
        const { error: subError } = await supabase
          .from('subscription_detail')
          .insert({
            user_id: transactionData.user_id,
            plan_name: transactionData.plan_name,
            start_date: currentDate.toISOString(),
            end_date: endDate.toISOString(),
            status: 'ACTIVE'
          })

        if (subError) console.error('Error creating subscription:', subError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        isPaid: isPaid,
        status: verifyData.status 
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
