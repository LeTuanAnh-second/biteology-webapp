
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const HeroSection = () => {
  const { user } = useAuth();

  return (
    <section className="py-20 px-4 bg-gradient-to-r from-green-50 to-blue-50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 z-0">
        <img 
          src="https://images.unsplash.com/photo-1505576399279-565b52d4ac71" 
          alt="Healthy lifestyle background" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-8 text-left">
            <div className="hero-badge">
              Chào mừng đến với B!teology
            </div>
            
            <h1 className="hero-title text-left">
              Quản lý sức khỏe của bạn<br />
              một cách thông minh
            </h1>
            
            <p className="hero-subtitle text-left max-w-full mx-0">
              Theo dõi sức khỏe, nhận lời khuyên dinh dưỡng và chia sẻ kinh nghiệm với cộng đồng.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              {user ? (
                <>
                  <Link to="/health-tracking" className="primary-button">
                    Bắt đầu ngay
                  </Link>
                  <Link to="/premium" className="flex items-center secondary-button">
                    <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                    Nâng cấp Premium
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="primary-button">
                    Bắt đầu miễn phí
                  </Link>
                  <button className="secondary-button">
                    Tìm hiểu thêm
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="hidden md:block">
            <img 
              src="https://images.unsplash.com/photo-1505576399279-565b52d4ac71"
              alt="Healthy food and lifestyle" 
              className="w-full h-auto rounded-xl shadow-xl transform hover:-translate-y-2 transition-transform duration-300"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
