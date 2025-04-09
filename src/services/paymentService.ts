
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface CreatePaymentParams {
  userId: string;
  planId: string;
  planName: string;
  amount: number;
}

// Định nghĩa các quy tắc kiểm tra mã giao dịch cho từng ngân hàng
const transactionIdPatterns = {
  momo: {
    pattern: /^\d{10,15}$/,
    minLength: 10,
    maxLength: 15,
    description: "Mã giao dịch MoMo thường là một dãy 10-15 chữ số"
  },
  bidv: {
    pattern: /^FT\d{10,14}$/,
    minLength: 12,
    maxLength: 16,
    description: "Mã giao dịch BIDV thường bắt đầu bằng FT và theo sau là 10-14 chữ số"
  },
  techcombank: {
    pattern: /^\d{12,16}$/,
    minLength: 12,
    maxLength: 16,
    description: "Mã giao dịch Techcombank thường là một dãy 12-16 chữ số"
  },
  vietcombank: {
    pattern: /^VCB\d{6,12}$/,
    minLength: 9,
    maxLength: 15,
    description: "Mã giao dịch Vietcombank thường bắt đầu bằng VCB và theo sau là 6-12 chữ số"
  },
  agribank: {
    pattern: /^\d{8,14}$/,
    minLength: 8,
    maxLength: 14,
    description: "Mã giao dịch Agribank thường là một dãy 8-14 chữ số"
  },
  tpbank: {
    pattern: /^\d{9,15}$/,
    minLength: 9,
    maxLength: 15,
    description: "Mã giao dịch TPBank thường là một dãy 9-15 chữ số"
  },
  other: {
    pattern: /^[A-Za-z0-9]{8,20}$/,
    minLength: 8,
    maxLength: 20,
    description: "Mã giao dịch phải có ít nhất 8 ký tự, bao gồm chữ và số"
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
    
    // Get QR image based on plan type
    const qrImages = {
      basic: "/lovable-uploads/358581bf-724d-47aa-b28d-62e3529ef5ad.png",
      standard: "/lovable-uploads/e75b2ec9-7013-4e44-aca1-a5ad55f55f6c.png"
    };
    
    // Select QR image based on plan name (lowercase for consistency)
    const planNameLower = planName.toLowerCase();
    const qrImage = planNameLower === 'tiêu chuẩn' || planNameLower === 'standard' 
      ? qrImages.standard 
      : qrImages.basic;
    
    return {
      orderId: manualOrderId,
      qrImageUrl: qrImage
    };
  },
  
  // Kiểm tra định dạng của mã giao dịch dựa trên loại ngân hàng
  validateTransactionId(transactionId: string, bankType: string = 'momo') {
    // Chọn quy tắc kiểm tra phù hợp với loại ngân hàng
    const validator = transactionIdPatterns[bankType as keyof typeof transactionIdPatterns] 
      || transactionIdPatterns.other;
    
    // Kiểm tra độ dài
    if (transactionId.length < validator.minLength) {
      return {
        valid: false,
        error: `Mã giao dịch quá ngắn. ${validator.description}`
      };
    }
    
    if (transactionId.length > validator.maxLength) {
      return {
        valid: false,
        error: `Mã giao dịch quá dài. ${validator.description}`
      };
    }
    
    // Kiểm tra định dạng bằng regex
    if (!validator.pattern.test(transactionId)) {
      return {
        valid: false,
        error: `Định dạng mã giao dịch không hợp lệ. ${validator.description}`
      };
    }
    
    return { valid: true };
  },
  
  async verifyTransaction(orderId: string, transactionId: string, bankType: string = 'momo') {
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
