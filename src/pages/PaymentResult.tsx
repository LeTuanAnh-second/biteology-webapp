
import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Check, X, Loader2, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Validate the payment result
    const validatePayment = async () => {
      try {
        const orderCode = searchParams.get('orderCode') || '';
        
        if (!orderCode) {
          setStatus('error');
          setMessage("Không tìm thấy thông tin đơn hàng. Vui lòng liên hệ với chúng tôi để được hỗ trợ.");
          return;
        }
        
        // Lấy token JWT của người dùng hiện tại
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          console.error('No access token available for payment verification');
          setStatus('error');
          setMessage("Lỗi xác thực người dùng. Vui lòng đăng nhập lại.");
          return;
        }
        
        // Call the backend to verify the payment
        const response = await supabase.functions.invoke('payos-verify-payment', {
          body: { orderId: orderCode }
        });
        
        if (!response.data) {
          console.error('API response not OK:', response.error);
          setStatus('error');
          setMessage("Không thể xác minh trạng thái thanh toán. Vui lòng liên hệ với chúng tôi.");
          return;
        }
        
        const data = response.data;
        
        if (data.success) {
          setStatus('success');
          setMessage("Thanh toán thành công! Tài khoản của bạn đã được nâng cấp lên Premium.");
          toast({
            title: "Thanh toán thành công",
            description: "Bạn đã nâng cấp tài khoản lên Premium thành công."
          });
        } else {
          setStatus('error');
          setMessage(data.message || "Thanh toán thất bại. Vui lòng thử lại sau hoặc liên hệ với chúng tôi để được hỗ trợ.");
          toast({
            variant: "destructive",
            title: "Thanh toán thất bại",
            description: "Đã xảy ra lỗi trong quá trình thanh toán."
          });
        }
      } catch (error) {
        console.error('Error validating payment:', error);
        setStatus('error');
        setMessage("Đã xảy ra lỗi khi kiểm tra trạng thái thanh toán. Vui lòng liên hệ với chúng tôi.");
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể xác minh trạng thái thanh toán."
        });
      }
    };

    validatePayment();
  }, [searchParams, toast]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full p-8 bg-background rounded-lg shadow-lg text-center">
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-6">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Đang xử lý thanh toán</h1>
            <p className="text-muted-foreground mb-6">
              Vui lòng đợi trong khi chúng tôi xác nhận thanh toán của bạn...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-4">Thanh toán thành công!</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <div className="flex flex-col gap-4">
              <Link to="/" className="primary-button flex items-center justify-center">
                <Home className="mr-2 h-4 w-4" />
                Quay về trang chủ
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                <X className="h-10 w-10 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-4">Thanh toán thất bại</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <div className="flex flex-col gap-4">
              <Link to="/premium" className="primary-button">
                Thử lại
              </Link>
              <Link to="/" className="secondary-button">
                Quay về trang chủ
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentResult;
