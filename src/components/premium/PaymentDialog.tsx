
import { DirectPaymentLink } from "./DirectPaymentLink";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlan: {
    id: string;
    name: string;
    price: number;
  } | null;
  onPaymentSuccess: () => void;
}

export const PaymentDialog = ({
  open,
  onOpenChange,
  selectedPlan,
  onPaymentSuccess,
}: PaymentDialogProps) => {
  return (
    <DirectPaymentLink
      open={open}
      onOpenChange={onOpenChange}
      selectedPlan={selectedPlan}
      onPaymentSuccess={onPaymentSuccess}
    />
  );
};
