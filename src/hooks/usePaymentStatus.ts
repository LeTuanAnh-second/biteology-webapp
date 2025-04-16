
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
      
      const response = await supabase.functions.invoke('payos-verify-payment', {
        body: { orderId }
      });
      
      if (!response.data) {
        console.error('API response error:', response.error);
        return;
      }
      
      const data = response.data;
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
