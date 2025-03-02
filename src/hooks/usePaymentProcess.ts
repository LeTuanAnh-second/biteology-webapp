
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { ToastAction } from "@/components/ui/toast";

interface QRPaymentData {
  orderId: string;
  qrCodeUrl: string;
  amount: number;
  orderInfo: string;
  status: string;
}

export function usePaymentProcess(
  user: User | null,
  selectedPlan: string | null,
  toast: any
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrPaymentData, setQRPaymentData] = useState<QRPaymentData | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [checkingInterval, setCheckingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (checkingInterval) {
        clearInterval(checkingInterval);
      }
    };
  }, [checkingInterval]);

  const checkPaymentStatus = async (orderId: string) => {
    if (!user) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payos-verify-payment?orderId=${orderId}`
      );
      
      const data = await response.json();
      
      if (data.success) {
        setPaymentStatus('success');
        if (checkingInterval) {
          clearInterval(checkingInterval);
          setCheckingInterval(null);
        }
        
        toast({
          title: "Thanh toán thành công",
          description: "Bạn đã nâng cấp tài khoản lên Premium thành công."
        });
        
        setTimeout(() => {
          setShowQRDialog(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
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
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payos-create-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId: selectedPlan,
            userId: user.id
          })
        }
      );

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Không thể tạo đơn hàng');
      }

      setQRPaymentData(result.data);
      setShowQRDialog(true);
      setPaymentStatus('pending');
      
      const intervalId = setInterval(() => {
        checkPaymentStatus(result.data.orderId);
      }, 5000);
      
      setCheckingInterval(intervalId);
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        variant: "destructive",
        title: "Lỗi thanh toán",
        description: "Không thể tạo đơn hàng. Vui lòng thử lại sau."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    qrPaymentData,
    showQRDialog,
    paymentStatus,
    handlePurchase,
    setShowQRDialog
  };
}
