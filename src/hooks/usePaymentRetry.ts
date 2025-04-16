
import { useState } from "react";

export function usePaymentRetry() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = async <T>(callback: () => Promise<T>, maxRetries = 3): Promise<T | null> => {
    setIsRetrying(true);
    let attempt = 1;
    
    while (attempt <= maxRetries) {
      try {
        setRetryCount(attempt);
        const result = await callback();
        setIsRetrying(false);
        setRetryCount(0);
        return result;
      } catch (error) {
        if (attempt === maxRetries) {
          setIsRetrying(false);
          setRetryCount(0);
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempt++;
      }
    }
    
    setIsRetrying(false);
    setRetryCount(0);
    return null;
  };

  return { isRetrying, retryCount, handleRetry };
}
