
import { useState } from "react";
import { CookingPot } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { type Food } from "@/types/knowledge-base";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FoodDetailDialogProps {
  food: Food | null;
  onClose: () => void;
}

export const FoodDetailDialog = ({ food, onClose }: FoodDetailDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cookingInstructions, setCookingInstructions] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetCookingInstructions = async () => {
    if (!user) {
      toast({
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để sử dụng tính năng này",
        variant: "destructive"
      });
      return;
    }

    if (!food) return;

    try {
      setIsLoading(true);
      setCookingInstructions(null);

      const message = `Tôi muốn nấu món ${food.name}. Hãy cho tôi hướng dẫn chi tiết cách nấu món này dựa trên nguyên liệu: ${food.recipe}`;

      const { data, error } = await supabase.functions.invoke('nutrition-ai-chat', {
        body: { message, userId: user.id }
      });

      if (error) throw error;

      setCookingInstructions(data.answer);
    } catch (error) {
      console.error("Error getting cooking instructions:", error);
      toast({
        title: "Lỗi",
        description: "Không thể lấy hướng dẫn nấu ăn. Vui lòng thử lại sau.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={!!food} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{food?.name}</DialogTitle>
        </DialogHeader>
        {food && (
          <div className="mt-4">
            <div className="aspect-video relative mb-4">
              <img
                src={food.image_url}
                alt={food.name}
                className="absolute inset-0 w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Mô tả:</h4>
                <p className="text-gray-600 text-sm">{food.description}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Công thức:</h4>
                <p className="text-gray-600 text-sm">{food.recipe}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Phù hợp với:</h4>
                <div className="flex flex-wrap gap-2">
                  {food.categories.map((category) => (
                    <span
                      key={category}
                      className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  onClick={handleGetCookingInstructions} 
                  className="w-full"
                  disabled={isLoading}
                >
                  <CookingPot className="mr-2 h-4 w-4" />
                  {isLoading ? "Đang xử lý..." : "Hướng dẫn nấu món này"}
                </Button>
              </div>

              {cookingInstructions && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Hướng dẫn chi tiết:</h4>
                  <div className="text-gray-700 text-sm whitespace-pre-line">
                    {cookingInstructions}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
