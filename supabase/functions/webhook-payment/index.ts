
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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

    // Get webhook data
    const webhookData = await req.json()
    console.log('Received webhook:', webhookData)

    // TODO: Verify checksum when needed
    // For now, process the webhook data

    const { orderCode, status, amount, transactionId } = webhookData

    if (!orderCode || !status) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update payment status in database
    const { data: transactionData, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_code', orderCode)
      .single()

    if (fetchError) {
      console.error('Error fetching transaction:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the transaction
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({ 
        status: status,
        updated_at: new Date().toISOString(),
        transaction_id: transactionId
      })
      .eq('order_code', orderCode)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
    }

    // If status is PAID, update user's subscription
    if (status === 'PAID' && transactionData) {
      const currentDate = new Date()
      let endDate = new Date(currentDate)
      
      // Set subscription end date based on plan
      if (transactionData.plan_name.includes('Monthly')) {
        endDate.setMonth(endDate.getMonth() + 1)
      } else if (transactionData.plan_name.includes('Yearly')) {
        endDate.setFullYear(endDate.getFullYear() + 1)
      }

      try {
        // First check if there's an existing subscription using UUID match
        const { data: existingSubscription } = await supabase
          .from('subscription_detail')
          .select('*')
          .eq('user_id', transactionData.user_id)
          .maybeSingle()

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
      } catch (error) {
        console.error('Error managing subscription:', error)
      }

      // Also update the profile's is_premium flag
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_premium: true })
          .eq('id', transactionData.user_id)

        if (profileError) console.error('Error updating profile premium status:', profileError)
      } catch (error) {
        console.error('Error updating profile:', error)
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
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
