
import { Activity, Calendar, Heart, Library, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import FeatureCard from "./FeatureCard";

const FeaturesSection = () => {
  const features = [
    {
      title: "Theo dõi chỉ số",
      description: "Ghi lại và theo dõi các chỉ số sức khỏe quan trọng như cân nặng và đường huyết.",
      icon: Activity,
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
      link: "/health-tracking",
      isPremium: true
    },
    {
      title: "Tư vấn dinh dưỡng",
      description: "Nhận lời khuyên về chế độ ăn uống phù hợp với tình trạng sức khỏe của bạn.",
      icon: Heart,
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
      link: "/nutrition-advice",
      isPremium: true
    },
    {
      title: "Thư viện kiến thức",
      description: "Truy cập kho tàng kiến thức về sức khỏe và các thức nấu ăn lành mạnh.",
      icon: Library,
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061",
      link: "/knowledge-base",
      isPremium: true
    },
    {
      title: "Tư vấn chuyên gia",
      description: "Đặt lịch tư vấn trực tiếp với các chuyên gia dinh dưỡng hàng đầu.",
      icon: Calendar,
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef",
      link: "/expert-consultation",
      isPremium: true
    }
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold">Tính năng nổi bật</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Chúng tôi cung cấp các công cụ cần thiết để bạn có thể theo dõi và cải thiện sức khỏe của mình.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              title={feature.title}
              description={feature.description}
              image={feature.image}
              icon={feature.icon}
              link={feature.link}
              isPremium={feature.isPremium}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
