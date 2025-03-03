
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

        if (error) throw error;
        console.log("Fetched plans:", data);
        setPlans(data || []);
        
        // Nếu chỉ có một plan, tự động chọn
        if (data && data.length === 1) {
          setSelectedPlan(data[0].id);
        }
        // Nếu có plan và chưa có plan nào được chọn, chọn plan đầu tiên
        else if (data && data.length > 0 && !selectedPlan) {
          setSelectedPlan(data[0].id);
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

    async function checkSubscription() {
      if (!user) return;
      
      try {
        // Lấy token JWT của người dùng hiện tại
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          console.error('No access token available for subscription check');
          return;
        }
        
        // Sử dụng URL cố định thay vì biến môi trường không xác định
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
          return;
        }
        
        const data = await response.json();
        setSubscription(data);
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    }

    fetchPlans();
    checkSubscription();
  }, [user, toast, selectedPlan]);

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
