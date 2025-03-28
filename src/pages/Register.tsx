
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import AuthSidePanel from '@/components/auth/AuthSidePanel';
import RegisterForm from '@/components/auth/RegisterForm';
import GoogleSignIn from '@/components/auth/GoogleSignIn';

const Register = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegisterSuccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex">
      <AuthSidePanel />

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
          
          <RegisterForm onSuccess={handleRegisterSuccess} />

          <div className="flex items-center justify-center">
            <div className="w-full border-t border-gray-300"></div>
            <div className="px-3 text-sm text-gray-500">hoặc</div>
            <div className="w-full border-t border-gray-300"></div>
          </div>

          <GoogleSignIn />

          <div className="text-sm text-center">
            <p className="text-gray-600">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-medium text-primary hover:text-primary/90">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
