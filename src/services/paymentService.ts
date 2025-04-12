
import { supabase } from "@/integrations/supabase/client";

interface CreatePaymentParams {
  userId: string;
  planId: string;
  planName: string;
  amount: number;
}

// MoMo transaction ID pattern - must be 11 digits starting with 84 or 85
const momoPattern = {
  pattern: /^(84|85)\d{9}$/,
  minLength: 11,
  maxLength: 11,
};

export const paymentService = {
  async createPaymentRequest({ userId, planId, planName, amount }: CreatePaymentParams) {
    // Generate a random order ID for tracking - use momo prefix
    const manualOrderId = `momo-${Date.now()}`;
    
    // Create a transaction record in database
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        plan_id: planId,
        amount: amount,
        status: 'pending',
        payment_method: 'momo',
        order_id: manualOrderId
      })
      .select()
      .single();
      
    if (error) {
      console.error("Error creating transaction:", error);
      throw new Error("Không thể tạo giao dịch");
    }
    
    return {
      orderId: manualOrderId,
      qrImageUrl: ""
    };
  },
  
  // Validate MoMo transaction ID
  validateTransactionId(transactionId: string) {
    // Check for empty input
    if (!transactionId || transactionId.trim().length === 0) {
      return {
        valid: false,
        error: "Mã giao dịch không chính xác"
      };
    }
    
    // Check length
    if (transactionId.length !== momoPattern.minLength) {
      return {
        valid: false,
        error: "Mã giao dịch không chính xác"
      };
    }
    
    // Check pattern (must start with 84 or 85 and have 11 digits)
    if (!momoPattern.pattern.test(transactionId)) {
      return {
        valid: false,
        error: "Mã giao dịch không chính xác"
      };
    }
    
    // Check for simple patterns to reject
    const simplePatterns = [
      /^(\d)\1+$/,         // All same digits
      /^123456789\d*$/,    // Sequential ascending
      /^987654321\d*$/,    // Sequential descending
      /^(12|123|1234|12345)\d*$/ // Simple sequences
    ];
    
    for (const pattern of simplePatterns) {
      if (pattern.test(transactionId)) {
        return {
          valid: false,
          error: "Mã giao dịch không chính xác"
        };
      }
    }
    
    return { valid: true };
  },
  
  async verifyTransaction(orderId: string, transactionId: string) {
    // Validate transaction ID format
    const validationResult = this.validateTransactionId(transactionId);
    if (!validationResult.valid) {
      throw new Error(validationResult.error || "Mã giao dịch không chính xác");
    }
    
    // Call the edge function to verify payment
    const response = await supabase.functions.invoke('momo-verify-payment', {
      body: { 
        orderId: orderId,
        transactionId: transactionId
      }
    });
    
    if (!response.data?.success) {
      throw new Error(response.data?.error || "Mã giao dịch không chính xác");
    }
    
    return response.data;
  },

  async cancelPayment(orderId: string) {
    if (!orderId) {
      throw new Error("Thiếu mã đơn hàng");
    }

    // Update transaction status to 'cancelled'
    const { error } = await supabase
      .from('payment_transactions')
      .update({ status: 'cancelled' })
      .eq('order_id', orderId);

    if (error) {
      console.error("Error cancelling transaction:", error);
      throw new Error("Không thể hủy giao dịch");
    }

    return { success: true };
  }
};
