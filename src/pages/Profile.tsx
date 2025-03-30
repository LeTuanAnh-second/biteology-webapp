
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DiseaseCategory {
  id: number;
  name: string;
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [categories, setCategories] = useState<DiseaseCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profile) {
          setFullName(profile.full_name || "");
          setPhoneNumber(profile.phone_number || "");
          // If profile exists but no name or phone, consider it a new user
          setIsNewUser(!profile.full_name || !profile.phone_number);
        }

        // Load categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*');

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData);

        // Load user's selected categories
        const { data: userCategories, error: userCategoriesError } = await supabase
          .from('user_disease_categories')
          .select('category_id')
          .eq('user_id', user.id);

        if (userCategoriesError) throw userCategoriesError;

        const selectedIds = userCategories.map(uc => uc.category_id);
        setSelectedCategories(selectedIds);
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tải thông tin người dùng"
        });
      }
    }

    loadProfile();
  }, [user?.id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Update profile information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone_number: phoneNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Delete existing category associations
      const { error: deleteError } = await supabase
        .from('user_disease_categories')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Insert new category associations
      if (selectedCategories.length > 0) {
        const { error: insertError } = await supabase
          .from('user_disease_categories')
          .insert(
            selectedCategories.map(categoryId => ({
              user_id: user.id,
              category_id: categoryId
            }))
          );

        if (insertError) throw insertError;
      }

      toast({
        title: "Thành công",
        description: "Thông tin của bạn đã được cập nhật"
      });
      navigate('/');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật thông tin"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link to="/" className="flex items-center space-x-2 text-primary hover:text-primary/80">
            <ArrowLeft className="h-5 w-5" />
            <span>Quay lại</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Cập nhật thông tin</h1>
          
          {isNewUser && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50">
              <Info className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Chào mừng bạn đến với Biteology! Vui lòng cập nhật thông tin cá nhân của bạn để tiếp tục sử dụng ứng dụng.
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên của bạn"
                required
                className={isNewUser ? "border-primary" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Số điện thoại</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Nhập số điện thoại của bạn"
                required
                className={isNewUser ? "border-primary" : ""}
              />
            </div>

            <div className="space-y-4">
              <Label>Loại bệnh</Label>
              <div className="grid grid-cols-2 gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => toggleCategory(category.id)}
                    />
                    <label
                      htmlFor={`category-${category.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full primary-button"
            >
              {isLoading ? "Đang cập nhật..." : "Cập nhật thông tin"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Profile;
