
import { Link } from "react-router-dom";
import { ArrowLeft, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentCancel = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link
            to="/"
            className="flex items-center space-x-2 text-primary hover:text-primary/80"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Trang chủ</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md mx-auto text-center py-12 space-y-6">
          <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold">Thanh toán đã bị hủy</h1>
          <p className="text-muted-foreground">
            Bạn đã hủy quá trình thanh toán. Bạn có thể thử lại hoặc chọn một gói dịch vụ khác.
          </p>
          <div className="flex flex-col gap-4 pt-4">
            <Button asChild>
              <Link to="/premium">Quay lại chọn gói</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Về trang chủ</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentCancel;
