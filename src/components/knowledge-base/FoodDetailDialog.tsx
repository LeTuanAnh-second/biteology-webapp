
import { useState } from "react";
import { CookingPot, BookOpen, Utensils, List, CircleDot, Timer, ChefHat } from "lucide-react";
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

      // Process the AI response to replace ### markers with icons
      const formattedInstructions = formatCookingInstructions(data.answer);
      
      setCookingInstructions(formattedInstructions);
      // Open instructions modal after getting results
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

  // Function to format cooking instructions with icons
  const formatCookingInstructions = (text: string): string => {
    if (!text) return "";

    // Replace ### Nguyên liệu with icon
    let formatted = text.replace(/#{3}\s*Nguyên liệu:/gi, 
      '<div class="flex items-center gap-2 font-semibold text-primary my-3"><span class="icon-container"><List className="h-5 w-5" /></span>Nguyên liệu:</div>');
    
    // Replace ### Hướng dẫn with icon
    formatted = formatted.replace(/#{3}\s*Hướng dẫn:/gi, 
      '<div class="flex items-center gap-2 font-semibold text-primary my-3"><span class="icon-container"><Utensils className="h-5 w-5" /></span>Hướng dẫn:</div>');
    
    // Replace any other ### headers
    formatted = formatted.replace(/#{3}\s*([^:]+):/gi, 
      '<div class="flex items-center gap-2 font-semibold text-primary my-3"><span class="icon-container"><ChefHat className="h-5 w-5" /></span>$1:</div>');
    
    return formatted;
  };

  // Function to render instructions with React components instead of string HTML
  const renderInstructions = (instructions: string | null) => {
    if (!instructions) return null;
    
    // Split the text by sections (Nguyên liệu, Hướng dẫn, etc.)
    const sections = instructions.split(/<div class="flex items-center gap-2 font-semibold text-primary my-3">/).filter(Boolean);
    
    return sections.map((section, index) => {
      if (index === 0 && !section.includes('</div>')) {
        // This is the introduction text before any section
        return <p key={`intro-${index}`} className="mb-4">{section}</p>;
      }
      
      // Extract the section title and content
      const iconMatch = section.match(/<span class="icon-container"><([A-Za-z]+)[^<]*<\/span>([^<]*)<\/div>(.*)/s);
      
      if (!iconMatch) return <p key={`content-${index}`}>{section}</p>;
      
      const [, iconName, title, content] = iconMatch;
      
      // Render appropriate icon based on the section
      let icon;
      switch (iconName) {
        case 'List':
          icon = <List className="h-5 w-5" />;
          break;
        case 'Utensils':
          icon = <Utensils className="h-5 w-5" />;
          break;
        case 'ChefHat':
          icon = <ChefHat className="h-5 w-5" />;
          break;
        default:
          icon = <CircleDot className="h-5 w-5" />;
      }
      
      // Format the content: replace numbered steps with styled steps
      const formattedContent = content
        .split('\n')
        .map((line, lineIndex) => {
          // Match numbered steps like "1. Step description"
          const stepMatch = line.match(/^(\d+)\.\s*(.+)/);
          if (stepMatch) {
            const [, number, step] = stepMatch;
            return (
              <div key={`step-${lineIndex}`} className="flex items-start mb-2">
                <div className="flex items-center justify-center bg-primary/10 rounded-full h-6 w-6 text-primary text-sm mt-0.5 mr-2">
                  {number}
                </div>
                <div>{step}</div>
              </div>
            );
          }
          
          // Match bullet points
          const bulletMatch = line.match(/^[-•]\s*(.+)/);
          if (bulletMatch) {
            return (
              <div key={`bullet-${lineIndex}`} className="flex items-start mb-2">
                <CircleDot className="h-4 w-4 text-primary mt-1 mr-2 shrink-0" />
                <div>{bulletMatch[1]}</div>
              </div>
            );
          }
          
          // Regular paragraph
          if (line.trim()) {
            return <p key={`para-${lineIndex}`} className="mb-2">{line}</p>;
          }
          
          return null;
        })
        .filter(Boolean);
      
      return (
        <div key={`section-${index}`} className="mb-6">
          <div className="flex items-center gap-2 font-semibold text-primary my-3">
            {icon}
            {title}
          </div>
          <div className="ml-1">{formattedContent}</div>
        </div>
      );
    });
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

      {/* Separate modal for cooking instructions */}
      <AlertDialog open={showInstructionsModal} onOpenChange={closeInstructionsModal}>
        <AlertDialogContent className="max-w-[600px] max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
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
