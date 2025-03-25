
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-green-500 to-green-600 text-white">
      <div className="container px-4 mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Bắt đầu hành trình sức khỏe của bạn ngay hôm nay</h2>
            <p className="text-xl mb-8">
              Chỉ với vài phút mỗi ngày, bạn có thể xây dựng thói quen ăn uống lành mạnh và cải thiện sức khỏe tổng thể
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="lg" variant="high-contrast" className="bg-white text-green-600 hover:bg-green-50">
                  Đăng ký miễn phí
                </Button>
              </Link>
              <Link to="/premium">
                <Button size="lg" variant="white-outline" className="border-white text-white hover:bg-white/10">
                  Khám phá gói Premium
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c" 
              alt="Healthy meal preparation" 
              className="rounded-lg shadow-2xl w-full"
            />
            <div className="absolute -bottom-5 -left-5 bg-white p-3 rounded-lg shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1505253758473-96b7015fcd40" 
                alt="Tracking health" 
                className="w-32 h-32 object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
