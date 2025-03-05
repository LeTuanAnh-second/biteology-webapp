
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
}

export const PlansDisplay = ({
  isLoading,
  plans,
  selectedPlan,
  onSelectPlan,
  onPurchase,
  isProcessing
}: PlansDisplayProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

      <div className="flex flex-col items-center">
        <button
          type="button"
          className="primary-button flex items-center mb-2"
          disabled={!selectedPlan || isProcessing}
          onClick={onPurchase}
        >
          {isProcessing && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Tạo thông tin thanh toán
        </button>
      </div>
    </>
  );
};
