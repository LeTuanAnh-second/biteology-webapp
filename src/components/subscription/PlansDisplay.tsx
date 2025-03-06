
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string[];
  popular?: boolean;
}

interface PlansDisplayProps {
  onSelectPlan: (planName: string, amount: number) => void;
  isLoading: boolean;
}

const plans: Plan[] = [
  {
    id: "basic-monthly",
    name: "Basic Monthly",
    price: 49000,
    description: [
      "Truy cập các bài viết chuyên sâu",
      "Công cụ theo dõi chỉ số cơ bản",
      "Hỗ trợ qua email",
    ],
  },
  {
    id: "premium-monthly",
    name: "Premium Monthly",
    price: 99000,
    description: [
      "Tất cả tính năng Basic",
      "Tư vấn dinh dưỡng cá nhân hóa",
      "Công cụ theo dõi chỉ số nâng cao",
      "Hỗ trợ ưu tiên",
    ],
    popular: true,
  },
  {
    id: "premium-yearly",
    name: "Premium Yearly",
    price: 990000,
    description: [
      "Tất cả tính năng Premium Monthly",
      "Tiết kiệm 20% so với thanh toán hàng tháng",
      "Tư vấn chuyên gia 1:1",
      "Công cụ phân tích xu hướng nâng cao",
    ],
  },
];

const PlansDisplay = ({ onSelectPlan, isLoading }: PlansDisplayProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan.id);
    onSelectPlan(plan.name, plan.price);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-lg border ${
              plan.popular
                ? "border-primary bg-primary/5"
                : "border-border bg-card"
            } p-6 shadow-sm transition-all`}
          >
            {plan.popular && (
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
                  {plan.id.includes("monthly") ? "/tháng" : "/năm"}
                </span>
              </div>
            </div>
            <ul className="mb-6 space-y-2">
              {plan.description.map((feature, index) => (
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
              variant={plan.popular ? "default" : "outline"}
              onClick={() => handleSelectPlan(plan)}
              disabled={isLoading || selectedPlan === plan.id}
            >
              {isLoading && selectedPlan === plan.id
                ? "Đang xử lý..."
                : "Chọn gói này"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlansDisplay;
