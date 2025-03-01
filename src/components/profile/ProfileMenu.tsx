
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
  const [profile, setProfile] = useState<{ full_name: string | null; is_premium?: boolean } | null>(null);

  const fetchProfile = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, is_premium')
      .eq('id', user.id)
      .single();
    
    if (!error && data) {
      setProfile(data);
    }
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
          <Crown className="h-4 w-4 text-yellow-500" />
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
