
import { useState, useEffect } from "react";
import { Loader2, ExternalLink, AlertCircle, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DirectPaymentLinkProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlan: {
    id: string;
    name: string;
    price: number;
  } | null;
  onPaymentSuccess?: () => void;
}

export const DirectPaymentLink = ({ 
  open, 
  onOpenChange,
  selectedPlan,
  onPaymentSuccess
}: DirectPaymentLinkProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDevMode, setIsDevMode] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const createPaymentRequest = async () => {
    if (!user || !selectedPlan) return;
    
    setIsLoading(true);
    setError(null);
    setQrImageUrl(null);
    setPaymentUrl(null);
    setIsDevMode(false);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          variant: "destructive",
          title: "Lỗi xác thực",
          description: "Vui lòng đăng nhập lại để tiếp tục.",
        });
        return;
      }
      
      console.log("Creating payment for plan:", selectedPlan.id);
      
      // Gọi PayOS create order endpoint
      console.log("Calling PayOS create order endpoint");
      const response = await supabase.functions.invoke('payos-create-order', {
        body: {
          planId: selectedPlan.id,
        }
      });

      console.log("PayOS create order response:", response);

      if (response.error) {
        console.error("Error from PayOS function:", response.error);
        throw new Error(response.error.message || "Không thể tạo thanh toán");
      }

      if (!response.data?.success) {
        console.error("Failed response from PayOS:", response.data);
        throw new Error(response.data?.error || "Không thể tạo thanh toán");
      }

      const { checkoutUrl, qrCode, orderId: newOrderId } = response.data;
      
      console.log("Received payment data:", { checkoutUrl, qrCode, newOrderId });
      
      // Check if this is a simulated response (development mode)
      const isSimulatedResponse = checkoutUrl?.includes('simulated_');
      setIsDevMode(isSimulatedResponse);
      
      // Ensure the QR code URL is actually set
      if (!qrCode) {
        throw new Error("Không nhận được mã QR từ PayOS");
      }
      
      setQrImageUrl(qrCode);
      setPaymentUrl(checkoutUrl);
      setOrderId(newOrderId);
      
      if (isSimulatedResponse) {
        toast({
          title: "Chế độ phát triển",
          description: "Đây là chế độ thử nghiệm. Nhấn vào nút thanh toán để giả lập thanh toán thành công.",
        });
      }
      
    } catch (error) {
      console.error('Error creating payment:', error);
      setError("Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại sau.");
      toast({
        variant: "destructive",
        title: "Có lỗi xảy ra",
        description: error instanceof Error ? error.message : "Không thể tạo thanh toán. Vui lòng thử lại sau.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate successful payment in development mode
  const simulateSuccessfulPayment = () => {
    if (!isDevMode || !orderId) return;
    
    toast({
      title: "Thanh toán thành công!",
      description: "Đây là thanh toán giả lập trong chế độ phát triển.",
    });
    
    onPaymentSuccess?.();
    onOpenChange(false);
  };

  // Create payment request when dialog opens
  useEffect(() => {
    if (open && selectedPlan) {
      createPaymentRequest();
    } else {
      // Reset state when dialog closes
      setQrImageUrl(null);
      setPaymentUrl(null);
      setOrderId(null);
      setError(null);
      setIsDevMode(false);
    }
  }, [open, selectedPlan]);

  // Check payment status periodically (only in production mode)
  useEffect(() => {
    if (!orderId || !open || isDevMode) return;

    const checkPaymentStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        console.log("Checking payment status for order:", orderId);
        const response = await supabase.functions.invoke('payos-verify-payment', {
          body: { orderId }
        });

        console.log("Payment verification response:", response);

        if (response.error) {
          console.error('Error checking payment:', response.error);
          return;
        }

        if (response.data?.success) {
          toast({
            title: "Thanh toán thành công!",
            description: "Tài khoản của bạn đã được nâng cấp lên Premium.",
          });
          onPaymentSuccess?.();
          onOpenChange(false);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };

    // Check every 5 seconds
    const interval = setInterval(checkPaymentStatus, 5000);
    return () => clearInterval(interval);
  }, [orderId, open, onPaymentSuccess, onOpenChange, isDevMode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thanh toán qua PayOS</DialogTitle>
          <DialogDescription>
            {isDevMode 
              ? "Đây là chế độ thử nghiệm. Nhấn vào nút mô phỏng thanh toán thành công." 
              : "Quét mã QR bên dưới để thanh toán hoặc nhấn vào nút để mở trang thanh toán"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Đang tạo thông tin thanh toán...</span>
            </div>
          ) : error ? (
            <div className="w-full max-w-md space-y-4">
              <Alert variant="destructive" className="border-destructive/50 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="mt-1">{error}</AlertDescription>
              </Alert>
              <Button 
                variant="outline" 
                size="sm"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => createPaymentRequest()}
              >
                <RefreshCw className="h-4 w-4" />
                Thử lại
              </Button>
            </div>
          ) : (
            <>
              {qrImageUrl && !isDevMode && (
                <div className="flex flex-col items-center mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Quét mã QR để thanh toán</p>
                  <img 
                    src={qrImageUrl} 
                    alt="Mã QR thanh toán" 
                    className="w-64 h-64 object-contain border rounded-md shadow-sm"
                  />
                </div>
              )}
              
              {isDevMode && (
                <div className="flex flex-col items-center mb-4">
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="mt-1">
                      Đây là chế độ thử nghiệm. Thanh toán thực tế đã bị vô hiệu hóa.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    variant="default" 
                    size="lg"
                    className="w-full flex items-center justify-center gap-2 mt-4"
                    onClick={simulateSuccessfulPayment}
                  >
                    Mô phỏng thanh toán thành công
                  </Button>
                </div>
              )}
              
              {paymentUrl && !isDevMode && (
                <Button 
                  variant="default" 
                  size="lg"
                  className="flex items-center gap-2 mt-4"
                  onClick={() => window.open(paymentUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                  Mở trang thanh toán PayOS
                </Button>
              )}
            </>
          )}

          <p className="text-sm text-muted-foreground mt-6 text-center max-w-sm">
            {isDevMode 
              ? "Đây là môi trường thử nghiệm. Không có kết nối thực tế tới các cổng thanh toán."
              : "Hệ thống sẽ tự động cập nhật khi bạn thanh toán thành công. Vui lòng không đóng cửa sổ này trong quá trình thanh toán."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
