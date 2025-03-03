
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { ToastAction } from "@/components/ui/toast";
import { supabase } from "@/integrations/supabase/client";

interface QRPaymentData {
  orderId: string;
  qrCodeUrl: string;
  amount: number;
  orderInfo: string;
  status: string;
  paymentUrl?: string;
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

  // Đảm bảo xóa interval khi component unmount
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
      // Lấy token JWT của người dùng hiện tại
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        console.error('No access token available');
        return;
      }
      
      // Sử dụng URL cố định thay vì biến môi trường không xác định
      const apiUrl = `https://ijvtkufzaweqzwczpvgr.supabase.co/functions/v1/payos-verify-payment`;
      console.log("Checking payment status at:", apiUrl);
      
      const response = await fetch(`${apiUrl}?orderId=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        return;
      }
      
      const data = await response.json();
      console.log("Payment status response:", data);
      
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
      // Lấy token JWT của người dùng hiện tại
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        console.error('No access token available');
        toast({
          variant: "destructive",
          title: "Lỗi xác thực",
          description: "Không thể xác thực người dùng. Vui lòng đăng nhập lại."
        });
        setIsProcessing(false);
        return;
      }
      
      // Sử dụng URL cố định
      const apiUrl = `https://ijvtkufzaweqzwczpvgr.supabase.co/functions/v1/payos-create-order`;
      console.log("Creating order at:", apiUrl);
      console.log("Auth token available:", !!token);
      console.log("Selected plan:", selectedPlan);
      console.log("User ID:", user.id);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: selectedPlan,
          userId: user.id
        })
      });
      
      console.log("Response status:", response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response not OK:', response.status, response.statusText);
        console.error('Error response:', errorText);
        
        let errorMessage = "Không thể tạo đơn hàng. Vui lòng thử lại sau.";
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            errorMessage = errorData.error;
            if (errorData.details) {
              console.error('Error details:', errorData.details);
            }
          }
        } catch (e) {
          // Không parse được JSON, sử dụng thông báo mặc định
        }
        
        toast({
          variant: "destructive",
          title: "Lỗi thanh toán",
          description: errorMessage
        });
        
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      console.log("Order creation response:", result);
      
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
