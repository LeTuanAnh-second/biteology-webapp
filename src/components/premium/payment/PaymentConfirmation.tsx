
import { FC } from "react";
import { PaymentQRDisplay } from "../PaymentQRDisplay";
import { TransactionVerifier } from "../TransactionVerifier";
import { CancelPayment } from "./CancelPayment";

interface PaymentConfirmationProps {
  qrImageUrl: string | null;
  selectedPlanPrice: number;
  selectedPlanName?: string;
  onVerify: (transactionId: string, bankType: string) => Promise<void>;
  onCancel: () => Promise<void>;
}

export const PaymentConfirmation: FC<PaymentConfirmationProps> = ({
  qrImageUrl,
  selectedPlanPrice,
  selectedPlanName = "Cơ bản",
  onVerify,
  onCancel,
}) => {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <PaymentQRDisplay 
        qrImageUrl={qrImageUrl} 
        amount={selectedPlanPrice}
        planLabel={selectedPlanName}
      />
      
      <TransactionVerifier 
        onVerify={onVerify}
      />

      <CancelPayment onCancel={onCancel} />
    </div>
  );
};
