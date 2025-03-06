
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import PlansDisplay from "@/components/subscription/PlansDisplay";
import SubscriptionInfo from "@/components/subscription/SubscriptionInfo";

interface Subscription {
  plan_name: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface PremiumPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  duration_days: number;
  features: any;
}

const Premium = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [plans, setPlans] = useState<PremiumPlan[]>([]);

  useEffect(() => {
    fetchSubscriptionData();
    fetchPremiumPlans();
  }, [user]);

  const fetchPremiumPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("premium_plans")
        .select("*")
        .order("price", { ascending: true });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setPlans(data);
      }
    } catch (error) {
      console.error("Error fetching premium plans:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải thông tin các gói dịch vụ",
      });
    }
  };

  const fetchSubscriptionData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // First try to get subscription data using UUID
      let { data, error } = await supabase
        .from("subscription_detail")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // If no data found, use maybeSingle to avoid errors
      if (error) {
        console.log("Error or no data found with UUID, trying with string user ID");
        
        const { data: stringData, error: stringError } = await supabase
          .from("subscription_detail")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
          
        if (!stringError && stringData) {
          data = stringData;
          error = null;
        }
      }

      // Set subscription data if we found any
      if (!error && data) {
        setSubscription(data);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải thông tin gói dịch vụ",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng đăng nhập để tiếp tục",
      });
      return;
    }

    setIsProcessingPayment(true);
    try {
      const response = await supabase.functions.invoke("create-payment", {
        body: {
          planId,
          userId: user.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { checkoutUrl, orderCode } = response.data;
      setCheckoutUrl(checkoutUrl);
      setOrderCode(orderCode);
    } catch (error) {
      console.error("Error creating payment:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tạo giao dịch thanh toán",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!orderCode) return;

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke("verify-payment", {
        body: { orderCode },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.isPaid) {
        toast({
          title: "Thanh toán thành công",
          description: "Gói dịch vụ của bạn đã được kích hoạt",
        });
        fetchSubscriptionData();
        setOrderCode("");
        setCheckoutUrl("");
      } else {
        toast({
          variant: "destructive",
          title: "Chưa thanh toán",
          description: "Vui lòng hoàn tất thanh toán để kích hoạt gói dịch vụ",
        });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xác minh trạng thái thanh toán",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link
            to="/"
            className="flex items-center space-x-2 text-primary hover:text-primary/80"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Quay lại</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Nâng cấp tài khoản</h1>

          {isLoading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : subscription && subscription.status === "ACTIVE" ? (
            <SubscriptionInfo subscription={subscription} />
          ) : checkoutUrl ? (
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Thanh toán</h2>
              <div className="mb-4">
                <iframe
                  src={checkoutUrl}
                  width="100%"
                  height="600"
                  style={{ border: "none" }}
                  title="PayOS Payment"
                />
              </div>
              <div className="flex flex-col space-y-4">
                <Button
                  onClick={() => {
                    setCheckoutUrl("");
                    setOrderCode("");
                  }}
                  variant="outline"
                >
                  Hủy thanh toán
                </Button>
                <Button onClick={handleVerifyPayment} disabled={isLoading}>
                  Tôi đã thanh toán
                </Button>
              </div>
            </div>
          ) : (
            <PlansDisplay 
              plans={plans}
              onSelectPlan={handleSelectPlan} 
              isLoading={isProcessingPayment} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Premium;
