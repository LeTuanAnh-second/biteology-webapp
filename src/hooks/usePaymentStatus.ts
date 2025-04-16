
import { useState, useEffect } from "react";
import { SUPABASE_URL } from "@/lib/supabase";

export function usePaymentStatus(orderId: string | null, onSuccess?: () => void) {
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [checkingInterval, setCheckingInterval] = useState<NodeJS.Timeout | null>(null);

  const checkPaymentStatus = async (orderId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        console.error('No access token available');
        return;
      }
      
      const apiUrl = `${SUPABASE_URL}/functions/v1/payos-verify-payment`;
      console.log("Checking payment status at:", apiUrl);
      
      const response = await fetch(`${apiUrl}?orderId=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        return;
      }
      
      const data = await response.json();
      console.log("Payment status response:", data);
      
      if (data.success) {
        setPaymentStatus('success');
        if (checkingInterval) {
          clearInterval(checkingInterval);
          setCheckingInterval(null);
        }
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  useEffect(() => {
    if (orderId) {
      const intervalId = setInterval(() => {
        checkPaymentStatus(orderId);
      }, 5000);
      
      setCheckingInterval(intervalId);
      
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [orderId]);

  return { paymentStatus };
}
