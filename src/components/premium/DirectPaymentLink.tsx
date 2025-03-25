
import { useState, useEffect } from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [verifyingTransaction, setVerifyingTransaction] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // QR Images based on plan
  const qrImages = {
    basic: "/lovable-uploads/358581bf-724d-47aa-b28d-62e3529ef5ad.png", // Default QR for basic plan
    standard: "/lovable-uploads/b19023aa-c7f7-4dea-b541-562bcabfcd3c.png" // New QR for standard plan
  };
  
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
      
      // Generate a random order ID for tracking - use momo prefix
      const manualOrderId = `momo-${Date.now()}`;
      
      // Create a transaction record in database
      const { data, error } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: user.id,
          plan_id: selectedPlan.id,
          amount: selectedPlan.price,
          status: 'pending',
          payment_method: 'momo',
          order_id: manualOrderId
        })
        .select()
        .single();
        
      if (error) {
        console.error("Error creating transaction:", error);
        throw new Error("Không thể tạo giao dịch");
      }
      
      setOrderId(manualOrderId);
      
      // Select QR image based on plan name (lowercase for consistency)
      const planName = selectedPlan.name.toLowerCase();
      const qrImage = planName === 'tiêu chuẩn' || planName === 'standard' 
        ? qrImages.standard 
        : qrImages.basic;
      
      setQrImageUrl(qrImage);
      
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
  const verifyManualTransaction = async () => {
    if (!transactionId || !orderId || !selectedPlan) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập mã giao dịch",
      });
      return;
    }
    
    setVerifyingTransaction(true);
    
    try {
      console.log(`Using momo-verify-payment to verify transaction ${orderId}`);
      
      // Gọi API xác minh thanh toán
      const response = await supabase.functions.invoke('momo-verify-payment', {
        body: { 
          orderId: orderId,
          transactionId: transactionId
        }
      });
      
      console.log("Verification response:", response);
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || "Không thể xác minh giao dịch");
      }
      
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
      toast({
        variant: "destructive",
        title: "Lỗi xác minh giao dịch",
        description: error instanceof Error ? error.message : "Không thể xác minh giao dịch. Vui lòng thử lại hoặc liên hệ hỗ trợ.",
      });
    } finally {
      setVerifyingTransaction(false);
    }
  };

  // Create payment request when dialog opens
  useEffect(() => {
    if (open && selectedPlan) {
      // Reset transaction ID when opening
      setTransactionId('');
      createPaymentRequest();
    } else {
      // Reset state when dialog closes
      setQrImageUrl(null);
      setOrderId(null);
      setError(null);
      setTransactionId('');
    }
  }, [open, selectedPlan]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thanh toán qua MoMo</DialogTitle>
          <DialogDescription>
            Quét mã QR bên dưới để thanh toán, sau đó nhập mã giao dịch để xác nhận
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
              
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => createPaymentRequest()}
                >
                  Thử lại
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="flex flex-col items-center mb-2">
                  <p className="text-sm text-muted-foreground mb-2">Quét mã QR để thanh toán</p>
                  <img 
                    src={qrImageUrl || ""} 
                    alt="Mã QR thanh toán" 
                    className="w-64 h-64 object-contain border rounded-md shadow-sm"
                  />
                  <p className="text-sm font-medium mt-2">Số tiền: {selectedPlan?.price.toLocaleString('vi-VN')} VND</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    LE TUAN ANH<br />
                    6310941542<br />
                    BIDV - CN DAK LAK
                  </p>
                </div>
                
                <div className="w-full space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="transactionId">Mã giao dịch</Label>
                    <Input 
                      id="transactionId"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Nhập mã giao dịch từ ngân hàng hoặc MoMo"
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Nhập mã giao dịch từ tin nhắn ngân hàng hoặc MoMo sau khi đã thanh toán
                    </p>
                  </div>
                  
                  <Button 
                    variant="default" 
                    size="lg"
                    className="w-full flex items-center gap-2"
                    onClick={verifyManualTransaction}
                    disabled={!transactionId || transactionId.length < 5 || verifyingTransaction}
                  >
                    {verifyingTransaction ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Xác nhận thanh toán
                  </Button>
                </div>
              </div>
            </>
          )}

          <p className="text-sm text-muted-foreground mt-6 text-center max-w-sm">
            Sau khi thanh toán, vui lòng nhập mã giao dịch từ tin nhắn ngân hàng hoặc MoMo vào ô mã giao dịch và nhấn Xác nhận thanh toán.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
