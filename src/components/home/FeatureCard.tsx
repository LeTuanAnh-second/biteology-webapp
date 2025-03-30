
import { Link } from "react-router-dom";
import { LucideIcon, Crown } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  image: string;
  icon: LucideIcon;
  link: string;
  isPremium?: boolean;
}

const FeatureCard = ({ title, description, image, icon: Icon, link, isPremium = false }: FeatureCardProps) => {
  return (
    <Link to={link} className="feature-card group">
      <div className="relative h-48 mb-6 overflow-hidden rounded-lg">
        <img 
          src={image}
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/10 transition-colors duration-300"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-16 w-16 text-white drop-shadow-md" />
        </div>
        
        {isPremium && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 rounded-full px-2 py-1 text-xs font-semibold flex items-center">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </div>
        )}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </Link>
  );
};

export default FeatureCard;
