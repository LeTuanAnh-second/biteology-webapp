
import { FC } from "react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const PaymentHeader: FC = () => {
  return (
    <DialogHeader>
      <DialogTitle>Thanh toán qua MoMo</DialogTitle>
      <DialogDescription>
        Quét mã QR bên dưới để thanh toán, sau đó nhập mã giao dịch để xác nhận
      </DialogDescription>
    </DialogHeader>
  );
};
