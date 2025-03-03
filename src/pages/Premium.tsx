
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { PlansDisplay } from "@/components/premium/PlansDisplay";
import { SubscriptionInfo } from "@/components/premium/SubscriptionInfo";
import { QRPaymentDialog } from "@/components/premium/QRPaymentDialog";
import { usePaymentProcess } from "@/hooks/usePaymentProcess";

interface PremiumPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: any;
}

// Default plans in case API fails
const DEFAULT_PLANS: PremiumPlan[] = [
  {
    id: "basic-plan",
    name: "Cơ bản",
    description: "Gói cơ bản dành cho người mới bắt đầu",
    price: 99000,
    duration_days: 30,
    features: ["Truy cập đầy đủ cơ sở dữ liệu thực phẩm", "Tính toán dinh dưỡng cơ bản", "Lưu trữ nhật ký ăn uống"]
  },
  {
    id: "pro-plan",
    name: "Chuyên nghiệp",
    description: "Dành cho người dùng cần tính năng nâng cao",
    price: 249000,
    duration_days: 90,
    features: ["Tất cả tính năng của gói Cơ bản", "Phân tích dinh dưỡng chuyên sâu", "Gợi ý thực đơn cá nhân hóa", "Hỗ trợ 24/7"]
  },
  {
    id: "premium-plan",
    name: "Premium",
    description: "Trải nghiệm toàn diện và đầy đủ nhất",
    price: 899000,
    duration_days: 365,
    features: ["Tất cả tính năng của gói Chuyên nghiệp", "Tư vấn dinh dưỡng cá nhân", "Phân tích DNA thực phẩm", "Ưu tiên tiếp cận tính năng mới"]
  }
];

const Premium = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<{
    isPremium: boolean;
    subscription?: {
      planName: string;
      endDate: string;
      remainingDays: number;
    };
  } | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const {
    isProcessing,
    qrPaymentData,
    showQRDialog,
    paymentStatus,
    handlePurchase,
    setShowQRDialog
  } = usePaymentProcess(user, selectedPlan, toast);

  useEffect(() => {
    async function fetchPlans() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('premium_plans')
          .select('*')
          .order('price', { ascending: true });

        if (error) {
          console.error('Error fetching plans from Supabase:', error);
          throw error;
        }
        
        console.log("Fetched plans:", data);
        
        if (data && data.length > 0) {
          setPlans(data);
          
          // Auto-select the basic plan if no plan is selected
          if (!selectedPlan) {
            const basicPlan = data.find(plan => plan.name === "Cơ bản") || data[0];
            console.log("Auto-selecting plan:", basicPlan.id);
            setSelectedPlan(basicPlan.id);
          }
        } else {
          // Use default plans if no data returned
          console.log("No plans returned from API, using defaults");
          setPlans(DEFAULT_PLANS);
          setIsOfflineMode(true);
          setSelectedPlan(DEFAULT_PLANS[0].id);
          
          toast({
            title: "Chế độ ngoại tuyến",
            description: "Đang sử dụng dữ liệu mặc định. Một số tính năng có thể bị hạn chế.",
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        
        // Fallback to default plans on error
        setPlans(DEFAULT_PLANS);
        setIsOfflineMode(true);
        setSelectedPlan(DEFAULT_PLANS[0].id);
        
        toast({
          variant: "destructive",
          title: "Không thể tải danh sách gói premium",
          description: "Đang sử dụng dữ liệu ngoại tuyến. Vui lòng thử lại sau.",
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    }

    async function checkSubscription() {
      if (!user) return;
      
      try {
        // Get current user's JWT token
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          console.error('No access token available for subscription check');
          return;
        }
        
        // Use fixed URL for API
        try {
          const response = await fetch(
            `https://ijvtkufzaweqzwczpvgr.supabase.co/functions/v1/payos-check-subscription?userId=${user.id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (!response.ok) {
            console.error('API response not OK:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Subscription check error:', errorText);
            
            // Fallback for demo purposes
            setSubscription({ isPremium: false });
            return;
          }
          
          const data = await response.json();
          setSubscription(data);
        } catch (error) {
          console.error('Network error checking subscription:', error);
          // Simulate data for network errors
          setSubscription({ isPremium: false });
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setSubscription({ isPremium: false });
      }
    }

    fetchPlans();
    checkSubscription();
  }, [user, toast]);

  const handleSelectPlan = (planId: string) => {
    console.log("Selected plan ID:", planId);
    setSelectedPlan(planId);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link to="/" className="flex items-center space-x-2 text-primary hover:text-primary/80">
            <ArrowLeft className="h-5 w-5" />
            <span>Quay lại</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Nâng cấp tài khoản Premium</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Trải nghiệm đầy đủ các tính năng cao cấp của B!teology với tài khoản Premium. 
            Nhận tư vấn dinh dưỡng cá nhân hóa và theo dõi sức khỏe chuyên sâu.
          </p>
          
          {isOfflineMode && (
            <div className="mt-4 p-2 bg-yellow-100 text-yellow-800 rounded-md max-w-md mx-auto text-sm">
              Chế độ demo đang được kích hoạt. Mọi thanh toán sẽ được mô phỏng.
            </div>
          )}
        </div>

        <SubscriptionInfo subscription={subscription} />

        <PlansDisplay 
          isLoading={isLoading}
          plans={plans}
          selectedPlan={selectedPlan}
          onSelectPlan={handleSelectPlan}
          onPurchase={handlePurchase}
          isProcessing={isProcessing}
        />
      </main>

      <QRPaymentDialog
        open={showQRDialog}
        onOpenChange={setShowQRDialog}
        paymentStatus={paymentStatus}
        qrPaymentData={qrPaymentData}
      />
    </div>
  );
};

export default Premium;
