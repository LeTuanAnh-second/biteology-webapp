
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface PremiumPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: any;
}

interface SubscriptionInfo {
  isPremium: boolean;
  subscription?: {
    planName: string;
    endDate: string;
    remainingDays: number;
  };
}

export const usePremiumSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

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

  const fetchPlans = async () => {
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
  };

  useEffect(() => {
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
  const selectedPlanDetails = selectedPlan 
    ? plans.find(plan => plan.id === selectedPlan) || null 
    : null;

  return {
    plans,
    selectedPlan,
    isLoading,
    isRefreshing,
    showPaymentDialog,
    subscription,
    selectedPlanDetails,
    handleSelectPlan,
    handlePurchase,
    handlePaymentSuccess,
    setShowPaymentDialog
  };
};
