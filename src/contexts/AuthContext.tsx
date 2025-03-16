
import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Đặt thời gian cho phiên đăng nhập là 1 ngày (86400 giây)
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Khi đăng nhập thành công, thiết lập thời gian hết hạn
        const expiryTime = new Date();
        expiryTime.setDate(expiryTime.getDate() + 1); // Thêm 1 ngày
        localStorage.setItem('session_expiry', expiryTime.toISOString());
      }
    });

    // Kiểm tra phiên đăng nhập đã hết hạn chưa
    const checkSessionExpiry = () => {
      const expiryTimeStr = localStorage.getItem('session_expiry');
      if (expiryTimeStr) {
        const expiryTime = new Date(expiryTimeStr);
        if (new Date() > expiryTime) {
          // Phiên đăng nhập đã hết hạn, đăng xuất người dùng
          supabase.auth.signOut().then(() => {
            localStorage.removeItem('session_expiry');
            setUser(null);
            navigate('/login');
            toast({
              title: "Phiên đăng nhập đã hết hạn",
              description: "Vui lòng đăng nhập lại để tiếp tục.",
              variant: "destructive"
            });
          });
        }
      }
    };

    // Kiểm tra định kỳ mỗi phút để xem phiên đăng nhập đã hết hạn chưa
    const intervalId = setInterval(checkSessionExpiry, 60000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Nếu có session nhưng không có thời gian hết hạn, đặt thời gian hết hạn
      if (session && !localStorage.getItem('session_expiry')) {
        const expiryTime = new Date();
        expiryTime.setDate(expiryTime.getDate() + 1); // Thêm 1 ngày
        localStorage.setItem('session_expiry', expiryTime.toISOString());
      }
      
      // Kiểm tra ngay khi khởi động
      checkSessionExpiry();
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, [navigate, toast]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;

      // Thiết lập thời gian hết hạn khi đăng nhập thành công
      const expiryTime = new Date();
      expiryTime.setDate(expiryTime.getDate() + 1); // Thêm 1 ngày
      localStorage.setItem('session_expiry', expiryTime.toISOString());

      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn đã quay trở lại!"
      });
      navigate('/'); // Changed from '/dashboard' to '/'
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Đăng nhập thất bại",
        description: error.message
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Thiết lập thời gian hết hạn khi đăng ký thành công
      const expiryTime = new Date();
      expiryTime.setDate(expiryTime.getDate() + 1); // Thêm 1 ngày
      localStorage.setItem('session_expiry', expiryTime.toISOString());

      toast({
        title: "Đăng ký thành công",
        description: "Tài khoản của bạn đã được tạo"
      });
      navigate('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Đăng ký thất bại",
        description: error.message
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Xóa thời gian hết hạn khi đăng xuất
      localStorage.removeItem('session_expiry');

      toast({
        title: "Đăng xuất thành công"
      });
      navigate('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Đăng xuất thất bại",
        description: error.message
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
