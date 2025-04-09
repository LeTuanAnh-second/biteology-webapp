
import { FC, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface TransactionVerifierProps {
  onVerify: (transactionId: string) => Promise<void>;
  disabled?: boolean;
}

export const TransactionVerifier: FC<TransactionVerifierProps> = ({ 
  onVerify,
  disabled = false
}) => {
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState('');
  const [verifyingTransaction, setVerifyingTransaction] = useState(false);
  const { toast } = useToast();
  
  const handleVerify = async () => {
    if (!transactionId || transactionId.length < 5) {
      setError('Mã giao dịch phải có ít nhất 5 ký tự');
      return;
    }
    
    setError('');
    setVerifyingTransaction(true);
    try {
      await onVerify(transactionId);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Có lỗi xảy ra khi xác nhận thanh toán';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Lỗi xác nhận",
        description: errorMessage
      });
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
          onChange={(e) => {
            setTransactionId(e.target.value);
            if (error) setError('');
          }}
          placeholder="Nhập mã giao dịch từ ngân hàng hoặc MoMo"
          className={`w-full ${error ? 'border-red-500' : ''}`}
        />
        {error && (
          <p className="text-xs text-red-500">
            {error}
          </p>
        )}
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
