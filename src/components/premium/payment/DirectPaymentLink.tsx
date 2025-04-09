
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PaymentQRDisplay } from "../PaymentQRDisplay";
import { TransactionVerifier } from "../TransactionVerifier";
import { PaymentLoading } from "../PaymentLoading";
import { PaymentError } from "../PaymentError";
import { paymentService } from "@/services/paymentService";
import { PaymentHeader } from "./PaymentHeader";
import { PaymentConfirmation } from "./PaymentConfirmation";

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
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const createPaymentRequest = async () => {
    if (!user || !selectedPlan) return;
    
    setIsLoading(true);
    setError(null);
    setQrImageUrl(null);
    
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
      
      const result = await paymentService.createPaymentRequest({
        userId: user.id,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amount: selectedPlan.price
      });
      
      setOrderId(result.orderId);
      setQrImageUrl(result.qrImageUrl);
      
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

  // Verify manual transaction
  const verifyManualTransaction = async (transactionId: string, bankType: string) => {
    if (!orderId || !selectedPlan) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập mã giao dịch",
      });
      return;
    }
    
    try {
      console.log(`Using momo-verify-payment to verify transaction ${orderId} from ${bankType} with ID: ${transactionId}`);
      
      await paymentService.verifyTransaction(orderId, transactionId, bankType);
      
      // Hiển thị thông báo thành công
      toast({
        title: "Thanh toán thành công!",
        description: "Tài khoản của bạn đã được nâng cấp lên Premium.",
      });
      
      // Gọi callback để cập nhật giao diện
      onPaymentSuccess?.();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error verifying transaction:', error);
      throw error;
    }
  };

  // Cancel payment
  const handleCancelPayment = async () => {
    if (!orderId) return;
    
    try {
      await paymentService.cancelPayment(orderId);
      
      toast({
        title: "Đã hủy thanh toán",
        description: "Giao dịch đã được hủy thành công.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error cancelling payment:', error);
      toast({
        variant: "destructive",
        title: "Lỗi hủy thanh toán",
        description: error instanceof Error ? error.message : "Không thể hủy thanh toán. Vui lòng thử lại sau.",
      });
    }
  };

  // Create payment request when dialog opens
  useEffect(() => {
    if (open && selectedPlan) {
      createPaymentRequest();
    } else {
      // Reset state when dialog closes
      setQrImageUrl(null);
      setOrderId(null);
      setError(null);
    }
  }, [open, selectedPlan]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <PaymentHeader />
        
        <div className="flex flex-col items-center py-4">
          {isLoading ? (
            <PaymentLoading />
          ) : error ? (
            <PaymentError 
              errorMessage={error} 
              onRetry={createPaymentRequest} 
            />
          ) : (
            <PaymentConfirmation 
              qrImageUrl={qrImageUrl}
              selectedPlanPrice={selectedPlan?.price || 0}
              onVerify={verifyManualTransaction}
              onCancel={handleCancelPayment}
            />
          )}

          <p className="text-sm text-muted-foreground mt-6 text-center max-w-sm">
            Sau khi thanh toán, vui lòng chọn ngân hàng/ví điện tử và nhập mã giao dịch từ tin nhắn để xác nhận thanh toán.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
