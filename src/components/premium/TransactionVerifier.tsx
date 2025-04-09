
import { FC, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const { toast } = useToast();
  
  const handleVerify = async () => {
    if (!transactionId || transactionId.length < 5) {
      setError('Mã giao dịch phải có ít nhất 5 ký tự');
      return;
    }
    
    setError('');
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

  const bankOptions = [
    { value: 'momo', label: 'MoMo' },
    { value: 'bidv', label: 'BIDV' },
    { value: 'techcombank', label: 'Techcombank' },
    { value: 'vietcombank', label: 'Vietcombank' },
    { value: 'agribank', label: 'Agribank' },
    { value: 'tpbank', label: 'TPBank' },
    { value: 'other', label: 'Ngân hàng khác' },
  ];
  
  return (
    <div className="w-full space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="bankType">Chọn ngân hàng</Label>
        <Select value={bankType} onValueChange={setBankType}>
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
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="transactionId">Mã giao dịch</Label>
        <Input 
          id="transactionId"
          value={transactionId}
          onChange={(e) => {
            setTransactionId(e.target.value);
            if (error) setError('');
          }}
          placeholder="Nhập mã giao dịch từ ngân hàng hoặc ví điện tử"
          className={`w-full ${error ? 'border-red-500' : ''}`}
        />
        {error && (
          <p className="text-xs text-red-500">
            {error}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Nhập mã giao dịch từ tin nhắn ngân hàng hoặc ví điện tử sau khi đã thanh toán
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
