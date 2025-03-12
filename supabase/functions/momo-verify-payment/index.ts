
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    let { orderId, transactionId } = await req.json()
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing order ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Processing MoMo transaction verification for order:', orderId)
    console.log('Transaction ID provided:', transactionId || 'None')

    // Get the transaction from the database
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (transactionError || !transaction) {
      console.error('Error fetching transaction:', transactionError)
      return new Response(
        JSON.stringify({ success: false, error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found transaction in database:', transaction)

    // If this is dev mode or a manual transaction, simulate successful payment
    const isManualTransaction = orderId.startsWith('manual-') || orderId.startsWith('momo-')
    const isDevMode = Deno.env.get('ENVIRONMENT') !== 'production' || isManualTransaction

    // If this is dev mode or a manual transaction, simulate successful payment
    if (isDevMode || isManualTransaction) {
      console.log('Development mode or manual payment, simulating successful transaction for MoMo')
      
      // If a transaction ID was provided, store it
      if (transactionId) {
        await supabase
          .from('payment_transactions')
          .update({ 
            payment_id: transactionId,
            status: 'completed'
          })
          .eq('id', transaction.id)
      } else {
        // Otherwise, just update the status
        await supabase
          .from('payment_transactions')
          .update({ status: 'completed' })
          .eq('id', transaction.id)
      }

      // Get the plan
      const { data: plan } = await supabase
        .from('premium_plans')
        .select('*')
        .eq('id', transaction.plan_id)
        .single()

      if (!plan) {
        return new Response(
          JSON.stringify({ success: false, error: 'Plan not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate subscription end date
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + plan.duration_days)

      // Check if user already has a subscription
      const { data: existingSubscription } = await supabase
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
        JSON.stringify({ 
          success: true, 
          message: 'Payment verified and subscription updated',
          simulatedPayment: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For real MoMo verification in production environment
    // Implementation for checking real payment status with MoMo API would go here
    
    // For now, just return a failure response for non-dev mode
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'MoMo payment verification not implemented for production yet'
      }),
      { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error verifying payment:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Error verifying payment', 
        details: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
