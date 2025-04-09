
import { supabase } from "@/integrations/supabase/client";

interface CreatePaymentParams {
  userId: string;
  planId: string;
  planName: string;
  amount: number;
}

// Export the transactionIdPatterns object so it can be imported in other files
export const transactionIdPatterns = {
  momo: {
    pattern: /^840\d{8}$/,
    minLength: 11,
    maxLength: 11,
    description: "Mã giao dịch không chính xác"
  }
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
    
    // Dựa vào tên gói để trả về chuỗi rỗng, QR sẽ được chọn trên frontend
    return {
      orderId: manualOrderId,
      qrImageUrl: ""
    };
  },
  
  // Kiểm tra định dạng của mã giao dịch MoMo
  validateTransactionId(transactionId: string, bankType: string = 'momo') {
    // MoMo luôn là mặc định
    bankType = 'momo';
    
    // Chọn quy tắc kiểm tra cho MoMo
    const validator = transactionIdPatterns.momo;
    
    // Kiểm tra độ dài
    if (!transactionId || transactionId.trim().length === 0) {
      return {
        valid: false,
        error: "Mã giao dịch không chính xác"
      };
    }
    
    if (transactionId.length < validator.minLength) {
      return {
        valid: false,
        error: "Mã giao dịch không chính xác"
      };
    }
    
    if (transactionId.length > validator.maxLength) {
      return {
        valid: false,
        error: "Mã giao dịch không chính xác"
      };
    }
    
    // Kiểm tra định dạng bằng regex
    if (!validator.pattern.test(transactionId)) {
      // Kiểm tra cụ thể cho MoMo
      if (transactionId.length === 11 && !/^\d{11}$/.test(transactionId)) {
        return {
          valid: false,
          error: "Mã giao dịch không chính xác"
        };
      }
      
      if (transactionId.length === 11 && !/^840/.test(transactionId)) {
        return {
          valid: false,
          error: "Mã giao dịch không chính xác"
        };
      }
      
      return {
        valid: false,
        error: "Mã giao dịch không chính xác"
      };
    }
    
    // Kiểm tra thêm cho momo để chặn các mã giao dịch đơn giản
    const simplePatterns = [
      /^(\d)\1+$/, // Chặn trường hợp toàn số giống nhau: 1111111111
      /^123456789\d*$/, // Chặn trường hợp 123456789...
      /^987654321\d*$/, // Chặn trường hợp 987654321...
      /^(12|123|1234|12345)\d*$/ // Chặn trường hợp bắt đầu bằng các số đơn giản
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
  
  async verifyTransaction(orderId: string, transactionId: string, bankType: string = 'momo') {
    // Luôn dùng MoMo
    bankType = 'momo';
    
    // Kiểm tra tính hợp lệ của mã giao dịch trước khi gửi đến edge function
    const validationResult = this.validateTransactionId(transactionId, bankType);
    if (!validationResult.valid) {
      throw new Error(validationResult.error || "Mã giao dịch không hợp lệ");
    }
    
    const response = await supabase.functions.invoke('momo-verify-payment', {
      body: { 
        orderId: orderId,
        transactionId: transactionId,
        bankType: bankType
      }
    });
    
    if (!response.data?.success) {
      throw new Error(response.data?.error || "Không thể xác minh giao dịch");
    }
    
    return response.data;
  },

  async cancelPayment(orderId: string) {
    if (!orderId) {
      throw new Error("Thiếu mã đơn hàng");
    }

    // Update the transaction status to 'cancelled' in the database
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
