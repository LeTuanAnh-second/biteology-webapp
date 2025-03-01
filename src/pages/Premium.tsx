
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { PlansDisplay } from "@/components/premium/PlansDisplay";
import { SubscriptionInfo } from "@/components/premium/SubscriptionInfo";
import { QRPaymentDialog } from "@/components/premium/QRPaymentDialog";

interface PremiumPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: any;
}

interface Subscription {
  isPremium: boolean;
  subscription?: {
    planName: string;
    endDate: string;
    remainingDays: number;
  };
}

interface QRPaymentData {
  orderId: string;
  qrCodeUrl: string;
  amount: number;
  orderInfo: string;
  status: string;
}

const Premium = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [qrPaymentData, setQRPaymentData] = useState<QRPaymentData | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [checkingInterval, setCheckingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('premium_plans')
          .select('*')
          .order('price', { ascending: true });

        if (error) throw error;
        setPlans(data || []);
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
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/momo-check-subscription?userId=${user.id}`
        );
        const data = await response.json();
        setSubscription(data);
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    }

    fetchPlans();
    checkSubscription();
  }, [user, toast]);

  useEffect(() => {
    return () => {
      if (checkingInterval) {
        clearInterval(checkingInterval);
      }
    };
  }, [checkingInterval]);

  const checkPaymentStatus = async (orderId: string) => {
    if (!user) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/momo-verify-payment?orderId=${orderId}&resultCode=0&check=true`
      );
      
      const data = await response.json();
      
      if (data.success) {
        setPaymentStatus('success');
        if (checkingInterval) {
          clearInterval(checkingInterval);
          setCheckingInterval(null);
        }
        
        toast({
          title: "Thanh toán thành công",
          description: "Bạn đã nâng cấp tài khoản lên Premium thành công."
        });
        
        setTimeout(() => {
          setShowQRDialog(false);
          navigate('/');
        }, 3000);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handlePurchase = async () => {
    if (!selectedPlan || !user) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng chọn gói premium trước khi thanh toán."
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/momo-create-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId: selectedPlan,
            userId: user.id
          })
        }
      );

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Không thể tạo đơn hàng');
      }

      setQRPaymentData(result.data);
      setShowQRDialog(true);
      setPaymentStatus('pending');
      
      const intervalId = setInterval(() => {
        checkPaymentStatus(result.data.orderId);
      }, 5000);
      
      setCheckingInterval(intervalId);
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        variant: "destructive",
        title: "Lỗi thanh toán",
        description: "Không thể tạo đơn hàng. Vui lòng thử lại sau."
      });
    } finally {
      setIsProcessing(false);
    }
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
