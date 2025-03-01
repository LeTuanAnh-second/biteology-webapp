import { useState, useEffect } from "react";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Json } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface PremiumPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: Json;
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
        clearInterval(checkingInterval as number);
        setCheckingInterval(null);
        
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const getFeatureValue = (features: Json, key: string): string => {
    if (typeof features === 'object' && features !== null && key in features) {
      return String(features[key]);
    }
    return '';
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

        {subscription?.isPremium && subscription.subscription && (
          <div className="mb-12 p-6 bg-primary/10 rounded-lg max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-4 text-center">Bạn đang sử dụng gói {subscription.subscription.planName}</h2>
            <p className="text-center mb-2">
              Thời hạn sử dụng còn: <span className="font-medium">{subscription.subscription.remainingDays} ngày</span>
            </p>
            <p className="text-center text-muted-foreground">
              Hết hạn vào ngày: {formatDate(subscription.subscription.endDate)}
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`border rounded-lg p-6 flex flex-col ${
                    selectedPlan === plan.id 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'hover:border-primary/50'
                  } transition-all cursor-pointer`}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <p className="text-muted-foreground">{plan.description}</p>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-3xl font-bold">{formatPrice(plan.price)}</p>
                    <p className="text-sm text-muted-foreground">{plan.duration_days} ngày</p>
                  </div>
                  
                  <ul className="space-y-2 mb-6 flex-grow">
                    {plan.features && typeof plan.features === 'object' && 
                      Object.keys(plan.features).map((key) => (
                        <li key={key} className="flex items-start">
                          <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
                          <span>{getFeatureValue(plan.features, key)}</span>
                        </li>
                      ))}
                  </ul>
                  
                  <button
                    type="button"
                    className={`w-full py-2 px-4 rounded-md ${
                      selectedPlan === plan.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                    } transition-colors`}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {selectedPlan === plan.id ? 'Đã chọn' : 'Chọn gói này'}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                className="primary-button flex items-center"
                disabled={!selectedPlan || isProcessing}
                onClick={handlePurchase}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Thanh toán qua MoMo'
                )}
              </button>
            </div>
          </>
        )}
      </main>

      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quét mã QR để thanh toán</DialogTitle>
            <DialogDescription>
              Sử dụng ứng dụng MoMo để quét mã QR bên dưới.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-4">
            {paymentStatus === 'pending' && (
              <>
                {qrPaymentData && (
                  <>
                    <div className="mb-4 text-center">
                      <p className="font-medium">{qrPaymentData.orderInfo}</p>
                      <p className="text-xl font-bold mt-1">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(qrPaymentData.amount)}
                      </p>
                    </div>
                    
                    <div className="border p-2 rounded-lg mb-4">
                      <img 
                        src={qrPaymentData.qrCodeUrl} 
                        alt="Mã QR thanh toán MoMo" 
                        className="w-64 h-64 object-contain"
                      />
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      Mã đơn hàng: {qrPaymentData.orderId}
                    </p>
                    
                    <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Đang chờ thanh toán...
                    </div>
                  </>
                )}
              </>
            )}
            
            {paymentStatus === 'success' && (
              <div className="text-center">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Thanh toán thành công!</h3>
                <p className="text-muted-foreground">
                  Tài khoản của bạn đã được nâng cấp lên Premium.
                </p>
              </div>
            )}
            
            {paymentStatus === 'failed' && (
              <div className="text-center">
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Thanh toán thất bại</h3>
                <p className="text-muted-foreground">
                  Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Premium;
