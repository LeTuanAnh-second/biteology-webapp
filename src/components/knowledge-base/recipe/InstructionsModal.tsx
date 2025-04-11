
import { ReactNode } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isLoading: boolean;
  foodName: string;
  children: ReactNode;
}

export const InstructionsModal = ({
  isOpen,
  onClose,
  title,
  isLoading,
  children
}: InstructionsModalProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-[650px] max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 border-b pb-2">
            <BookOpen className="h-5 w-5" />
            {title}
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
            <div className="bg-gray-50 rounded-lg p-5 text-gray-700">
              {children}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={onClose}>Đóng</Button>
            </div>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};
