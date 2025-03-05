
import { Loader2 } from "lucide-react";
import { PlanCard } from "./PlanCard";
import { Json } from "@/integrations/supabase/types";

interface PremiumPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: Json;
}

interface PlansDisplayProps {
  isLoading: boolean;
  plans: PremiumPlan[];
  selectedPlan: string | null;
  onSelectPlan: (planId: string) => void;
  onPurchase: () => void;
  isProcessing: boolean;
  isRetrying?: boolean;
  retryCount?: number;
}

export const PlansDisplay = ({
  isLoading,
  plans,
  selectedPlan,
  onSelectPlan,
  onPurchase,
  isProcessing,
  isRetrying = false,
  retryCount = 0
}: PlansDisplayProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getButtonText = () => {
    if (isProcessing) {
      if (isRetrying) {
        return `Đang thử lại (${retryCount}/3)...`;
      }
      return 'Đang xử lý...';
    }
    return 'Thanh toán với PayOS';
  };

  return (
    <>
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isSelected={selectedPlan === plan.id}
            onSelect={onSelectPlan}
          />
        ))}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          className="primary-button flex items-center"
          disabled={!selectedPlan || isProcessing}
          onClick={onPurchase}
        >
          {isProcessing && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {getButtonText()}
        </button>
      </div>
    </>
  );
};
