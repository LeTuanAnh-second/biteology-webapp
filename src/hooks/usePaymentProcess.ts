
import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { usePaymentStatus } from "./usePaymentStatus";
import { usePaymentRetry } from "./usePaymentRetry";
import { SUPABASE_URL } from "@/lib/supabase";

export function usePaymentProcess(
  user: User | null,
  selectedPlan: string | null,
  toast: any
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrPaymentData, setQRPaymentData] = useState<QRPaymentData | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  
  const { isRetrying, retryCount, handleRetry } = usePaymentRetry();
  const { paymentStatus } = usePaymentStatus(qrPaymentData?.orderId || null);

  const createOrder = async () => {
    if (!user || !selectedPlan) return null;
    
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      throw new Error('No access token available');
    }
    
    const apiUrl = `${SUPABASE_URL}/functions/v1/payos-create-order`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        planId: selectedPlan,
        userId: user.id,
        callbackUrl: window.location.origin
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create order');
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Could not create order');
    }
    
    return result.data;
  };

  const handlePurchase = async () => {
    if (!selectedPlan || !user) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng chọn gói premium trước khi thanh toán."
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const paymentData = await handleRetry(createOrder);
      
      if (!paymentData) {
        setIsProcessing(false);
        return;
      }
      
      setQRPaymentData(paymentData);
      setShowQRDialog(true);
      
      if (paymentData.paymentUrl) {
        window.open(paymentData.paymentUrl, '_blank');
      }
      
    } catch (error) {
      console.error("Final error in handlePurchase:", error);
      toast({
        variant: "destructive",
        title: "Lỗi thanh toán",
        description: "Đã xảy ra lỗi khi tạo đơn hàng. Vui lòng thử lại sau."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    isRetrying,
    retryCount,
    qrPaymentData,
    showQRDialog,
    paymentStatus,
    handlePurchase,
    setShowQRDialog
  };
}

interface QRPaymentData {
  orderId: string;
  qrCodeUrl: string;
  amount: number;
  orderInfo: string;
  status: string;
  paymentUrl?: string;
}
