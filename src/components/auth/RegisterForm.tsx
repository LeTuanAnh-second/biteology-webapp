
import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface RegisterFormProps {
  onSuccess: () => void;
}

const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth();
  const { toast } = useToast();

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
      onSuccess();
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

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && <ErrorAlert message={error} />}
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
    </form>
  );
};

const ErrorAlert = ({ message }: { message: string }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative flex items-center" role="alert">
    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
    <span className="block">{message}</span>
  </div>
);

export default RegisterForm;
