
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface SubscriptionProps {
  subscription: {
    plan_name: string;
    start_date: string;
    end_date: string;
    status: string;
  };
}

const SubscriptionInfo = ({ subscription }: SubscriptionProps) => {
  const startDate = new Date(subscription.start_date);
  const endDate = new Date(subscription.end_date);
  
  const isActive = subscription.status === "ACTIVE";
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

  const formatDate = (date: Date) => {
    return format(date, "dd MMMM yyyy", { locale: vi });
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-xl font-bold">Thông tin gói dịch vụ</h3>
          <p className="text-muted-foreground">
            Thông tin chi tiết về gói dịch vụ hiện tại của bạn
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="font-medium">Gói dịch vụ:</span>
            <span>{subscription.plan_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Trạng thái:</span>
            <span className={isActive ? "text-green-500" : "text-red-500"}>
              {isActive ? "Đang hoạt động" : "Hết hạn"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Ngày bắt đầu:</span>
            <span>{formatDate(startDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Ngày kết thúc:</span>
            <span>{formatDate(endDate)}</span>
          </div>
          {isActive && (
            <div className="flex justify-between">
              <span className="font-medium">Thời gian còn lại:</span>
              <span>{daysLeft} ngày</span>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-primary/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {isActive 
                  ? `Gói dịch vụ của bạn sẽ hết hạn sau ${daysLeft} ngày` 
                  : "Gói dịch vụ của bạn đã hết hạn"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isActive 
                  ? "Gia hạn gói dịch vụ để tiếp tục sử dụng các tính năng cao cấp" 
                  : "Đăng ký gói dịch vụ mới để tiếp tục sử dụng các tính năng cao cấp"}
              </p>
            </div>
            <Button>Gia hạn</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionInfo;
