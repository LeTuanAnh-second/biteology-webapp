
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface QRPaymentData {
  orderId: string;
  qrCodeUrl: string;
  amount: number;
  orderInfo: string;
  status: string;
  paymentUrl?: string;
}

// Get the Supabase URL from the client environment or use a fallback
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://ijvtkufzaweqzwczpvgr.supabase.co";

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
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Ensure interval is cleared when component unmounts
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
      // Get current user's JWT token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        console.error('No access token available');
        return;
      }
      
      const apiUrl = `${SUPABASE_URL}/functions/v1/payos-verify-payment`;
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
    setIsRetrying(false);
    setRetryCount(0);
    
    const tryCreateOrder = async (attempt = 1): Promise<QRPaymentData | null> => {
      try {
        // Get current user's JWT token
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          console.error('No access token available');
          toast({
            variant: "destructive",
            title: "Lỗi xác thực",
            description: "Không thể xác thực người dùng. Vui lòng đăng nhập lại."
          });
          return null;
        }
        
        console.log("Selected plan:", selectedPlan);
        console.log("User ID:", user.id);
        
        // Use the Supabase URL
        const apiUrl = `${SUPABASE_URL}/functions/v1/payos-create-order`;
        console.log("Creating order at:", apiUrl);
        console.log("Auth token available:", !!token);
        
        // Set timeout for the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            planId: selectedPlan,
            userId: user.id,
            callbackUrl: window.location.origin // Pass the origin URL for proper redirection
          }),
          signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));
        
        console.log("Response status:", response.status, response.statusText);
        
        if (!response.ok) {
          let errorText = "";
          try {
            errorText = await response.text();
            console.error('Error response body:', errorText);
          } catch (e) {
            console.error('Could not read error response body');
          }
          
          // If we're still within retry attempts, try again
          if (attempt < 3) {
            setIsRetrying(true);
            setRetryCount(attempt);
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 3000));
            return tryCreateOrder(attempt + 1);
          }
          
          toast({
            variant: "destructive",
            title: "Lỗi kết nối",
            description: "Không thể kết nối tới cổng thanh toán. Vui lòng kiểm tra kết nối mạng hoặc liên hệ hỗ trợ."
          });
          throw new Error(`Failed to connect to payment provider: ${errorText}`);
        }

        let result;
        try {
          result = await response.json();
          console.log("Order creation response:", result);
        } catch (e) {
          console.error("Error parsing JSON response:", e);
          throw new Error("Invalid response format from payment provider");
        }
        
        if (!result.success) {
          throw new Error(result.error || 'Không thể tạo đơn hàng');
        }

        // Received data from PayOS
        return result.data;
      } catch (error) {
        console.error('Error creating order:', error);
        
        // If we're still within retry attempts, try again
        if (attempt < 3) {
          setIsRetrying(true);
          setRetryCount(attempt);
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 3000));
          return tryCreateOrder(attempt + 1);
        }
        
        // After max retries, report the error
        toast({
          variant: "destructive",
          title: "Lỗi kết nối",
          description: "Không thể kết nối tới cổng thanh toán. Vui lòng thử lại sau hoặc liên hệ hỗ trợ."
        });
        throw error;
      }
    };
    
    try {
      // Try to create the order
      const paymentData = await tryCreateOrder();
      
      if (!paymentData) {
        setIsProcessing(false);
        return;
      }
      
      setQRPaymentData(paymentData);
      setShowQRDialog(true);
      setPaymentStatus('pending');
      
      // Set up payment status checking
      const intervalId = setInterval(() => {
        checkPaymentStatus(paymentData.orderId);
      }, 5000);
      
      setCheckingInterval(intervalId);
      
      // Auto-redirect to payment URL if available
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
      setIsRetrying(false);
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
