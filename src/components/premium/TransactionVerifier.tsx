
import { FC, useState, useEffect } from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { paymentService } from "@/services/paymentService";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import the transaction patterns from paymentService
import { transactionIdPatterns } from "@/services/paymentService";

interface TransactionVerifierProps {
  onVerify: (transactionId: string, bankType: string) => Promise<void>;
  disabled?: boolean;
}

export const TransactionVerifier: FC<TransactionVerifierProps> = ({ 
  onVerify,
  disabled = false
}) => {
  const [transactionId, setTransactionId] = useState('');
  const [bankType, setBankType] = useState('momo');
  const [error, setError] = useState('');
  const [verifyingTransaction, setVerifyingTransaction] = useState(false);
  const [helpText, setHelpText] = useState('');
  const { toast } = useToast();
  
  const validateTransactionId = () => {
    if (!transactionId) {
      setError('Vui lòng nhập mã giao dịch');
      return false;
    }
    
    const validationResult = paymentService.validateTransactionId(transactionId, bankType);
    
    if (!validationResult.valid) {
      setError(validationResult.error || 'Mã giao dịch không hợp lệ');
      return false;
    }
    
    setError('');
    return true;
  };
  
  const handleVerify = async () => {
    if (!validateTransactionId()) {
      return;
    }
    
    setVerifyingTransaction(true);
    try {
      await onVerify(transactionId, bankType);
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
    setError('');
    
    // Tự động kiểm tra định dạng khi người dùng nhập
    if (e.target.value.length > 3) {
      const validationResult = paymentService.validateTransactionId(e.target.value, bankType);
      if (!validationResult.valid) {
        setError(validationResult.error || '');
      }
    }
  };

  const bankOptions = [
    { value: 'momo', label: 'MoMo' },
    { value: 'bidv', label: 'BIDV' },
    { value: 'techcombank', label: 'Techcombank' },
    { value: 'vietcombank', label: 'Vietcombank' },
    { value: 'agribank', label: 'Agribank' },
    { value: 'tpbank', label: 'TPBank' },
    { value: 'other', label: 'Ngân hàng khác' },
  ];
  
  const getBankHelpText = () => {
    const bank = bankOptions.find(b => b.value === bankType);
    const validator = transactionIdPatterns[bankType as keyof typeof transactionIdPatterns] || transactionIdPatterns.other;
    return validator.description || '';
  };
  
  // Cập nhật văn bản trợ giúp khi thay đổi loại ngân hàng
  useEffect(() => {
    setHelpText(getBankHelpText());
  }, [bankType]);
  
  return (
    <div className="w-full space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="bankType">Chọn ngân hàng</Label>
        <Select value={bankType} onValueChange={(value) => {
          setBankType(value);
          setError('');
        }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn ngân hàng/ví điện tử" />
          </SelectTrigger>
          <SelectContent>
            {bankOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {helpText}
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="transactionId">Mã giao dịch</Label>
        <Input 
          id="transactionId"
          value={transactionId}
          onChange={handleTransactionIdChange}
          placeholder="Nhập mã giao dịch từ ngân hàng hoặc ví điện tử"
          className={`w-full ${error ? 'border-red-500' : ''}`}
        />
        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs ml-2">
              {error}
            </AlertDescription>
          </Alert>
        )}
        <p className="text-xs text-muted-foreground">
          Nhập chính xác mã giao dịch từ tin nhắn ngân hàng hoặc ví điện tử sau khi đã thanh toán
        </p>
      </div>
      
      <Button 
        variant="default" 
        size="lg"
        className="w-full flex items-center gap-2"
        onClick={handleVerify}
        disabled={!transactionId || verifyingTransaction || disabled || !!error}
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
