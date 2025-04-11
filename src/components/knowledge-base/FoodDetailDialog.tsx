import { useState } from "react";
import { 
  CookingPot, 
  BookOpen, 
  Utensils, 
  List, 
  CircleDot, 
  Timer, 
  ChefHat, 
  Info, 
  Leaf, 
  GanttChart,
  ShoppingBag,
  LucideIcon
} from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FoodDetailDialogProps {
  food: Food | null;
  onClose: () => void;
}

interface SectionHeader {
  title: string;
  icon: LucideIcon;
}

export const FoodDetailDialog = ({ food, onClose }: FoodDetailDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cookingInstructions, setCookingInstructions] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

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

      const formattedInstructions = formatCookingInstructions(data.answer);
      
      setCookingInstructions(formattedInstructions);
      setShowInstructionsModal(true);
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

  const formatCookingInstructions = (text: string): string => {
    if (!text) return "";

    const sectionPatterns = [
      { pattern: /#{3}\s*Nguyên liệu:/gi, icon: "ShoppingBag", title: "Nguyên liệu:" },
      { pattern: /#{3}\s*Hướng dẫn:/gi, icon: "Utensils", title: "Hướng dẫn:" },
      { pattern: /#{3}\s*Chuẩn bị:/gi, icon: "GanttChart", title: "Chuẩn bị:" },
      { pattern: /#{3}\s*Thực hiện:/gi, icon: "ChefHat", title: "Thực hiện:" },
      { pattern: /#{3}\s*Lưu ý:/gi, icon: "Info", title: "Lưu ý:" },
      { pattern: /#{3}\s*Thưởng thức:/gi, icon: "Leaf", title: "Thưởng thức:" },
      { pattern: /#{3}\s*([^:]+):/gi, icon: "CircleDot", title: "$1:" }
    ];

    let formatted = text;
    for (const section of sectionPatterns) {
      formatted = formatted.replace(section.pattern, 
        `<section data-icon="${section.icon}">${section.title}</section>`);
    }
    
    formatted = formatted.replace(/(\d+)\.\s+([^\n]+)/g, 
      '<numbered-item data-number="$1">$2</numbered-item>');
    
    formatted = formatted.replace(/[-•]\s+([^\n]+)/g, 
      '<bullet-item>$1</bullet-item>');
    
    formatted = formatted.replace(/:\)/g, '😊');
    formatted = formatted.replace(/\(y\)/g, '👍');
    formatted = formatted.replace(/:sun:/g, '☀️');
    
    return formatted;
  };

  const getIconForSection = (iconName: string): LucideIcon => {
    const iconMap: Record<string, LucideIcon> = {
      'ShoppingBag': ShoppingBag,
      'Utensils': Utensils,
      'GanttChart': GanttChart,
      'ChefHat': ChefHat,
      'Info': Info,
      'Leaf': Leaf,
      'CircleDot': CircleDot,
      'List': List
    };
    
    return iconMap[iconName] || CircleDot;
  };

  const renderInstructions = (instructions: string | null) => {
    if (!instructions) return null;
    
    const parts = instructions.split(/<section data-icon="([^"]+)">([^<]+)<\/section>/);
    
    const components = [];
    let index = 0;
    
    if (parts[0] && !parts[0].includes('<section')) {
      components.push(
        <p key={`intro-${index}`} className="text-gray-700 mb-4">{parts[0]}</p>
      );
    }
    
    for (let i = 1; i < parts.length; i += 3) {
      if (parts[i] && parts[i+1]) {
        const iconName = parts[i];
        const title = parts[i+1];
        const content = parts[i+2];
        
        const SectionIcon = getIconForSection(iconName);
        
        const formattedContent = content.split('\n').map((line, lineIndex) => {
          if (line.includes('<numbered-item')) {
            const match = line.match(/<numbered-item data-number="(\d+)">([^<]+)<\/numbered-item>/);
            if (match) {
              const [, number, step] = match;
              return (
                <div key={`step-${lineIndex}`} className="flex items-start mb-3">
                  <div className="flex items-center justify-center bg-primary/10 rounded-full h-6 w-6 text-primary text-sm mt-0.5 mr-2">
                    {number}
                  </div>
                  <div className="flex-1">{step}</div>
                </div>
              );
            }
          }
          
          if (line.includes('<bullet-item>')) {
            const match = line.match(/<bullet-item>([^<]+)<\/bullet-item>/);
            if (match) {
              return (
                <div key={`bullet-${lineIndex}`} className="flex items-start mb-3">
                  <CircleDot className="h-4 w-4 text-primary mt-1 mr-2 shrink-0" />
                  <div className="flex-1">{match[1]}</div>
                </div>
              );
            }
          }
          
          if (line.trim() && !line.includes('<numbered-item') && !line.includes('<bullet-item>')) {
            return <p key={`para-${lineIndex}`} className="mb-3">{line}</p>;
          }
          
          return null;
        }).filter(Boolean);
        
        components.push(
          <div key={`section-${index}`} className="mb-6">
            <div className="flex items-center gap-2 font-semibold text-primary my-4 bg-primary/5 p-3 rounded-lg">
              <SectionIcon className="h-5 w-5" />
              <h3 className="text-lg">{title}</h3>
            </div>
            <div className="ml-2 space-y-1">
              {formattedContent}
            </div>
          </div>
        );
        
        index++;
      }
    }
    
    return components;
  };

  const closeInstructionsModal = () => {
    setShowInstructionsModal(false);
  };

  return (
    <>
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showInstructionsModal} onOpenChange={closeInstructionsModal}>
        <AlertDialogContent className="max-w-[650px] max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 border-b pb-2">
              <BookOpen className="h-5 w-5" />
              Hướng dẫn nấu món {food?.name}
            </AlertDialogTitle>
          </AlertDialogHeader>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tạo hướng dẫn nấu ăn...</p>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              {cookingInstructions ? (
                <div className="bg-gray-50 rounded-lg p-5 text-gray-700">
                  {renderInstructions(cookingInstructions)}
                </div>
              ) : (
                <div className="text-center p-4 text-gray-500">
                  Không tìm thấy hướng dẫn nấu ăn
                </div>
              )}
              <div className="mt-6 flex justify-end">
                <Button onClick={closeInstructionsModal}>Đóng</Button>
              </div>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
