
import { FC } from "react";

interface PaymentQRDisplayProps {
  qrImageUrl: string | null;
  amount: number;
  planLabel?: string;
}

// Ánh xạ các hình ảnh QR từng gói
const qrImages = {
  "Cơ bản": "/lovable-uploads/e5298bd7-c592-4f3a-a38c-e91e092c5fac.png", // 24.000đ
  "Tiêu chuẩn": "/lovable-uploads/e28bcba1-a359-4a26-b0ef-aeee494c0a7b.png", // 50.000đ
  "Cao cấp": "/lovable-uploads/2cf3cfb5-2142-45e6-8793-8e78c6c858d9.png", // 100.000đ
};

export const PaymentQRDisplay: FC<PaymentQRDisplayProps> = ({ 
  qrImageUrl,
  amount,
  planLabel = "Cơ bản"
}) => {
  // Chọn ảnh QR tương ứng với gói
  const qrImage = qrImages[planLabel as keyof typeof qrImages] || qrImages["Cơ bản"];
  
  return (
    <div className="flex flex-col items-center mb-2">
      <p className="text-sm text-muted-foreground mb-2">Quét mã QR để thanh toán</p>
      <div className="max-w-[350px] mx-auto">
        <img 
          src={qrImage}
          alt="Mã QR thanh toán" 
          className="w-full object-contain border rounded-md shadow-sm"
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Nhập chính xác mã giao dịch từ tin nhắn MoMo sau khi đã thanh toán
      </p>
    </div>
  );
};
