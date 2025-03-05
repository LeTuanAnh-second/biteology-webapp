
import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DirectPaymentLinkProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlan: {
    id: string;
    name: string;
    price: number;
  } | null;
}

export const DirectPaymentLink = ({ 
  open, 
  onOpenChange,
  selectedPlan
}: DirectPaymentLinkProps) => {
  const [copied, setCopied] = useState<string | null>(null);
  
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
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
            <img 
              src="/lovable-uploads/c254c28f-f0dd-46e2-9bcd-c39f85b52696.png" 
              alt="Mã QR thanh toán" 
              className="w-48 h-48 object-contain"
            />
          </div>

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
            <p className="text-sm text-amber-600">
              Sau khi chuyển khoản, vui lòng chụp màn hình biên lai và gửi cho chúng tôi qua email 
              để xác nhận thanh toán của bạn.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
