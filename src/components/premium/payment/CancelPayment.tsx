
import { FC } from "react";
import { Button } from "@/components/ui/button";

interface CancelPaymentProps {
  onCancel: () => Promise<void>;
}

export const CancelPayment: FC<CancelPaymentProps> = ({ onCancel }) => {
  return (
    <Button 
      variant="outline" 
      className="mt-2 w-full"
      onClick={onCancel}
    >
      Hủy thanh toán
    </Button>
  );
};
