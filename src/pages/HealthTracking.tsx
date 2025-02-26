
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

const HealthTracking = () => {
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
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <p className="text-yellow-600">Tính năng đang được phát triển</p>
        </div>

        <h1 className="text-3xl font-bold mb-6">Theo dõi chỉ số sức khỏe</h1>
        <div className="grid gap-6">
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-xl font-semibold mb-4">Cân nặng</h2>
            <p className="text-muted-foreground mb-4">
              Ghi lại và theo dõi cân nặng của bạn theo thời gian.
            </p>
            <button className="primary-button" disabled>Thêm chỉ số</button>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-xl font-semibold mb-4">Đường huyết</h2>
            <p className="text-muted-foreground mb-4">
              Ghi lại và theo dõi chỉ số đường huyết của bạn.
            </p>
            <button className="primary-button" disabled>Thêm chỉ số</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HealthTracking;
