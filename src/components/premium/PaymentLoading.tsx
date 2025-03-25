
import { FC } from "react";
import { Loader2 } from "lucide-react";

export const PaymentLoading: FC = () => {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2">Đang tạo thông tin thanh toán...</span>
    </div>
  );
};
