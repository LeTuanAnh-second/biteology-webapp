
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const transactionIdPatterns = {
  momo: {
    pattern: /^840\d{8}$/,
    minLength: 11,
    maxLength: 11,
  },
  bidv: {
    pattern: /^FT\d{10,14}$/,
    minLength: 12,
    maxLength: 16,
  },
  techcombank: {
    pattern: /^\d{12,16}$/,
    minLength: 12,
    maxLength: 16,
  },
  vietcombank: {
    pattern: /^VCB\d{6,12}$/,
    minLength: 9,
    maxLength: 15,
  },
  agribank: {
    pattern: /^\d{8,14}$/,
    minLength: 8,
    maxLength: 14,
  },
  tpbank: {
    pattern: /^\d{9,15}$/,
    minLength: 9,
    maxLength: 15,
  },
  other: {
    pattern: /^[A-Za-z0-9]{8,20}$/,
    minLength: 8,
    maxLength: 20,
  }
};

function validateTransactionId(transactionId: string, bankType: string = 'momo') {
  const validator = transactionIdPatterns[bankType as keyof typeof transactionIdPatterns] 
    || transactionIdPatterns.other;
  
  if (!transactionId || transactionId.trim().length === 0) {
    return {
      valid: false,
      error: `Vui lòng nhập mã giao dịch.`
    };
  }
  
  if (transactionId.length < validator.minLength) {
    return {
      valid: false,
      error: `Mã giao dịch quá ngắn.`
    };
  }
  
  if (transactionId.length > validator.maxLength) {
    return {
      valid: false,
      error: `Mã giao dịch quá dài.`
    };
  }
  
  if (!validator.pattern.test(transactionId)) {
    if (bankType === 'momo') {
      // Kiểm tra cụ thể cho MoMo
      if (transactionId.length === 11 && !/^\d{11}$/.test(transactionId)) {
        return {
          valid: false,
          error: "Mã giao dịch MoMo phải chứa đúng 11 chữ số"
        };
      }
      
      if (transactionId.length === 11 && !/^840/.test(transactionId)) {
        return {
          valid: false,
          error: "Mã giao dịch MoMo không hợp lệ. Phải bắt đầu bằng 840"
        };
      }
    }
    
    return {
      valid: false,
      error: `Định dạng mã giao dịch không hợp lệ.`
    };
  }
  
  if (bankType === 'momo') {
    const simplePatterns = [
      /^(\d)\1+$/,
      /^123456789\d*$/,
      /^987654321\d*$/,
      /^(12|123|1234|12345)\d*$/ 
    ];
    
    for (const pattern of simplePatterns) {
      if (pattern.test(transactionId)) {
        return {
          valid: false,
          error: `Mã giao dịch này không hợp lệ.`
        };
      }
    }
  }
  
  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    let { orderId, transactionId, bankType } = await req.json()
    bankType = bankType || 'momo';
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing order ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const validationResult = validateTransactionId(transactionId, bankType);
    if (!validationResult.valid) {
      return new Response(
        JSON.stringify({ success: false, error: validationResult.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (bankType === 'momo' && transactionId === '123456789012' || transactionId === '123123') {
      console.error('Transaction ID too simple:', transactionId)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Mã giao dịch không hợp lệ. Vui lòng nhập mã giao dịch thực từ tin nhắn MoMo.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Processing MoMo transaction verification for order:', orderId)
    console.log('Transaction ID provided:', transactionId || 'None')
    console.log('Bank type:', bankType)

    // Get the transaction from the database
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (transactionError || !transaction) {
      console.error('Error fetching transaction:', transactionError)
      return new Response(
        JSON.stringify({ success: false, error: 'Không tìm thấy giao dịch' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found transaction in database:', transaction)

    // Check if this is a manual transaction (starts with "manual-" or "momo-")
    const isManualTransaction = orderId.startsWith('manual-') || orderId.startsWith('momo-')

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

    // For manual transactions, simulate successful payment after verifying the transaction ID
    if (isManualTransaction) {
      console.log('Manual payment, processing transaction')
      
      // Validate transaction ID format more strictly (check if already used)
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
              error: 'Lỗi khi lưu mã giao dịch, vui lòng thử lại' 
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
            error: 'Lỗi xử lý giao dịch, vui lòng thử lại' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // If a transaction ID was provided, store it and update status
      if (transactionId) {
        const { error: updateError } = await supabase
          .from('payment_transactions')
          .update({ 
            payment_id: transactionId,
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.id)
          
        if (updateError) {
          console.error('Error updating transaction status:', updateError)
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Lỗi khi cập nhật trạng thái giao dịch' 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        console.log('Transaction updated with payment ID:', transactionId)
      } else {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Thiếu mã giao dịch' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get the plan
      const { data: plan, error: planError } = await supabase
        .from('premium_plans')
        .select('*')
        .eq('id', transaction.plan_id)
        .single()

      if (planError || !plan) {
        console.error('Error fetching plan:', planError)
        return new Response(
          JSON.stringify({ success: false, error: 'Không tìm thấy gói premium' }),
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
          JSON.stringify({ success: false, error: 'Lỗi kiểm tra gói đăng ký hiện tại' }),
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
            JSON.stringify({ success: false, error: 'Lỗi cập nhật gói đăng ký' }),
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
            JSON.stringify({ success: false, error: 'Lỗi tạo gói đăng ký mới' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
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
        return new Response(
          JSON.stringify({ success: false, error: 'Lỗi cập nhật trạng thái premium' }),
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
    }

    // For other payment methods or unexpected case
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Phương thức xác minh thanh toán không hợp lệ'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error verifying payment:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Lỗi xác minh thanh toán', 
        details: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
