
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const GoogleSignIn = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        console.error("Google sign in error:", result.error);
        let errorMessage = "Đăng nhập với Google thất bại.";
        
        if (result.error.message) {
          if (result.error.message.includes("popup_closed_by_user")) {
            errorMessage = "Cửa sổ đăng nhập Google đã bị đóng. Vui lòng thử lại.";
          } else if (result.error.message.includes("redirect_uri_mismatch")) {
            errorMessage = "Lỗi cấu hình URI chuyển hướng. Vui lòng liên hệ quản trị viên.";
          } else if (result.error.message.includes("access_denied")) {
            errorMessage = "Bạn đã từ chối cấp quyền cho ứng dụng.";
          } else if (result.error.message.includes("popup_blocked")) {
            errorMessage = "Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cho phép cửa sổ bật lên và thử lại.";
          } else if (result.error.message.includes("org_internal")) {
            errorMessage = "Tài khoản Google của bạn bị hạn chế bởi tổ chức. Vui lòng sử dụng tài khoản Google cá nhân.";
          } else {
            errorMessage = result.error.message;
          }
        }
        
        toast({
          variant: "destructive",
          title: "Đăng nhập với Google thất bại",
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-2" />
      {isLoading ? 'Đang đăng nhập...' : 'Đăng ký với tài khoản Google cá nhân'}
    </button>
  );
};

export default GoogleSignIn;
