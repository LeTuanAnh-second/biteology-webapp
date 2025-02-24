
import { BookOpen, Activity, Library } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">B!teology</span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard" className="secondary-button">
                  Dashboard
                </Link>
                <button onClick={logout} className="secondary-button">
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="secondary-button">
                  Đăng nhập
                </Link>
                <Link to="/register" className="primary-button">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 text-center px-4">
          <div className="space-y-8">
            <div className="hero-badge">
              Chào mừng đến với B!teology
            </div>
            
            <h1 className="hero-title">
              Quản lý sức khỏe của bạn<br />
              một cách thông minh
            </h1>
            
            <p className="hero-subtitle">
              Theo dõi sức khỏe, nhận lời khuyến dịnh dưỡng và chia sẻ kinh nghiệm với cộng đồng.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button className="primary-button">
                Bắt đầu miễn phí
              </button>
              <button className="secondary-button">
                Tìm hiểu thêm
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold">Tính năng nổi bật</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Chúng tôi cung cấp các công cụ cần thiết để bạn có thể theo dõi và cải thiện sức khỏe của mình.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Link to="/health-tracking" className="feature-card">
                <Activity className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Theo dõi chỉ số</h3>
                <p className="text-muted-foreground">
                  Ghi lại và theo dõi các chỉ số sức khỏe quan trọng như cân nặng và đường huyết.
                </p>
              </Link>

              <Link to="/nutrition-advice" className="feature-card">
                <BookOpen className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Tư vấn dinh dưỡng</h3>
                <p className="text-muted-foreground">
                  Nhận lời khuyên về chế độ ăn uống phù hợp với tình trạng sức khỏe của bạn.
                </p>
              </Link>

              <Link to="/knowledge-base" className="feature-card">
                <Library className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Thư viện kiến thức</h3>
                <p className="text-muted-foreground">
                  Truy cập kho tàng kiến thức về sức khỏe và các thức nấu ăn lành mạnh.
                </p>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-semibold">B!teology</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 B!teology. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

