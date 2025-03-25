
import React from "react";

const MarketNeedSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container px-4 mx-auto">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-800 mb-10 text-center">Tại sao thị trường Việt Nam cần B!teology?</h2>
          
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef" 
                alt="Vietnamese food market" 
                className="rounded-lg shadow-xl w-full h-auto object-cover aspect-[4/3]"
              />
            </div>
            <div className="space-y-6">
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="text-xl font-semibold mb-2">Sự chuyển dịch về nhận thức sức khỏe</h3>
                <p className="text-slate-600">
                  Người tiêu dùng Việt Nam ngày càng quan tâm đến sức khỏe và dinh dưỡng, 
                  nhưng vẫn thiếu các công cụ hiệu quả để quản lý chế độ ăn uống.
                </p>
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-xl font-semibold mb-2">Gia tăng các bệnh liên quan đến lối sống</h3>
                <p className="text-slate-600">
                  Việt Nam đang đối mặt với sự gia tăng nhanh chóng của các bệnh không lây nhiễm như 
                  tiểu đường, béo phì và tim mạch, đòi hỏi các giải pháp dự phòng hiệu quả.
                </p>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="text-xl font-semibold mb-2">Thiếu hụt giải pháp công nghệ bản địa</h3>
                <p className="text-slate-600">
                  Các ứng dụng dinh dưỡng hiện có trên thị trường chủ yếu là của nước ngoài, 
                  không tối ưu hóa cho văn hóa ẩm thực và thói quen ăn uống của người Việt.
                </p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="text-xl font-semibold mb-2">Nhu cầu cá nhân hóa cao</h3>
                <p className="text-slate-600">
                  Mỗi cơ thể có nhu cầu dinh dưỡng khác nhau, và người tiêu dùng đang tìm kiếm 
                  các giải pháp được điều chỉnh riêng cho tình trạng sức khỏe cá nhân.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketNeedSection;
