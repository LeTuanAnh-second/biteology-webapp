
import { type Category } from "@/types/knowledge-base";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter = ({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      <button 
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
          ${!selectedCategory 
            ? "bg-primary text-white" 
            : "bg-white text-gray-600 hover:bg-gray-100"}`}
        onClick={() => onCategoryChange("")}
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
          onClick={() => onCategoryChange(category.name)}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
};
