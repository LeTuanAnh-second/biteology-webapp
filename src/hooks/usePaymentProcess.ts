
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
        setIsProcessing(false);
        return;
      }
      
      console.log("Selected plan:", selectedPlan);
      console.log("User ID:", user.id);
      
      // Use the live PayOS API instead of sandbox
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
        
        toast({
          variant: "destructive",
          title: "Lỗi thanh toán",
          description: "Không thể tạo đơn hàng. Vui lòng thử lại sau."
        });
        
        setIsProcessing(false);
        return;
      }

      const result = await response.json();
      console.log("Order creation response:", result);
      
      if (!result.success) {
        throw new Error(result.error || 'Không thể tạo đơn hàng');
      }

      // Received data from PayOS
      const paymentData = result.data;
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
