
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validateMomoTransactionId } from './validator.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    let { orderId, transactionId } = await req.json()
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Mã giao dịch không chính xác' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate transaction ID format
    const validationResult = validateMomoTransactionId(transactionId);
    if (!validationResult.valid) {
      return new Response(
        JSON.stringify({ success: false, error: validationResult.error }),
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
        JSON.stringify({ success: false, error: 'Mã giao dịch không chính xác' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found transaction in database:', transaction)

    // Check if transaction is already completed
    if (transaction.status === 'completed') {
      return new Response(
        JSON.stringify({ success: false, error: 'Giao dịch này đã được xử lý trước đó' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Check if transaction is already cancelled
    if (transaction.status === 'cancelled') {
      return new Response(
        JSON.stringify({ success: false, error: 'Giao dịch này đã bị hủy' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if transaction ID has already been used
    const { data: existingProof, error: proofCheckError } = await supabase
      .from('transaction_proofs')
      .select('*')
      .eq('transaction_id', transactionId)
      .limit(1)
      
    if (proofCheckError) {
      console.error('Error checking transaction proof:', proofCheckError)
    } else if (existingProof && existingProof.length > 0) {
      console.error('Transaction ID already used:', transactionId)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Mã giao dịch này đã được sử dụng cho một giao dịch khác' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Save proof of transaction first
    try {
      const { data: proofData, error: proofError } = await supabase
        .from('transaction_proofs')
        .insert({
          transaction_id: transactionId,
          order_id: orderId,
          payment_method: 'momo',
          verified_at: new Date().toISOString()
        })
        
      if (proofError) {
        console.error('Error recording transaction proof:', proofError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Mã giao dịch không chính xác' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        console.log('Transaction proof recorded successfully')
      }
    } catch (proofError) {
      console.error('Exception recording transaction proof:', proofError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Mã giao dịch không chính xác' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Update transaction status to completed
    const { error: txUpdateError } = await supabase
      .from('payment_transactions')
      .update({ 
        payment_id: transactionId,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)
      
    if (txUpdateError) {
      console.error('Error updating transaction status:', txUpdateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Mã giao dịch không chính xác' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('Transaction updated with payment ID:', transactionId)

    // Get the plan
    const { data: plan, error: planError } = await supabase
      .from('premium_plans')
      .select('*')
      .eq('id', transaction.plan_id)
      .single()

    if (planError || !plan) {
      console.error('Error fetching plan:', planError)
      return new Response(
        JSON.stringify({ success: false, error: 'Mã giao dịch không chính xác' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Plan found:', plan)

    // Calculate subscription end date
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + plan.duration_days)

    // Check if user already has a subscription
    const { data: existingSubscription, error: subCheckError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', transaction.user_id)
      .eq('status', 'active')
      .single()

    if (subCheckError && subCheckError.code !== 'PGRST116') {
      console.error('Error checking existing subscription:', subCheckError)
      return new Response(
        JSON.stringify({ success: false, error: 'Mã giao dịch không chính xác' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateSubError } = await supabase
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
        
      if (updateSubError) {
        console.error('Error updating subscription:', updateSubError)
        return new Response(
          JSON.stringify({ success: false, error: 'Mã giao dịch không chính xác' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
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
        return new Response(
          JSON.stringify({ success: false, error: 'Mã giao dịch không chính xác' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        console.log('Created new subscription:', newSubscription)
      }
    }

    // Update user's premium status
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ is_premium: true })
      .eq('id', transaction.user_id)
      
    if (profileUpdateError) {
      console.error('Error updating profile premium status:', profileUpdateError)
      return new Response(
        JSON.stringify({ success: false, error: 'Mã giao dịch không chính xác' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      console.log('Updated user premium status for:', transaction.user_id)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Thanh toán đã được xác minh và gói đăng ký đã được cập nhật',
        transaction: transaction.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error verifying payment:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Mã giao dịch không chính xác'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
