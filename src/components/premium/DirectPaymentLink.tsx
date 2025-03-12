
import { useState, useEffect } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

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
  const { user } = useAuth();
  const { toast } = useToast();
  
  const createPaymentRequest = async () => {
    if (!user || !selectedPlan) return;
    
    setIsLoading(true);
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
      
      // Call our PayOS create order endpoint
      const response = await supabase.functions.invoke('payos-create-order', {
        body: {
          planId: selectedPlan.id,
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { checkoutUrl, qrCode, orderId: newOrderId } = response.data;
      
      setQrImageUrl(qrCode);
      setPaymentUrl(checkoutUrl);
      setOrderId(newOrderId);
      
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        variant: "destructive",
        title: "Có lỗi xảy ra",
        description: "Không thể tạo thanh toán. Vui lòng thử lại sau.",
      });
    } finally {
      setIsLoading(false);
    }
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
    }
  }, [open, selectedPlan]);

  // Check payment status periodically
  useEffect(() => {
    if (!orderId || !open) return;

    const checkPaymentStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await supabase.functions.invoke('payos-verify-payment', {
          body: { orderId }
        });

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
  }, [orderId, open, onPaymentSuccess, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thanh toán qua PayOS</DialogTitle>
          <DialogDescription>
            Quét mã QR bên dưới để thanh toán hoặc nhấn vào nút để mở trang thanh toán
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {qrImageUrl && (
                <div className="flex justify-center mb-4">
                  <img 
                    src={qrImageUrl} 
                    alt="Mã QR thanh toán" 
                    className="w-64 h-64 object-contain"
                  />
                </div>
              )}
              
              {paymentUrl && (
                <Button 
                  variant="outline" 
                  size="lg"
                  className="flex items-center gap-2 mt-4"
                  onClick={() => window.open(paymentUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                  Mở trang thanh toán
                </Button>
              )}
            </>
          )}

          <p className="text-sm text-muted-foreground mt-4 text-center">
            Hệ thống sẽ tự động cập nhật khi bạn thanh toán thành công.
            Vui lòng không đóng cửa sổ này trong quá trình thanh toán.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
