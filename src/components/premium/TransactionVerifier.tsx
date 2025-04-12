
import { FC, useState } from "react";
import { Loader2, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { paymentService } from "@/services/paymentService";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [showError, setShowError] = useState(false);
  const { toast } = useToast();
  
  const validateTransactionId = () => {
    if (!transactionId) {
      return false;
    }
    
    const validationResult = paymentService.validateTransactionId(transactionId);
    
    if (!validationResult.valid) {
      setError(validationResult.error || 'Mã giao dịch không chính xác');
      return false;
    }
    
    setError('');
    return true;
  };
  
  const handleVerify = async () => {
    setShowError(true);
    
    if (!validateTransactionId()) {
      return;
    }
    
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

  const handleTransactionIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTransactionId(e.target.value);
    if (showError) {
      validateTransactionId();
    } else {
      setError('');
    }
  };
  
  return (
    <div className="w-full space-y-4 mt-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="transactionId">Mã giao dịch MoMo</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-xs text-muted-foreground cursor-help">
                  <Info className="h-3.5 w-3.5 mr-1" />
                  Hướng dẫn
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>Mã giao dịch MoMo phải có 11 chữ số và bắt đầu bằng 84 hoặc 85.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input 
          id="transactionId"
          value={transactionId}
          onChange={handleTransactionIdChange}
          placeholder="Nhập mã giao dịch từ MoMo"
          className={`w-full ${error && showError ? 'border-red-500' : ''}`}
        />
        {error && showError && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs ml-2">
              {error}
            </AlertDescription>
          </Alert>
        )}
        <p className="text-xs text-muted-foreground">
          Nhập chính xác mã giao dịch từ tin nhắn MoMo sau khi đã thanh toán
        </p>
      </div>
      
      <Button 
        variant="default" 
        size="lg"
        className="w-full flex items-center gap-2"
        onClick={handleVerify}
        disabled={!transactionId || verifyingTransaction || disabled}
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
