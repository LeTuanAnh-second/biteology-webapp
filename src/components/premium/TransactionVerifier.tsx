
import { FC, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TransactionVerifierProps {
  onVerify: (transactionId: string) => Promise<void>;
  disabled?: boolean;
}

export const TransactionVerifier: FC<TransactionVerifierProps> = ({ 
  onVerify,
  disabled = false
}) => {
  const [transactionId, setTransactionId] = useState('');
  const [verifyingTransaction, setVerifyingTransaction] = useState(false);
  
  const handleVerify = async () => {
    if (!transactionId || transactionId.length < 5) return;
    
    setVerifyingTransaction(true);
    try {
      await onVerify(transactionId);
    } finally {
      setVerifyingTransaction(false);
    }
  };
  
  return (
    <div className="w-full space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="transactionId">Mã giao dịch</Label>
        <Input 
          id="transactionId"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="Nhập mã giao dịch từ ngân hàng hoặc MoMo"
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Nhập mã giao dịch từ tin nhắn ngân hàng hoặc MoMo sau khi đã thanh toán
        </p>
      </div>
      
      <Button 
        variant="default" 
        size="lg"
        className="w-full flex items-center gap-2"
        onClick={handleVerify}
        disabled={!transactionId || transactionId.length < 5 || verifyingTransaction || disabled}
      >
        {verifyingTransaction ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        Xác nhận thanh toán
      </Button>
    </div>
  );
};
