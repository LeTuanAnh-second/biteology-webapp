
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

  const createMockPaymentOrder = async (planId: string, userId: string) => {
    // For fallback when PayOS API is unavailable
    const mockOrderId = `MOCK_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Get selected plan details from the database
    const { data: plan, error } = await supabase
      .from('premium_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (error || !plan) {
      throw new Error('Could not retrieve plan information');
    }
    
    // Create a transaction record even for the mock payment
    await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        plan_id: planId,
        amount: plan.price,
        payment_method: 'payos-fallback',
        status: 'pending',
        order_id: mockOrderId
      });
    
    // Return mock payment data
    return {
      orderId: mockOrderId,
      qrCodeUrl: "https://placehold.co/400x400/png?text=QR+Code+Unavailable",
      amount: plan.price,
      orderInfo: `Nâng cấp tài khoản Premium - ${plan.name} (Chế độ thử nghiệm)`,
      status: 'pending',
      paymentUrl: `${window.location.origin}/payment-result?status=demo&orderCode=${mockOrderId}`
    };
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
        
        // Use the live PayOS API endpoint
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
            userId: user.id,
            callbackUrl: window.location.origin // Pass the origin URL for proper redirection
          })
        });
        
        console.log("Response status:", response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API response not OK:', response.status, response.statusText);
          console.error('Error response:', errorText);
          
          // If we're still within retry attempts, try again
          if (attempt < 2) {
            setIsRetrying(true);
            setRetryCount(attempt);
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1500));
            return tryCreateOrder(attempt + 1);
          }
          
          // After max retries, use fallback mechanism
          toast({
            title: "Chuyển sang chế độ thử nghiệm",
            description: "Không thể kết nối tới cổng thanh toán. Đang chuyển sang chế độ thử nghiệm."
          });
          
          // Use fallback mock payment data
          return await createMockPaymentOrder(selectedPlan, user.id);
        }

        const result = await response.json();
        console.log("Order creation response:", result);
        
        if (!result.success) {
          throw new Error(result.error || 'Không thể tạo đơn hàng');
        }

        // Received data from PayOS
        return result.data;
      } catch (error) {
        console.error('Error creating order:', error);
        
        // If we're still within retry attempts, try again
        if (attempt < 2) {
          setIsRetrying(true);
          setRetryCount(attempt);
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1500));
          return tryCreateOrder(attempt + 1);
        }
        
        // After max retries, use fallback mechanism
        toast({
          title: "Chuyển sang chế độ thử nghiệm",
          description: "Không thể kết nối tới cổng thanh toán. Đang chuyển sang chế độ thử nghiệm."
        });
        
        try {
          // Use fallback mock payment data
          return await createMockPaymentOrder(selectedPlan, user.id);
        } catch (fallbackError) {
          console.error('Error with fallback payment:', fallbackError);
          toast({
            variant: "destructive",
            title: "Lỗi thanh toán",
            description: "Không thể tạo đơn hàng. Vui lòng thử lại sau."
          });
          return null;
        }
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
