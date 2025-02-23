
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// Types for our data
interface Category {
  id: number;
  name: string;
  description: string;
}

interface Food {
  id: number;
  name: string;
  image_url: string;
  description: string;
  recipe: string;
  categories: string[];
}

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
      const { data, error } = await supabase
        .from('categories')
        .select('*');
      
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
      // Fetch foods with their categories
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
        // Transform the data to match our Food interface
        const transformedFoods = data.map(food => ({
          id: food.id,
          name: food.name,
          image_url: food.image_url || '/lovable-uploads/6fe7589b-6114-4c7e-9ee1-e97994f6ff38.png', // Fallback image
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
          
          {/* Disease Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button 
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${!selectedCategory 
                  ? "bg-primary text-white" 
                  : "bg-white text-gray-600 hover:bg-gray-100"}`}
              onClick={() => setSelectedCategory("")}
            >
              Tất cả
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${selectedCategory === category.name 
                    ? "bg-primary text-white" 
                    : "bg-white text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setSelectedCategory(category.name)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Food Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredFoods.map((food) => (
            <div
              key={food.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedFood(food)}
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

        {/* Food Detail Dialog */}
        <Dialog open={!!selectedFood} onOpenChange={() => setSelectedFood(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{selectedFood?.name}</DialogTitle>
            </DialogHeader>
            {selectedFood && (
              <div className="mt-4">
                <div className="aspect-video relative mb-4">
                  <img
                    src={selectedFood.image_url}
                    alt={selectedFood.name}
                    className="absolute inset-0 w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Mô tả:</h4>
                    <p className="text-gray-600 text-sm">{selectedFood.description}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Công thức:</h4>
                    <p className="text-gray-600 text-sm">{selectedFood.recipe}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Phù hợp với:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedFood.categories.map((category) => (
                        <span
                          key={category}
                          className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default KnowledgeBase;
