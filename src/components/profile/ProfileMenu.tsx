
import { LogOut, User, ChevronDown, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const ProfileMenu = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<{ 
    full_name: string | null; 
    is_premium?: boolean;
    plan_name?: string | null; 
  } | null>(null);

  const fetchProfile = async () => {
    if (!user?.id) return;
    
    // Fetch basic profile info
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, is_premium')
      .eq('id', user.id)
      .single();
    
    if (error || !data) {
      console.error('Error fetching profile:', error);
      return;
    }
    
    // If user is premium, fetch active subscription details
    if (data.is_premium) {
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          premium_plans (name)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('end_date', { ascending: false })
        .limit(1)
        .single();
      
      if (!subscriptionError && subscriptionData) {
        // Extract plan name from premium_plans, handling different possible structures
        let planName = null;
        
        if (subscriptionData.premium_plans) {
          // Check if premium_plans is an object with a name property directly
          if (typeof subscriptionData.premium_plans === 'object' && 'name' in subscriptionData.premium_plans) {
            planName = subscriptionData.premium_plans.name;
          }
        }
          
        setProfile({
          ...data,
          plan_name: planName
        });
        return;
      }
    }
    
    setProfile(data);
  };

  // Listen for realtime changes on the profiles table
  useEffect(() => {
    if (!user?.id) return;

    // Initial fetch
    fetchProfile();

    // Subscribe to changes
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        () => {
          fetchProfile();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  const displayName = profile?.full_name || user?.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent">
        <span className="max-w-[200px] truncate">{displayName}</span>
        {profile?.is_premium && (
          <div className="flex items-center gap-1">
            <Crown className="h-4 w-4 text-yellow-500" />
            {profile.plan_name && (
              <span className="text-xs text-yellow-500 font-medium">
                {profile.plan_name}
              </span>
            )}
          </div>
        )}
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuItem>
          <Link to="/profile" className="flex items-center gap-2 w-full">
            <User className="h-4 w-4" />
            <span>Cập nhật thông tin</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link to="/premium" className="flex items-center gap-2 w-full">
            <Crown className="h-4 w-4" />
            <span>{profile?.is_premium ? 'Quản lý Premium' : 'Nâng cấp Premium'}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout}>
          <div className="flex items-center gap-2 w-full text-destructive">
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileMenu;
