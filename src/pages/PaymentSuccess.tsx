
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const orderCode = searchParams.get("orderCode");
    
    if (!orderCode) {
      navigate("/premium");
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await supabase.functions.invoke("verify-payment", {
          body: { orderCode },
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        if (response.data.isPaid) {
          setIsSuccess(true);
          toast({
            title: "Thanh toán thành công",
            description: "Gói dịch vụ của bạn đã được kích hoạt",
          });
        } else {
          setIsSuccess(false);
          toast({
            variant: "destructive",
            title: "Thanh toán thất bại",
            description: "Vui lòng thử lại hoặc liên hệ hỗ trợ",
          });
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        setIsSuccess(false);
        toast({
          variant: "destructive",
          title: "Lỗi xác thực",
          description: "Không thể xác minh trạng thái thanh toán",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    if (user) {
      verifyPayment();
    } else {
      navigate("/login");
    }
  }, [searchParams, navigate, toast, user]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link
            to="/"
            className="flex items-center space-x-2 text-primary hover:text-primary/80"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Trang chủ</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md mx-auto text-center">
          {isVerifying ? (
            <div className="py-12 space-y-4">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-lg">Đang xác thực thanh toán...</p>
            </div>
          ) : isSuccess ? (
            <div className="py-12 space-y-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h1 className="text-2xl font-bold">Thanh toán thành công!</h1>
              <p className="text-muted-foreground">
                Cảm ơn bạn đã đăng ký dịch vụ. Gói dịch vụ của bạn đã được kích hoạt.
              </p>
              <div className="flex flex-col gap-4 pt-4">
                <Button asChild>
                  <Link to="/premium">Xem thông tin gói dịch vụ</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/">Về trang chủ</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-12 space-y-6">
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <h1 className="text-2xl font-bold">Thanh toán thất bại</h1>
              <p className="text-muted-foreground">
                Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại hoặc liên hệ với chúng tôi để được hỗ trợ.
              </p>
              <div className="flex flex-col gap-4 pt-4">
                <Button asChild>
                  <Link to="/premium">Thử lại</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/">Về trang chủ</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccess;
