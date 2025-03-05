
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { PlansDisplay } from "@/components/premium/PlansDisplay";
import { SubscriptionInfo } from "@/components/premium/SubscriptionInfo";
import { DirectPaymentLink } from "@/components/premium/DirectPaymentLink";

interface PremiumPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: any;
}

const Premium = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [subscription, setSubscription] = useState<{
    isPremium: boolean;
    subscription?: {
      planName: string;
      endDate: string;
      remainingDays: number;
    };
  } | null>(null);

  const fetchSubscriptionData = async () => {
    if (!user) return;
    
    try {
      setIsRefreshing(true);
      
      // Get user subscription data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single();
      
      if (profileData?.is_premium) {
        // Fetch active subscription details
        const { data: subscriptionData } = await supabase
          .from('user_subscriptions')
          .select(`
            id, 
            start_date,
            end_date,
            premium_plans (name)
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('end_date', { ascending: false })
          .limit(1)
          .single();
        
        if (subscriptionData) {
          const endDate = new Date(subscriptionData.end_date);
          const now = new Date();
          const diffTime = endDate.getTime() - now.getTime();
          const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          setSubscription({
            isPremium: true,
            subscription: {
              planName: subscriptionData.premium_plans.name,
              endDate: subscriptionData.end_date,
              remainingDays: remainingDays > 0 ? remainingDays : 0
            }
          });
        } else {
          setSubscription({ isPremium: true });
        }
      } else {
        setSubscription({ isPremium: false });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    async function fetchPlans() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('premium_plans')
          .select('*')
          .order('price', { ascending: true });

        if (error) throw error;
        console.log("Fetched plans:", data);
        
        if (data && data.length > 0) {
          setPlans(data);
          
          // Tự động chọn gói cơ bản (giá thấp nhất) nếu chưa có gói nào được chọn
          if (!selectedPlan) {
            const basicPlan = data.find(plan => plan.name === "Cơ bản") || data[0];
            console.log("Auto-selecting plan:", basicPlan.id);
            setSelectedPlan(basicPlan.id);
          }
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tải danh sách gói premium."
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlans();
    fetchSubscriptionData();
  }, [user, toast]);

  const handleSelectPlan = (planId: string) => {
    console.log("Selected plan ID:", planId);
    setSelectedPlan(planId);
  };

  const handlePurchase = () => {
    if (!selectedPlan) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng chọn gói premium trước khi thanh toán."
      });
      return;
    }
    
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = () => {
    // Refresh subscription data
    fetchSubscriptionData();
    
    toast({
      title: "Thanh toán đã được xác nhận!",
      description: "Tài khoản của bạn đã được nâng cấp lên Premium."
    });
  };

  // Get the selected plan details
  const selectedPlanDetails = selectedPlan ? plans.find(plan => plan.id === selectedPlan) || null : null;

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link to="/" className="flex items-center space-x-2 text-primary hover:text-primary/80">
            <ArrowLeft className="h-5 w-5" />
            <span>Quay lại</span>
          </Link>
          
          {isRefreshing && (
            <div className="ml-auto flex items-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Đang cập nhật...
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Nâng cấp tài khoản Premium</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Trải nghiệm đầy đủ các tính năng cao cấp của B!teology với tài khoản Premium. 
            Nhận tư vấn dinh dưỡng cá nhân hóa và theo dõi sức khỏe chuyên sâu.
          </p>
        </div>

        <SubscriptionInfo subscription={subscription} />

        <PlansDisplay 
          isLoading={isLoading}
          plans={plans}
          selectedPlan={selectedPlan}
          onSelectPlan={handleSelectPlan}
          onPurchase={handlePurchase}
          isProcessing={false}
        />
      </main>

      <DirectPaymentLink
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        selectedPlan={selectedPlanDetails}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default Premium;
