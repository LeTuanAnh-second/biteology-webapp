
import { type Food } from "@/types/knowledge-base";
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
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
