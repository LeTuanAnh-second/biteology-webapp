
import { Calendar, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ProfileMenu from "@/components/profile/ProfileMenu";

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="border-b">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src="/lovable-uploads/30afc11d-2515-46e5-ae20-770260d269fe.png" 
            alt="Biteology Logo" 
            className="h-8 w-auto"
          />
          <div className="flex flex-col">
            <span className="text-xl font-semibold text-slate-700">B!teology</span>
            <span className="text-xs text-slate-500 italic">Healthy Bites - Healthy Life</span>
          </div>
        </Link>
        
        {user && (
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/health-tracking" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600">
              Theo dõi chỉ số
            </Link>
            <Link to="/nutrition-advice" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600">
              Tư vấn dinh dưỡng
            </Link>
            <Link to="/knowledge-base" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600">
              Thư viện kiến thức
            </Link>
            <Link to="/expert-consultation" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Tư vấn chuyên gia
            </Link>
          </div>
        )}
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link 
                to="/premium" 
                className="flex items-center text-amber-500 hover:text-amber-600 font-medium bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full transition-colors"
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                Nâng cấp Premium
              </Link>
              <ProfileMenu />
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
  );
};

export default Header;
