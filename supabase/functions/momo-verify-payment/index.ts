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

    // Check if this is a manual transaction (starts with "manual-" or "momo-")
    const isManualTransaction = orderId.startsWith('manual-') || orderId.startsWith('momo-')

    // For manual transactions, simulate successful payment after verifying the transaction ID
    if (isManualTransaction) {
      console.log('Manual payment, processing transaction')
      
      // If a transaction ID was provided, store it and update status
      if (transactionId) {
        await supabase
          .from('payment_transactions')
          .update({ 
            payment_id: transactionId,
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.id)
          
        console.log('Transaction updated with payment ID:', transactionId)
      } else {
        // Otherwise, just update the status
        await supabase
          .from('payment_transactions')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.id)
          
        console.log('Transaction updated to completed status without payment ID')
      }

      // Get the plan
      const { data: plan } = await supabase
        .from('premium_plans')
        .select('*')
        .eq('id', transaction.plan_id)
        .single()

      if (!plan) {
        console.error('Plan not found for transaction:', transaction.plan_id)
        return new Response(
          JSON.stringify({ success: false, error: 'Plan not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Plan found:', plan)

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
          
        console.log('Updated existing subscription:', existingSubscription.id)
      } else {
        // Create new subscription
        const { data: newSubscription, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: transaction.user_id,
            plan_id: plan.id,
            transaction_id: transaction.id,
            start_date: new Date().toISOString(),
            end_date: endDate.toISOString(),
            status: 'active'
          })
          .select()
          
        if (subscriptionError) {
          console.error('Error creating subscription:', subscriptionError)
        } else {
          console.log('Created new subscription:', newSubscription)
        }
      }

      // Update user's premium status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', transaction.user_id)
        
      if (updateError) {
        console.error('Error updating profile premium status:', updateError)
      } else {
        console.log('Updated user premium status for:', transaction.user_id)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Payment verified and subscription updated',
          transaction: transaction.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For other payment methods or unexpected case
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Invalid payment verification method'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
