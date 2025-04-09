
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface CreatePaymentParams {
  userId: string;
  planId: string;
  planName: string;
  amount: number;
}

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
  
  async verifyTransaction(orderId: string, transactionId: string) {
    const response = await supabase.functions.invoke('momo-verify-payment', {
      body: { 
        orderId: orderId,
        transactionId: transactionId
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

