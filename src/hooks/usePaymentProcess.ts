
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

// Dùng để mô phỏng thanh toán khi API gặp lỗi
const MOCK_QR_DATA = {
  orderId: `ORDER_${Date.now()}`,
  qrCodeUrl: "https://example.com/qr-placeholder",
  amount: 99000,
  orderInfo: "Thanh toán gói Premium",
  status: "pending",
  paymentUrl: "https://example.com/payment"
};

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

  // Mô phỏng kiểm tra thanh toán
  const mockCheckPaymentStatus = () => {
    console.log("Mô phỏng kiểm tra thanh toán...");
    // Sau 5 giây, mô phỏng thanh toán thành công
    setTimeout(() => {
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
    }, 5000);
  };

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
      
      console.log("Selected plan:", selectedPlan);
      console.log("User ID:", user.id);
      
      // Cố gắng gọi API tạo đơn hàng
      let orderCreated = false;
      let paymentData = null;
      
      try {
        // Sử dụng URL cố định
        const apiUrl = `https://ijvtkufzaweqzwczpvgr.supabase.co/functions/v1/payos-create-order`;
        console.log("Creating order at:", apiUrl);
        console.log("Auth token available:", !!token);
        
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
          throw new Error('Network response was not ok');
        }

        const result = await response.json();
        console.log("Order creation response:", result);
        
        if (!result.success) {
          throw new Error(result.error || 'Không thể tạo đơn hàng');
        }

        orderCreated = true;
        paymentData = result.data;
      } catch (apiError) {
        console.error('API error:', apiError);
        
        // Nếu API thất bại, sử dụng mô phỏng cho mục đích demo
        if (!orderCreated) {
          console.log("Using mock data for demonstration purposes");
          orderCreated = true;
          paymentData = {
            ...MOCK_QR_DATA,
            orderId: `ORDER_${Date.now()}`, // Tạo ID đơn hàng ngẫu nhiên
            amount: Number(selectedPlan === "773078f4-2b8a-4b6b-b6f5-0981e7510f65" ? 99000 : 
                          selectedPlan === "0e3cb1bf-e2c6-40e3-b99d-6e64d87126b1" ? 249000 : 899000)
          };
          
          // Thông báo người dùng rằng đây là chế độ demo
          toast({
            title: "Chế độ thử nghiệm",
            description: "Đã chuyển sang chế độ thanh toán thử nghiệm do không thể kết nối với cổng thanh toán.",
            duration: 5000,
          });
        }
      }
      
      if (orderCreated && paymentData) {
        setQRPaymentData(paymentData);
        setShowQRDialog(true);
        setPaymentStatus('pending');
        
        // Nếu là mô phỏng, sử dụng mock check
        if (paymentData === MOCK_QR_DATA) {
          mockCheckPaymentStatus();
        } else {
          // Kiểm tra thanh toán thực tế
          const intervalId = setInterval(() => {
            checkPaymentStatus(paymentData.orderId);
          }, 5000);
          
          setCheckingInterval(intervalId);
        }
      } else {
        throw new Error('Không thể tạo đơn hàng');
      }
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
