
import { Check } from "lucide-react";
import { Json } from "@/integrations/supabase/types";

interface PlanCardProps {
  plan: {
    id: string;
    name: string;
    description: string;
    price: number;
    duration_days: number;
    features: Json;
  };
  isSelected: boolean;
  onSelect: (planId: string) => void;
}

export const PlanCard = ({ plan, isSelected, onSelect }: PlanCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getFeatureValue = (features: Json, key: string): string => {
    if (typeof features === 'object' && features !== null && key in features) {
      return String(features[key]);
    }
    return '';
  };

  return (
    <div 
      className={`border rounded-lg p-6 flex flex-col ${
        isSelected 
          ? 'border-primary ring-2 ring-primary/20' 
          : 'hover:border-primary/50'
      } transition-all cursor-pointer`}
      onClick={() => onSelect(plan.id)}
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
          isSelected
            ? 'bg-primary text-primary-foreground'
            : 'bg-primary/10 text-primary hover:bg-primary/20'
        } transition-colors`}
        onClick={() => onSelect(plan.id)}
      >
        {isSelected ? 'Đã chọn' : 'Chọn gói này'}
      </button>
    </div>
  );
};
