
import { FC } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface PremiumHeaderProps {
  isRefreshing: boolean;
}

export const PremiumHeader: FC<PremiumHeaderProps> = ({ isRefreshing }) => {
  return (
    <header className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
        <Link to="/" className="flex items-center space-x-2 text-primary hover:text-primary/80">
          <ArrowLeft className="h-5 w-5" />
          <span>Quay lại</span>
        </Link>
        
        {isRefreshing && (
          <div className="ml-auto flex items-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Đang cập nhật...
          </div>
        )}
      </div>
    </header>
  );
};
