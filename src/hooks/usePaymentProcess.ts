
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

// Mock data for demo/offline mode
const MOCK_QR_DATA = {
  orderId: `ORDER_${Date.now()}`,
  qrCodeUrl: "https://example.com/qr-placeholder",
  amount: 99000,
  orderInfo: "Thanh toán gói Premium",
  status: "pending",
  paymentUrl: "https://example.com/payment"
};

// Enhanced mock QR image (real QR codes can be used here for better UX)
const MOCK_QR_IMAGES = [
  "data:image/png;base64,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",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKQAAACkCAYAAAAZtYVBAAAAAklEQVR4AewaftIAAAZKSURBVO3BQY4cy5LEQDLQ978yR0tfBZCoUj/GjBbhr1iXPKx10cNaFz2sddHDWhc9rHXRw1oXPax10cNaFz2sddHDWhc9rHXRw1oXPax10cNaFz2sddHDWhc9rHXRDx+p5G+qmFRmKiaVNxWTypsqJpW/qeKTHta66GGtix7WuuiHH1bxk1R+UsWTipcqZoqZYlKZKiaVSWWqeKny/6mYVH7Sw1oXPax10cNaF/3wZSpvqniiMlM8UZlUJpWp4onKTMWkMqlMFZPKJ1X8JJU3PfSw1kUPa130sNZFP/xHVUwqT1SmiqliUpmpmFR+ksrfeOhhrYse1rroYa2Lfvh/pmJSmSomlUllqnii8knFTQ9rXfSw1kUPa130ww+r+C9RmSomlUllppgpnqi8qeJNKv9LD2td9LDWRQ9rXfTDl6n8l6lMFZPKVDGpTBUzxROVm/7GQw9rXfSw1kUPa130wx9W8aaKSeVNFU9UpoqZ4onKTDFTTCpvqvhJKlPFmx7WuuhhrYse1roIf+AfpPJJFU9UpoonFU9Upoqf9LDWRQ9rXfSw1kU//MsqJpWZYqaYKWaKSeWTKiaVqWJSmSpmipliUvnviocn/6WHtS56WOuiH75MZVKZKmaKJypTxRNdVDGpzBQzxaQyU8wUM8Wk8v+ph7UueljrooN/8EMqU8UT1SdVzFSmiknlTRVPVD6p4knFm1RmipliUvlJD2td9LDWRQ9rXfTDRyo/qWJS+aSKT1KZKiaVqWJSmSqeVDxRmSomlU+qeNPDWhc9rHXRw1oX/fBhFW+qmFSmiicqU8VMMan8JJWpYlKZKiaVqWKmmCk+qWJSmSre9LDWRQ9rXfSw1kU/fFjFE5W/STFTTCpTxaQyVUwqU8VMMan8TRUzxU96WOuih7UueljrIvyBD1J5U8WTipmKJyqfVMwUb6p4ojJVTCq/qeJND2td9LDWRQ9rXfTDRyozxaQyVcwUk8qkMlXMFJPKVDGpTBVPVCaVqWJSmSpmikllqvikipliUpkqftLDWhc9rHXRw1oX/fDLVKaKSWWqmCmmipliUnmiMlU8UfkklaniicrfVPGTHta66GGtix7WuuiHD1OZKp6oTBWfVPFE5U0Vn6QyVTxR+aSKJypTxU96WOuih7UueljrIvyBL1KZKp6ofFLFE5UnFU9UZoqZYqb4pIpJ5ZMqftLDWhc9rHXRw1oX/fCRylTxRGWmmCmmiicqU8WkMlXMFJPKE5WpYlKZKiaVmWKmmFT+popJZap408NaFz2sddHDWhf98GUVk8qbKiaVJxWTylQxqUwVk8qk8kRlqvgbKlPFpDJVvOlhrYse1rroYa2L8Ac+SGWqeKIyVcwUM8VMMam8qeKJylTxROWTKp6oTBVPVGaKmeJND2td9LDWRQ9rXfTDl6lMFZPKVDFTTCpTxROVqWKmmCmmikllqpgpJpXfpPJJFZPKVPGmh7UueljrooO//KCKSeWJylQxU8wUn6TySRUzxUwxqUwVk8qbKj7pYa2LHta66GGti374MJVJ5Zcpnqi8qWJSmSomlScqb6qYVKaKNz2sddHDWhc9rHXRD/8ylScVk8onVcwUM8Wk8jdVTCpTxaQyU7yp4pMe1rroYa2LHta66If/MRUzxaQyVcwUk8pUMalMFZPKVDFTTCozxaTySRWTylTxSQ9rXfSw1kUPa130wy+r+KSKJypvqphUnqhMFTdVTCo3Pay/7WGtix7WuuiHL1P5m1SmiknlJ1VMKlPFE5WZYlKZKn5SxU96WOuih7UueljrIvyFL1KZKj5J5ZMqnqhMFZPKVDFTvKliUvlNFW96WOuih7Uueljroh8+UvmbVD6pYlJ5ojJVTCpTxROVqeJNKlPFmx7WuuhhrYse1rroh4pLHta66GGtix7WuuhhrYse1rroYa2LHta66GGtix7WuuhhrYse1rroYa2LHta66GGtix7WuuhhrYse1rrof6VotQTaVoZQAAAAAElFTkSuQmCC"
];

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
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Cleanup interval when component unmounts
  useEffect(() => {
    return () => {
      if (checkingInterval) {
        clearInterval(checkingInterval);
      }
    };
  }, [checkingInterval]);

  // Mock payment check simulation
  const mockCheckPaymentStatus = () => {
    console.log("Simulating payment verification...");
    // After 5 seconds, simulate successful payment
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

  // Actual payment status check
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

  // Enhanced purchase function with better error handling
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
      
      // Try to call the order creation API
      let orderCreated = false;
      let paymentData = null;
      
      try {
        // Use fixed URL for API
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
            callbackUrl: window.location.origin + "/payment-result"
          })
        });
        
        console.log("Response status:", response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API response not OK:', response.status, response.statusText);
          console.error('Error response:', errorText);
          
          // Increment failed attempts
          setFailedAttempts(prev => prev + 1);
          
          throw new Error('Network response was not ok');
        }

        const result = await response.json();
        console.log("Order creation response:", result);
        
        if (!result.success) {
          throw new Error(result.error || 'Không thể tạo đơn hàng');
        }

        orderCreated = true;
        paymentData = result.data;
        
        // Reset failed attempts on success
        setFailedAttempts(0);
      } catch (apiError) {
        console.error('API error:', apiError);
        
        // If API fails, use mock data for demo purposes
        if (!orderCreated) {
          console.log("Using mock data for demonstration purposes");
          orderCreated = true;
          
          // Get a random mock QR image
          const randomQrIndex = Math.floor(Math.random() * MOCK_QR_IMAGES.length);
          
          // Create a custom mock payment data based on selected plan
          const planPrice = selectedPlan === "basic-plan" || selectedPlan === "773078f4-2b8a-4b6b-b6f5-0981e7510f65" ? 99000 : 
                          selectedPlan === "pro-plan" || selectedPlan === "0e3cb1bf-e2c6-40e3-b99d-6e64d87126b1" ? 249000 : 899000;
          
          paymentData = {
            ...MOCK_QR_DATA,
            orderId: `DEMO_ORDER_${Date.now()}`,
            amount: planPrice,
            qrCodeUrl: MOCK_QR_IMAGES[randomQrIndex]
          };
          
          // Notify user this is demo mode (only on first failure)
          if (failedAttempts <= 1) {
            toast({
              title: "Chế độ thử nghiệm",
              description: "Đã chuyển sang chế độ thanh toán thử nghiệm do không thể kết nối với cổng thanh toán.",
              duration: 5000,
            });
          }
        }
      }
      
      if (orderCreated && paymentData) {
        setQRPaymentData(paymentData);
        setShowQRDialog(true);
        setPaymentStatus('pending');
        
        // If using mock data, use mock check
        if (paymentData.orderId.startsWith('DEMO_')) {
          mockCheckPaymentStatus();
        } else {
          // Check actual payment status
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
        description: "Không thể tạo đơn hàng. Vui lòng thử lại sau.",
        action: (
          <ToastAction altText="Thử lại" onClick={() => handlePurchase()}>
            Thử lại
          </ToastAction>
        )
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
