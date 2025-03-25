
import React from "react";
import { Sparkles, Leaf, Book } from "lucide-react";

const CompetitiveAdvantagesSection = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50">
      <div className="container px-4 mx-auto">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-800 mb-10 text-center">Lợi thế vượt trội của B!teology</h2>
          
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center mb-4">
                    <Sparkles className="h-6 w-6 text-yellow-500 mr-3" />
                    <h3 className="text-xl font-semibold">Thuật toán AI tiên tiến</h3>
                  </div>
                  <p className="text-slate-600">
                    Khác với các ứng dụng dinh dưỡng thông thường, B!teology sử dụng trí tuệ nhân tạo để 
                    phân tích dữ liệu sức khỏe và đề xuất kế hoạch dinh dưỡng tối ưu cho từng cá nhân.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center mb-4">
                    <Leaf className="h-6 w-6 text-green-500 mr-3" />
                    <h3 className="text-xl font-semibold">Cơ sở dữ liệu thực phẩm Việt Nam</h3>
                  </div>
                  <p className="text-slate-600">
                    Chúng tôi phát triển cơ sở dữ liệu thực phẩm đặc biệt cho người Việt với đầy đủ 
                    thông tin về các món ăn địa phương, không như các ứng dụng quốc tế thiếu dữ liệu này.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center mb-4">
                    <Book className="h-6 w-6 text-blue-500 mr-3" />
                    <h3 className="text-xl font-semibold">Tư vấn từ chuyên gia thực thụ</h3>
                  </div>
                  <p className="text-slate-600">
                    Đội ngũ chuyên gia dinh dưỡng của chúng tôi thường xuyên kiểm tra và cập nhật 
                    thông tin, đảm bảo mọi lời khuyên đều dựa trên cơ sở khoa học và phù hợp với người Việt.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <img 
                src="https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7" 
                alt="Advanced technology visualization" 
                className="rounded-lg shadow-xl w-full h-auto object-cover aspect-[4/3]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompetitiveAdvantagesSection;
