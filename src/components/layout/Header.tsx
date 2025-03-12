
import { Activity, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ProfileMenu from "@/components/profile/ProfileMenu";

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="border-b">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold">B!teology</span>
        </div>
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
