import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUp, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await signUp(email, password);
      toast({
        title: "Đăng ký thành công",
        description: "Tài khoản của bạn đã được tạo thành công."
      });
    } catch (error: any) {
      console.error("Đăng ký thất bại:", error);
      let errorMessage = "Đăng ký thất bại. Vui lòng thử lại.";
      
      if (error.message) {
        if (error.message.includes("User already registered")) {
          errorMessage = "Email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.";
        } else if (error.message.includes("Invalid email")) {
          errorMessage = "Email không hợp lệ. Vui lòng kiểm tra lại.";
        } else if (error.message.includes("Password")) {
          errorMessage = "Mật khẩu phải có ít nhất 6 ký tự.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Đăng ký thất bại",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
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
        
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Đăng nhập với Google thất bại",
          description: errorMessage,
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="max-w-lg">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Chào mừng đến với B!teology
          </h1>
          <p className="text-white/90 text-lg">
            Nền tảng theo dõi sức khỏe thông minh, giúp bạn có một cuộc sống khỏe mạnh hơn mỗi ngày.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Đăng ký tài khoản mới
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Nhập email và mật khẩu để tạo tài khoản
            </p>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative flex items-center" role="alert">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="block">{error}</span>
            </div>
          )}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="relative">
                <label htmlFor="email-address" className="sr-only">
                  Email
                </label>
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Mật khẩu
                </label>
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
              </button>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-full border-t border-gray-300"></div>
              <div className="px-3 text-sm text-gray-500">hoặc</div>
              <div className="w-full border-t border-gray-300"></div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-2" />
                {isGoogleLoading ? 'Đang đăng nhập...' : 'Đăng ký với tài khoản Google cá nhân'}
              </button>
            </div>

            <div className="text-sm text-center">
              <p className="text-gray-600">
                Đã có tài khoản?{' '}
                <Link to="/login" className="font-medium text-primary hover:text-primary/90">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
