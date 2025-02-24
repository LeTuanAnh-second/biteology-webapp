
import { useToast } from "@/components/ui/use-toast";
import { FoodForm } from "@/components/food-management/FoodForm";
import { useCategories } from "@/hooks/use-categories";

const FoodManagement = () => {
  const { toast } = useToast();
  const { data: categories = [], isError } = useCategories();

  if (isError) {
    toast({
      title: "Lỗi",
      description: "Không thể tải danh sách loại bệnh. Vui lòng thử lại sau.",
      variant: "destructive"
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Thêm món ăn mới</h1>
        <FoodForm categories={categories} />
      </div>
    </div>
  );
};

export default FoodManagement;
