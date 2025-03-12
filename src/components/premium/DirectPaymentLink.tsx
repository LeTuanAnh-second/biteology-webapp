
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
  const [paymentMethod, setPaymentMethod] = useState<'payos' | 'zalopay' | 'momo' | 'manual'>('manual');
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
      
      // Xác định loại thanh toán và endpoint tương ứng
      let functionName = '';
      if (paymentMethod === 'payos') {
        functionName = 'payos-create-order';
      } else if (paymentMethod === 'zalopay') {
        functionName = 'zalopay-create-order';
      } else if (paymentMethod === 'momo') {
        functionName = 'momo-create-order';
        // Nếu là MoMo và gói Cơ bản, cũng sử dụng QR cố định
        if (selectedPlan.name === "Cơ bản") {
          setQrImageUrl(fixedQrImage);
          setOrderId(`momo-${Date.now()}`);
          
          // Tạo giao dịch trong cơ sở dữ liệu
          const { data, error } = await supabase
            .from('payment_transactions')
            .insert({
              user_id: user.id,
              plan_id: selectedPlan.id,
              amount: selectedPlan.price,
              status: 'pending',
              payment_method: 'momo',
              order_id: `momo-${Date.now()}`
            })
            .select()
            .single();
            
          if (error) {
            console.error("Error creating transaction:", error);
            throw new Error("Không thể tạo giao dịch");
          }
          
          setOrderId(data.order_id);
          setIsLoading(false);
          return;
        }
      }
      
      if (!functionName && paymentMethod !== 'manual') {
        throw new Error("Phương thức thanh toán không hợp lệ");
      }
      
      if (paymentMethod === 'manual') {
        // Generate a random order ID for tracking
        const manualOrderId = `manual-${Date.now()}`;
        
        // Create a transaction record in database
        const { data, error } = await supabase
          .from('payment_transactions')
          .insert({
            user_id: user.id,
            plan_id: selectedPlan.id,
            amount: selectedPlan.price,
            status: 'pending',
            payment_method: 'manual',
            order_id: manualOrderId
          })
          .select()
          .single();
          
        if (error) {
          console.error("Error creating transaction:", error);
          throw new Error("Không thể tạo giao dịch");
        }
        
        setOrderId(manualOrderId);
        setQrImageUrl(fixedQrImage);
        setIsLoading(false);
        return;
      }
      
      console.log(`Calling ${paymentMethod} create order endpoint: ${functionName}`);
      
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
        if (!qrCode && !isDev) {
          throw new Error("Không nhận được mã QR từ PayOS");
        }
        
        setQrImageUrl(qrCode);
        setPaymentUrl(checkoutUrl);
        setOrderId(newOrderId);
      } 
      // Phản hồi từ ZaloPay
      else if (paymentMethod === 'zalopay') {
        const { data } = response.data;
        
        console.log("Received ZaloPay payment data:", data);
        
        setIsDevMode(data.isDevMode);
        setPaymentUrl(data.order_url);
        setOrderId(data.transactionId);
        // ZaloPay không trả về URL mã QR riêng biệt
      }
      // Phản hồi từ MoMo
      else if (paymentMethod === 'momo') {
        const { data } = response.data;
        
        console.log("Received MoMo payment data:", data);
        
        setIsDevMode(data.isDevMode || false);
        setOrderId(data.orderId);
        
        // MoMo có thể trả về URL của mã QR
        if (data.qrCodeUrl) {
          setQrImageUrl(data.qrCodeUrl);
        }
        
        // Dùng QR cố định cho MoMo nếu không có QR từ MoMo
        if (!data.qrCodeUrl && selectedPlan.name === "Cơ bản") {
          setQrImageUrl(fixedQrImage);
        }
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
      // Xác định hàm xác minh dựa trên phương thức thanh toán
      const verifyFunction = orderId.startsWith('momo-') 
        ? 'momo-verify-payment' 
        : 'payos-verify-payment';
      
      console.log(`Using ${verifyFunction} to verify transaction`);
      
      // Gọi API xác minh thanh toán
      const response = await supabase.functions.invoke(verifyFunction, {
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

  // Simulate successful payment in development mode
  const simulateSuccessfulPayment = async () => {
    if (!isDevMode || !orderId) return;
    
    setIsLoading(true);
    
    try {
      // Xác định hàm xác minh dựa trên phương thức thanh toán
      const verifyFunction = paymentMethod === 'momo' 
        ? 'momo-verify-payment' 
        : 'payos-verify-payment';
      
      // Gọi API xác minh thanh toán để cập nhật trạng thái
      const response = await supabase.functions.invoke(verifyFunction, {
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
      setPaymentMethod('momo');
    } else if (paymentMethod === 'momo') {
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
    if (!orderId || !open || isDevMode || paymentMethod === 'manual' || orderId.startsWith('momo-') || orderId.startsWith('manual-')) return;

    const checkPaymentStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        console.log("Checking payment status for order:", orderId);
        const verifyFunction = paymentMethod === 'momo' 
          ? 'momo-verify-payment' 
          : 'payos-verify-payment';
          
        const response = await supabase.functions.invoke(verifyFunction, {
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
      case 'momo': return 'MoMo';
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
            {(paymentMethod === 'manual' || (paymentMethod === 'momo' && selectedPlan?.name === "Cơ bản"))
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
                  Thử với {
                    paymentMethod === 'payos' 
                      ? 'ZaloPay' 
                      : paymentMethod === 'zalopay' 
                        ? 'MoMo' 
                        : paymentMethod === 'momo' 
                          ? 'Chuyển khoản' 
                          : 'PayOS'
                  }
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
              {((paymentMethod === 'manual' || (paymentMethod === 'momo' && selectedPlan?.name === "Cơ bản")) && selectedPlan?.name === "Cơ bản") && (
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
              {paymentMethod !== 'manual' && paymentMethod !== 'momo' && qrImageUrl && !isDevMode && (
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
                  Mở trang thanh toán {
                    paymentMethod === 'payos' 
                      ? 'PayOS' 
                      : paymentMethod === 'zalopay' 
                        ? 'ZaloPay' 
                        : 'MoMo'
                  }
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                className="mt-4"
                onClick={togglePaymentMethod}
              >
                Thử với {
                  paymentMethod === 'payos' 
                    ? 'ZaloPay' 
                    : paymentMethod === 'zalopay' 
                      ? 'MoMo' 
                      : paymentMethod === 'momo' 
                        ? 'Chuyển khoản' 
                        : 'PayOS'
                }
              </Button>
            </>
          )}

          <p className="text-sm text-muted-foreground mt-6 text-center max-w-sm">
            {(paymentMethod === 'manual' || (paymentMethod === 'momo' && selectedPlan?.name === "Cơ bản"))
              ? "Sau khi thanh toán, vui lòng nhập mã giao dịch từ tin nhắn ngân hàng hoặc MoMo vào ô mã giao dịch và nhấn Xác nhận thanh toán."
              : isDevMode 
                ? "Đây là môi trường thử nghiệm. Không có kết nối thực tế tới các cổng thanh toán."
                : "Hệ thống sẽ tự động cập nhật khi bạn thanh toán thành công. Vui lòng không đóng cửa sổ này trong quá trình thanh toán."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
