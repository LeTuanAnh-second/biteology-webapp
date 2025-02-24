
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { CategoryFilter } from "@/components/knowledge-base/CategoryFilter";
import { FoodGrid } from "@/components/knowledge-base/FoodGrid";
import { FoodDetailDialog } from "@/components/knowledge-base/FoodDetailDialog";
import { type Category, type Food } from "@/types/knowledge-base";

const KnowledgeBase = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchFoods();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách loại bệnh. Vui lòng thử lại sau.",
        variant: "destructive"
      });
    }
  };

  const fetchFoods = async () => {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select(`
          *,
          food_categories!inner (
            categories!inner(name)
          )
        `);

      if (error) throw error;

      if (data) {
        const transformedFoods = data.map(food => ({
          id: food.id,
          name: food.name,
          image_url: food.image_url || '/lovable-uploads/6fe7589b-6114-4c7e-9ee1-e97994f6ff38.png',
          description: food.description,
          recipe: food.recipe,
          categories: food.food_categories.map((fc: any) => fc.categories.name)
        }));
        setFoods(transformedFoods);
      }
    } catch (error) {
      console.error('Error fetching foods:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách món ăn. Vui lòng thử lại sau.",
        variant: "destructive"
      });
    }
  };

  const filteredFoods = selectedCategory
    ? foods.filter(food => food.categories.includes(selectedCategory))
    : foods;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link to="/" className="flex items-center space-x-2 text-primary hover:text-primary/80">
            <ArrowLeft className="h-5 w-5" />
            <span>Quay lại</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Thư viện món ăn theo bệnh lý</h1>
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        <FoodGrid foods={filteredFoods} onFoodSelect={setSelectedFood} />
        
        <FoodDetailDialog food={selectedFood} onClose={() => setSelectedFood(null)} />
      </main>
    </div>
  );
};

export default KnowledgeBase;
