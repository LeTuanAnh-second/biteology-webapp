
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface PrivateRouteProps {
  children: React.ReactNode;
  requirePremium?: boolean;
}

const PrivateRoute = ({ children, requirePremium = false }: PrivateRouteProps) => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      if (requirePremium) {
        try {
          // First check local profile data
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('is_premium')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('Error fetching premium status:', profileError);
            setIsPremium(false);
          } else {
            setIsPremium(profileData?.is_premium || false);
          }

          // Then verify with server (handles edge cases like expired subscriptions)
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const response = await supabase.functions.invoke('payos-check-subscription', {
              body: { userId: user.id }
            });
            
            if (response.data?.isPremium) {
              setIsPremium(true);
            }
          }
        } catch (error) {
          console.error('Error checking premium status:', error);
        }
      }
      
      setIsLoading(false);
    };

    checkPremiumStatus();
  }, [user, requirePremium]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    toast.error("Vui lòng đăng nhập để tiếp tục");
    return <Navigate to="/login" replace />;
  }

  if (requirePremium && !isPremium) {
    toast.error("Tính năng này yêu cầu tài khoản Premium");
    return <Navigate to="/premium" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
