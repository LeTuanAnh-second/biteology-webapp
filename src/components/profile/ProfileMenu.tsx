
import { LogOut, User, ChevronDown } from "lucide-react";
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
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);

  const fetchProfile = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
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
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span>Nâng cấp tài khoản</span>
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
