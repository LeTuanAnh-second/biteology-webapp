
import { useState, useEffect } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
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
  const [copied, setCopied] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    // Set QR code and payment URL based on the selected plan
    if (selectedPlan) {
      if (selectedPlan.name === "Cơ bản") {
        setQrImageUrl("/lovable-uploads/c254c28f-f0dd-46e2-9bcd-c39f85b52696.png");
        setPaymentUrl("https://pay.payos.vn/web/5a13459ee53d419abfd32e2c01a72435");
      } else {
        // Default QR for other plans
        setQrImageUrl("/lovable-uploads/c254c28f-f0dd-46e2-9bcd-c39f85b52696.png");
        setPaymentUrl("https://pay.payos.vn/web/5a13459ee53d419abfd32e2c01a72435");
      }
    }
  }, [selectedPlan]);
  
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };
  
  const handlePaymentSuccess = async () => {
    if (!user || !selectedPlan) return;
    
    try {
      // Create a transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: user.id,
          plan_id: selectedPlan.id,
          amount: selectedPlan.price,
          payment_method: 'direct_bank_transfer',
          status: 'completed'
        })
        .select()
        .single();
      
      if (transactionError) throw transactionError;
      
      // Calculate end date based on plan duration
      const { data: planData } = await supabase
        .from('premium_plans')
        .select('duration_days')
        .eq('id', selectedPlan.id)
        .single();
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (planData?.duration_days || 30));
      
      // Create subscription record
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: selectedPlan.id,
          transaction_id: transaction.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'active'
        });
      
      if (subscriptionError) throw subscriptionError;
      
      // Update user profile to premium
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      toast({
        title: "Thanh toán thành công!",
        description: "Tài khoản của bạn đã được nâng cấp lên Premium.",
      });
      
      onPaymentSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error processing payment success:', error);
      toast({
        variant: "destructive",
        title: "Có lỗi xảy ra",
        description: "Không thể cập nhật trạng thái Premium. Vui lòng thử lại sau.",
      });
    }
  };
  
  const paymentDetails = {
    bankName: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
    accountHolder: "LE TUAN ANH",
    accountNumber: "6310941542",
    amount: selectedPlan?.price || 0,
    description: selectedPlan ? `Biteology - ${selectedPlan.name}` : "Biteology Premium"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thông tin thanh toán</DialogTitle>
          <DialogDescription>
            Vui lòng sử dụng thông tin dưới đây để chuyển khoản thanh toán
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col py-4">
          <div className="flex justify-center mb-4">
            {qrImageUrl && (
              <img 
                src={qrImageUrl} 
                alt="Mã QR thanh toán" 
                className="w-48 h-48 object-contain"
              />
            )}
          </div>
          
          {paymentUrl && (
            <div className="flex justify-center mb-6">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => window.open(paymentUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                Mở trang thanh toán
              </Button>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Ngân hàng</p>
                <p className="font-medium">{paymentDetails.bankName}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 gap-1"
                onClick={() => handleCopy(paymentDetails.bankName, 'bankName')}
              >
                {copied === 'bankName' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Sao chép
              </Button>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Chủ tài khoản</p>
                <p className="font-medium">{paymentDetails.accountHolder}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 gap-1"
                onClick={() => handleCopy(paymentDetails.accountHolder, 'accountHolder')}
              >
                {copied === 'accountHolder' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Sao chép
              </Button>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Số tài khoản</p>
                <p className="font-medium">{paymentDetails.accountNumber}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 gap-1"
                onClick={() => handleCopy(paymentDetails.accountNumber, 'accountNumber')}
              >
                {copied === 'accountNumber' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Sao chép
              </Button>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Số tiền</p>
                <p className="font-medium">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(paymentDetails.amount)}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 gap-1"
                onClick={() => handleCopy(paymentDetails.amount.toString(), 'amount')}
              >
                {copied === 'amount' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Sao chép
              </Button>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Mô tả</p>
                <p className="font-medium">{paymentDetails.description}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 gap-1"
                onClick={() => handleCopy(paymentDetails.description, 'description')}
              >
                {copied === 'description' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Sao chép
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-amber-600 mb-4">
              Sau khi chuyển khoản, vui lòng nhấn nút bên dưới để xác nhận thanh toán. 
              Chúng tôi sẽ kiểm tra và cập nhật tài khoản của bạn trong thời gian sớm nhất.
            </p>
            
            <Button 
              onClick={handlePaymentSuccess}
              className="w-full"
            >
              Tôi đã thanh toán thành công
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
