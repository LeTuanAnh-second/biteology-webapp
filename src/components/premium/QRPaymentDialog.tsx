
import { Check, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface QRPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentStatus: 'pending' | 'success' | 'failed';
  qrPaymentData: {
    orderId: string;
    qrCodeUrl: string;
    amount: number;
    orderInfo: string;
    status: string;
  } | null;
}

export const QRPaymentDialog = ({ 
  open, 
  onOpenChange, 
  paymentStatus, 
  qrPaymentData 
}: QRPaymentDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quét mã QR để thanh toán</DialogTitle>
          <DialogDescription>
            Sử dụng ứng dụng ngân hàng của bạn để quét mã QR bên dưới.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          {paymentStatus === 'pending' && (
            <>
              {qrPaymentData && (
                <>
                  <div className="mb-4 text-center">
                    <p className="font-medium">{qrPaymentData.orderInfo}</p>
                    <p className="text-xl font-bold mt-1">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(qrPaymentData.amount)}
                    </p>
                  </div>
                  
                  <div className="border p-2 rounded-lg mb-4">
                    <img 
                      src={qrPaymentData.qrCodeUrl} 
                      alt="Mã QR thanh toán PayOS" 
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    Mã đơn hàng: {qrPaymentData.orderId}
                  </p>
                  
                  <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Đang chờ thanh toán...
                  </div>
                </>
              )}
            </>
          )}
          
          {paymentStatus === 'success' && (
            <div className="text-center">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Thanh toán thành công!</h3>
              <p className="text-muted-foreground">
                Tài khoản của bạn đã được nâng cấp lên Premium.
              </p>
            </div>
          )}
          
          {paymentStatus === 'failed' && (
            <div className="text-center">
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Thanh toán thất bại</h3>
              <p className="text-muted-foreground">
                Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
