
import { useState, useEffect } from "react";
import { Utensils } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Food } from "@/types/knowledge-base";
import { useToast } from "@/components/ui/use-toast";

interface PersonalFoodRecommendationsProps {
  foods: Food[];
  onFoodSelect: (food: Food) => void;
}

export const PersonalFoodRecommendations = ({ 
  foods,
  onFoodSelect 
}: PersonalFoodRecommendationsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userCategories, setUserCategories] = useState<string[]>([]);
  const [recommendedFoods, setRecommendedFoods] = useState<Food[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Fetch user's disease categories
    const fetchUserCategories = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('user_disease_categories')
          .select(`
            categories!inner (
              name
            )
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        const categoryNames = data?.map(item => item.categories.name) || [];
        setUserCategories(categoryNames);
      } catch (error) {
        console.error('Error fetching user categories:', error);
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tải thông tin bệnh lý của bạn"
        });
      }
    };

    fetchUserCategories();
  }, [user?.id, toast]);

  useEffect(() => {
    // Filter foods based on user categories
    if (userCategories.length > 0 && foods.length > 0) {
      const filtered = foods.filter(food => 
        food.categories.some(category => userCategories.includes(category))
      );
      setRecommendedFoods(filtered);
    } else {
      setRecommendedFoods([]);
    }
  }, [userCategories, foods]);

  if (!user || userCategories.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-primary/90 transition-colors"
      >
        <Utensils size={18} />
        <span>Gợi ý món ăn cho bạn</span>
      </button>

      {isOpen && recommendedFoods.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-medium mb-4">Món ăn phù hợp với bệnh lý của bạn</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recommendedFoods.map((food) => (
              <div
                key={food.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onFoodSelect(food)}
              >
                <div className="aspect-square relative">
                  <img
                    src={food.image_url}
                    alt={food.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 text-sm truncate">
                    {food.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOpen && recommendedFoods.length === 0 && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800">
            Chúng tôi không tìm thấy món ăn phù hợp với bệnh lý của bạn. Vui lòng cập nhật thông tin bệnh lý trong trang cá nhân hoặc liên hệ với chuyên gia dinh dưỡng của chúng tôi.
          </p>
        </div>
      )}
    </div>
  );
};
