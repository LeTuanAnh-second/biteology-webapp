
interface SubscriptionInfoProps {
  subscription: {
    isPremium: boolean;
    subscription?: {
      planName: string;
      endDate: string;
      remainingDays: number;
    };
  } | null;
}

export const SubscriptionInfo = ({ subscription }: SubscriptionInfoProps) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString; // Return original string if formatting fails
    }
  };

  if (!subscription) {
    return (
      <div className="mb-12 p-6 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
        <p className="text-center text-yellow-700">
          Đang kiểm tra thông tin đăng ký...
        </p>
      </div>
    );
  }

  if (!subscription.isPremium || !subscription.subscription) {
    return null;
  }

  return (
    <div className="mb-12 p-6 bg-primary/10 rounded-lg max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">
        Bạn đang sử dụng gói {subscription.subscription.planName}
      </h2>
      <p className="text-center mb-2">
        Thời hạn sử dụng còn: <span className="font-medium">{subscription.subscription.remainingDays} ngày</span>
      </p>
      <p className="text-center text-muted-foreground">
        Hết hạn vào ngày: {formatDate(subscription.subscription.endDate)}
      </p>
    </div>
  );
};
