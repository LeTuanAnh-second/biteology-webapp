
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  duration_days: number;
  features?: any;
}

interface PlansDisplayProps {
  plans: Plan[];
  onSelectPlan: (planId: string) => void;
  isLoading: boolean;
}

const PlansDisplay = ({ plans, onSelectPlan, isLoading }: PlansDisplayProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan.id);
    onSelectPlan(plan.id);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getFeatureList = (plan: Plan) => {
    // Try to parse features if it's a string or use directly if it's an object
    let featuresObj = {};
    
    if (plan.features && typeof plan.features === 'string') {
      try {
        featuresObj = JSON.parse(plan.features);
      } catch (e) {
        console.error('Error parsing features JSON:', e);
      }
    } else if (plan.features && typeof plan.features === 'object') {
      featuresObj = plan.features;
    }
    
    // Extract feature values from the object
    const featureItems = [];
    
    // If features contains 'feature' property, use it
    if (featuresObj['feature']) {
      featureItems.push(featuresObj['feature']);
    }
    
    // Add description as a feature
    if (plan.description) {
      featureItems.push(plan.description);
    }
    
    // If no features found, add some default features based on plan
    if (featureItems.length === 0) {
      if (plan.name.includes('Cơ bản')) {
        featureItems.push('Truy cập các bài viết chuyên sâu');
        featureItems.push('Công cụ theo dõi chỉ số cơ bản');
        featureItems.push('Hỗ trợ qua email');
      } else if (plan.name.includes('Tiêu chuẩn')) {
        featureItems.push('Tất cả tính năng Cơ bản');
        featureItems.push('Tư vấn dinh dưỡng cá nhân hóa');
        featureItems.push('Công cụ theo dõi chỉ số nâng cao');
      } else if (plan.name.includes('Cao cấp')) {
        featureItems.push('Tất cả tính năng Tiêu chuẩn');
        featureItems.push('Tiết kiệm 20% so với thanh toán hàng tháng');
        featureItems.push('Tư vấn chuyên gia 1:1');
      }
    }
    
    return featureItems;
  };

  // Find the "popular" plan - typically the middle one
  const getPopularPlan = (plans: Plan[]) => {
    if (plans.length === 0) return null;
    if (plans.length === 1) return plans[0].id;
    
    // If we have exactly 3 plans, the middle one is typically the popular one
    if (plans.length === 3) return plans[1].id;
    
    // For more than 3 plans, find one with "standard" or "tiêu chuẩn" in the name
    const standardPlan = plans.find(p => 
      p.name.toLowerCase().includes('standard') || 
      p.name.toLowerCase().includes('tiêu chuẩn')
    );
    
    return standardPlan ? standardPlan.id : null;
  };

  const popularPlanId = getPopularPlan(plans);

  return (
    <div className="space-y-8">
      {plans.length === 0 ? (
        <div className="text-center py-8">Không có gói dịch vụ nào</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isPopular = plan.id === popularPlanId;
            const features = getFeatureList(plan);
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-lg border ${
                  isPopular
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                } p-6 shadow-sm transition-all`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Phổ biến
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-3xl font-bold">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="ml-1 text-sm text-muted-foreground">
                      {plan.duration_days <= 31 ? "/tháng" : "/năm"}
                    </span>
                  </div>
                </div>
                <ul className="mb-6 space-y-2">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="mr-2 h-5 w-5 flex-shrink-0 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={isPopular ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isLoading || selectedPlan === plan.id}
                >
                  {isLoading && selectedPlan === plan.id
                    ? "Đang xử lý..."
                    : "Chọn gói này"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlansDisplay;
