
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Types for our data
interface FoodItem {
  id: number;
  name: string;
  image: string;
  description: string;
  recipe: string;
  diseaseTypes: string[];
}

// Mock data for disease categories
const diseaseCategories = [
  "Bệnh tim mạch",
  "Béo phì",
  "Tiểu đường",
  "Cao huyết áp"
];

// Mock data for food items
const foodItems: FoodItem[] = [
  {
    id: 1,
    name: "Salad cá hồi",
    image: "/lovable-uploads/6fe7589b-6114-4c7e-9ee1-e97994f6ff38.png",
    description: "Salad cá hồi giàu omega-3, tốt cho tim mạch",
    recipe: "Cá hồi nướng, rau xanh tổng hợp, dầu olive, chanh",
    diseaseTypes: ["Bệnh tim mạch", "Béo phì"]
  },
  {
    id: 2,
    name: "Soup rau củ",
    image: "/lovable-uploads/6fe7589b-6114-4c7e-9ee1-e97994f6ff38.png",
    description: "Soup rau củ ít calo, giàu chất xơ",
    recipe: "Cà rốt, súp lơ, cần tây, khoai tây, nấu với nước dùng gà",
    diseaseTypes: ["Béo phì", "Cao huyết áp"]
  },
  // Thêm các món ăn khác tương tự...
];

const KnowledgeBase = () => {
  const [selectedDisease, setSelectedDisease] = useState<string>("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  const filteredFoods = selectedDisease
    ? foodItems.filter(food => food.diseaseTypes.includes(selectedDisease))
    : foodItems;

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
                ${!selectedDisease 
                  ? "bg-primary text-white" 
                  : "bg-white text-gray-600 hover:bg-gray-100"}`}
              onClick={() => setSelectedDisease("")}
            >
              Tất cả
            </button>
            {diseaseCategories.map((disease) => (
              <button
                key={disease}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${selectedDisease === disease 
                    ? "bg-primary text-white" 
                    : "bg-white text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setSelectedDisease(disease)}
              >
                {disease}
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
                  src={food.image}
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
                    src={selectedFood.image}
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
                      {selectedFood.diseaseTypes.map((disease) => (
                        <span
                          key={disease}
                          className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                        >
                          {disease}
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
