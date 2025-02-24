
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { CategoryFilter } from "@/components/knowledge-base/CategoryFilter";
import { FoodGrid } from "@/components/knowledge-base/FoodGrid";
import { FoodDetailDialog } from "@/components/knowledge-base/FoodDetailDialog";
import { type Food } from "@/types/knowledge-base";
import { useCategories } from "@/hooks/use-categories";
import { useFoods } from "@/hooks/use-foods";

const KnowledgeBase = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const { toast } = useToast();

  const { data: categories = [], isError: isCategoriesError } = useCategories();
  const { data: foods = [], isError: isFoodsError } = useFoods();

  if (isCategoriesError || isFoodsError) {
    toast({
      title: "Lỗi",
      description: "Không thể tải dữ liệu. Vui lòng thử lại sau.",
      variant: "destructive"
    });
  }

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
