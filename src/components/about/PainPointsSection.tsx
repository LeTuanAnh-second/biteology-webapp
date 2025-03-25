
import React from "react";
import { Target, BarChart, Shield } from "lucide-react";

const PainPointsSection = () => {
  return (
    <section className="py-16 bg-slate-50">
      <div className="container px-4 mx-auto">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-800 mb-10 text-center">Những thách thức về dinh dưỡng hiện nay</h2>
          
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2" 
                alt="Person struggling with health choices" 
                className="rounded-lg shadow-xl w-full h-auto object-cover aspect-[4/3]"
              />
            </div>
            <div>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Target className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Thiếu hiểu biết về dinh dưỡng</h3>
                    <p className="text-slate-600">
                      Phần lớn người Việt Nam không có đủ kiến thức để đưa ra lựa chọn dinh dưỡng đúng đắn, 
                      dẫn đến việc ăn uống thiếu cân bằng và nhiều vấn đề sức khỏe.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <BarChart className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Theo dõi dinh dưỡng phức tạp</h3>
                    <p className="text-slate-600">
                      Việc theo dõi lượng calo, chất dinh dưỡng đa lượng và vi lượng tốn thời gian và đòi hỏi nhiều nỗ lực, 
                      khiến nhiều người nhanh chóng từ bỏ.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Thông tin sai lệch tràn lan</h3>
                    <p className="text-slate-600">
                      Internet và mạng xã hội chứa đầy thông tin dinh dưỡng đối lập và không dựa trên khoa học, 
                      gây hoang mang cho người tiêu dùng.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PainPointsSection;
