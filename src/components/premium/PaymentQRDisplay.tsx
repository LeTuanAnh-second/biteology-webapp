
import { FC } from "react";

interface PaymentQRDisplayProps {
  qrImageUrl: string | null;
  amount: number;
}

export const PaymentQRDisplay: FC<PaymentQRDisplayProps> = ({ 
  qrImageUrl,
  amount 
}) => {
  if (!qrImageUrl) return null;
  
  return (
    <div className="flex flex-col items-center mb-2">
      <p className="text-sm text-muted-foreground mb-2">Quét mã QR để thanh toán</p>
      <img 
        src={qrImageUrl} 
        alt="Mã QR thanh toán" 
        className="w-80 h-80 object-contain border rounded-md shadow-sm"
      />
      <p className="text-sm font-medium mt-2">Số tiền: {amount.toLocaleString('vi-VN')} VND</p>
      <p className="text-xs text-muted-foreground mt-1">
        LE TUAN ANH<br />
        6310941542<br />
        BIDV - CN DAK LAK
      </p>
    </div>
  );
};
