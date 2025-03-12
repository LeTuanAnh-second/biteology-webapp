
import { useState, useEffect } from "react";
import { Loader2, ExternalLink, AlertCircle, RefreshCw, Check } from "lucide-react";
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
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDevMode, setIsDevMode] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'payos' | 'zalopay' | 'manual'>('manual');
  const [transactionId, setTransactionId] = useState('');
  const [verifyingTransaction, setVerifyingTransaction] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fixed QR Image for Cơ Bản plan
  const fixedQrImage = "/lovable-uploads/358581bf-724d-47aa-b28d-62e3529ef5ad.png";
  
  const createPaymentRequest = async () => {
    if (!user || !selectedPlan) return;
    
    // If this is the basic plan and manual payment method, just show the fixed QR
    if (paymentMethod === 'manual' && selectedPlan.name === "Cơ bản") {
      setQrImageUrl(fixedQrImage);
      // Generate a random order ID for tracking
      setOrderId(`manual-${Date.now()}`);
      return;
    }
    
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
      console.log(`Calling ${paymentMethod} create order endpoint`);
      
      const functionName = paymentMethod === 'payos' 
        ? 'payos-create-order' 
        : 'zalopay-create-order';
      
      const response = await supabase.functions.invoke(functionName, {
        body: {
          planId: selectedPlan.id,
          userId: user.id
        }
      });

      console.log(`${paymentMethod} create order response:`, response);

      if (response.error) {
        console.error(`Error from ${paymentMethod} function:`, response.error);
        throw new Error(response.error.message || "Không thể tạo thanh toán");
      }

      if (!response.data?.success) {
        console.error(`Failed response from ${paymentMethod}:`, response.data);
        throw new Error(response.data?.error || "Không thể tạo thanh toán");
      }

      // Phản hồi từ PayOS
      if (paymentMethod === 'payos') {
        const { checkoutUrl, qrCode, orderId: newOrderId, isDevMode: isDev } = response.data;
        
        console.log("Received payment data:", { checkoutUrl, qrCode, newOrderId, isDevMode: isDev });
        
        // Check if this is a simulated response (development mode)
        setIsDevMode(isDev);
        
        // Ensure the QR code URL is actually set
        if (!qrCode) {
          throw new Error("Không nhận được mã QR từ PayOS");
        }
        
        setQrImageUrl(qrCode);
        setPaymentUrl(checkoutUrl);
        setOrderId(newOrderId);
      } 
      // Phản hồi từ ZaloPay
      else {
        const { data } = response.data;
        
        console.log("Received ZaloPay payment data:", data);
        
        setIsDevMode(data.isDevMode);
        setPaymentUrl(data.order_url);
        setOrderId(data.transactionId);
        // ZaloPay không trả về URL mã QR riêng biệt
      }
      
      if (isDevMode) {
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
      // Store transaction in database with transaction ID
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .update({ 
          payment_id: transactionId,
          status: 'completed' 
        })
        .eq('order_id', orderId)
        .select()
        .single();
        
      if (transactionError) {
        throw new Error("Không thể cập nhật thông tin giao dịch");
      }

      // Calculate subscription end date
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (selectedPlan.name === "Cơ bản" ? 30 : 90)); // Default 30 days for basic plan

      // Check if user already has a subscription
      const { data: existingSubscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();

      if (existingSubscription) {
        // Update existing subscription
        await supabase
          .from('user_subscriptions')
          .update({
            plan_id: selectedPlan.id,
            transaction_id: transaction.id,
            start_date: new Date().toISOString(),
            end_date: endDate.toISOString(),
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id);
      } else {
        // Create new subscription
        await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user?.id,
            plan_id: selectedPlan.id,
            transaction_id: transaction.id,
            start_date: new Date().toISOString(),
            end_date: endDate.toISOString(),
            status: 'active'
          });
      }

      // Update user's premium status
      await supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', user?.id);
        
      // Show success message
      toast({
        title: "Thanh toán thành công!",
        description: "Tài khoản của bạn đã được nâng cấp lên Premium.",
      });
      
      // Call success callback
      onPaymentSuccess?.();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error verifying manual transaction:', error);
      toast({
        variant: "destructive",
        title: "Lỗi xác minh giao dịch",
        description: error instanceof Error ? error.message : "Không thể xác minh giao dịch. Vui lòng thử lại hoặc liên hệ hỗ trợ.",
      });
    } finally {
      setVerifyingTransaction(false);
    }
  };

  // Simulate successful payment in development mode
  const simulateSuccessfulPayment = async () => {
    if (!isDevMode || !orderId) return;
    
    setIsLoading(true);
    
    try {
      // Gọi API xác minh thanh toán để cập nhật trạng thái
      const response = await supabase.functions.invoke('payos-verify-payment', {
        body: { orderId }
      });
      
      console.log("Payment verification response:", response);
      
      // Hiển thị thông báo thành công
      toast({
        title: "Thanh toán thành công!",
        description: "Đây là thanh toán giả lập trong chế độ phát triển.",
      });
      
      // Gọi callback để cập nhật giao diện
      onPaymentSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error simulating payment:", error);
      toast({
        variant: "destructive", 
        title: "Lỗi",
        description: "Không thể giả lập thanh toán thành công."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Chuyển đổi phương thức thanh toán
  const togglePaymentMethod = () => {
    if (paymentMethod === 'payos') {
      setPaymentMethod('zalopay');
    } else if (paymentMethod === 'zalopay') {
      setPaymentMethod('manual');
    } else {
      setPaymentMethod('payos');
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
      setPaymentUrl(null);
      setOrderId(null);
      setError(null);
      setIsDevMode(false);
      setTransactionId('');
    }
  }, [open, selectedPlan, paymentMethod]);

  // Check payment status periodically (only in production mode)
  useEffect(() => {
    if (!orderId || !open || isDevMode || paymentMethod === 'manual') return;

    const checkPaymentStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        console.log("Checking payment status for order:", orderId);
        const response = await supabase.functions.invoke('payos-verify-payment', {
          body: { orderId }
        });

        console.log("Payment verification response:", response);

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
  }, [orderId, open, onPaymentSuccess, onOpenChange, isDevMode, paymentMethod]);

  // Generate payment method title
  const getPaymentMethodTitle = () => {
    switch (paymentMethod) {
      case 'payos': return 'PayOS';
      case 'zalopay': return 'ZaloPay';
      case 'manual': return 'Chuyển khoản ngân hàng';
      default: return 'Thanh toán';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thanh toán qua {getPaymentMethodTitle()}</DialogTitle>
          <DialogDescription>
            {paymentMethod === 'manual' 
              ? "Quét mã QR bên dưới để thanh toán, sau đó nhập mã giao dịch để xác nhận" 
              : isDevMode 
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
              
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={togglePaymentMethod}
                >
                  <RefreshCw className="h-4 w-4" />
                  Thử với {paymentMethod === 'payos' ? 'ZaloPay' : paymentMethod === 'zalopay' ? 'Chuyển khoản' : 'PayOS'}
                </Button>
                
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
            </div>
          ) : (
            <>
              {/* Manual payment with fixed QR code */}
              {paymentMethod === 'manual' && selectedPlan?.name === "Cơ bản" && (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="flex flex-col items-center mb-2">
                    <p className="text-sm text-muted-foreground mb-2">Quét mã QR để thanh toán</p>
                    <img 
                      src={fixedQrImage} 
                      alt="Mã QR thanh toán" 
                      className="w-64 h-64 object-contain border rounded-md shadow-sm"
                    />
                    <p className="text-sm font-medium mt-2">Số tiền: 24,000 VND</p>
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
                        placeholder="Nhập mã giao dịch từ ngân hàng"
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Nhập mã giao dịch từ tin nhắn ngân hàng sau khi đã thanh toán
                      </p>
                    </div>
                    
                    <Button 
                      variant="default" 
                      size="lg"
                      className="w-full flex items-center gap-2"
                      onClick={verifyManualTransaction}
                      disabled={!transactionId || verifyingTransaction}
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
              )}
              
              {/* Auto payment methods */}
              {paymentMethod !== 'manual' && qrImageUrl && !isDevMode && (
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
                <div className="flex flex-col items-center mb-4 w-full">
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
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Mô phỏng thanh toán thành công
                  </Button>
                </div>
              )}
              
              {paymentMethod !== 'manual' && paymentUrl && !isDevMode && (
                <Button 
                  variant="default" 
                  size="lg"
                  className="flex items-center gap-2 mt-4"
                  onClick={() => window.open(paymentUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                  Mở trang thanh toán {paymentMethod === 'payos' ? 'PayOS' : 'ZaloPay'}
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                className="mt-4"
                onClick={togglePaymentMethod}
              >
                Thử với {paymentMethod === 'payos' ? 'ZaloPay' : paymentMethod === 'zalopay' ? 'Chuyển khoản' : 'PayOS'}
              </Button>
            </>
          )}

          <p className="text-sm text-muted-foreground mt-6 text-center max-w-sm">
            {paymentMethod === 'manual' 
              ? "Sau khi thanh toán, vui lòng nhập mã giao dịch từ tin nhắn ngân hàng vào ô mã giao dịch và nhấn Xác nhận thanh toán."
              : isDevMode 
                ? "Đây là môi trường thử nghiệm. Không có kết nối thực tế tới các cổng thanh toán."
                : "Hệ thống sẽ tự động cập nhật khi bạn thanh toán thành công. Vui lòng không đóng cửa sổ này trong quá trình thanh toán."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
