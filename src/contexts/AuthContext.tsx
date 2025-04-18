
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
  signInWithGoogle: () => Promise<{ error?: Error }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const checkUserProfile = async () => {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('full_name, phone_number')
            .eq('id', session.user.id)
            .single();
            
          if (error || !profile || !profile.full_name || !profile.phone_number) {
            navigate('/profile');
          }
        };
        
        checkUserProfile();
        
        const expiryTime = new Date();
        expiryTime.setDate(expiryTime.getDate() + 1);
        localStorage.setItem('session_expiry', expiryTime.toISOString());
      }
    });

    const checkSessionExpiry = () => {
      const expiryTimeStr = localStorage.getItem('session_expiry');
      if (expiryTimeStr) {
        const expiryTime = new Date(expiryTimeStr);
        if (new Date() > expiryTime) {
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

    const intervalId = setInterval(checkSessionExpiry, 60000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);

      if (session && !localStorage.getItem('session_expiry')) {
        const expiryTime = new Date();
        expiryTime.setDate(expiryTime.getDate() + 1);
        localStorage.setItem('session_expiry', expiryTime.toISOString());
      }

      checkSessionExpiry();
    });

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

      const expiryTime = new Date();
      expiryTime.setDate(expiryTime.getDate() + 1);
      localStorage.setItem('session_expiry', expiryTime.toISOString());

      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn đã quay trở lại!"
      });
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, phone_number')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();
        
      if (profileError || !profile || !profile.full_name || !profile.phone_number) {
        navigate('/profile');
      } else {
        navigate('/');
      }
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
        options: {
          emailRedirectTo: 'https://biteology.netlify.app'
        }
      });

      if (error) throw error;

      const expiryTime = new Date();
      expiryTime.setDate(expiryTime.getDate() + 1);
      localStorage.setItem('session_expiry', expiryTime.toISOString());

      toast({
        title: "Đăng ký thành công",
        description: "Vui lòng cập nhật thông tin cá nhân của bạn"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Đăng ký thất bại",
        description: error.message
      });
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Thêm tên ứng dụng vào các thông số Google
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: "https://biteology.netlify.app",
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            // Thêm tên hiển thị cho trang đăng nhập Google
            hd: 'B!teology - Healthy Bites, Healthy Life',
          }
        }
      });
      
      if (error) throw error;
      
      return { error: undefined };
    } catch (error: any) {
      console.error("Google sign in error:", error);
      return { error };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

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
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
