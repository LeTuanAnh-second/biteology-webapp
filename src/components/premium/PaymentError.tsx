
import { FC } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentErrorProps {
  errorMessage: string;
  onRetry: () => void;
}

export const PaymentError: FC<PaymentErrorProps> = ({ 
  errorMessage, 
  onRetry 
}) => {
  return (
    <div className="w-full max-w-md space-y-4">
      <Alert variant="destructive" className="border-destructive/50 text-destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="mt-1">{errorMessage}</AlertDescription>
      </Alert>
      
      <div className="flex flex-col gap-2">
        <Button 
          variant="outline" 
          size="sm"
          className="w-full flex items-center justify-center gap-2"
          onClick={onRetry}
        >
          Thử lại
        </Button>
      </div>
    </div>
  );
};
