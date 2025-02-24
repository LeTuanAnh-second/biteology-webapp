
import { type Food } from "@/types/knowledge-base";

interface FoodGridProps {
  foods: Food[];
  onFoodSelect: (food: Food) => void;
}

export const FoodGrid = ({ foods, onFoodSelect }: FoodGridProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {foods.map((food) => (
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
  );
};
