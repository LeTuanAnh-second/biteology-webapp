
import React from "react";

const TeamSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container px-4 mx-auto">
        <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">Đội ngũ chuyên gia</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <img 
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330" 
              alt="Chuyên gia dinh dưỡng" 
              className="w-40 h-40 object-cover rounded-full mx-auto mb-4 border-4 border-green-100"
            />
            <h3 className="text-xl font-semibold">TS. Minh Anh</h3>
            <p className="text-green-600 mb-3">Chuyên gia dinh dưỡng</p>
            <p className="text-slate-600 text-sm">
              Với hơn 10 năm kinh nghiệm trong lĩnh vực dinh dưỡng học và sức khỏe cộng đồng
            </p>
          </div>
          
          <div className="text-center">
            <img 
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e" 
              alt="Chuyên gia công nghệ" 
              className="w-40 h-40 object-cover rounded-full mx-auto mb-4 border-4 border-blue-100"
            />
            <h3 className="text-xl font-semibold">KS. Quang Huy</h3>
            <p className="text-blue-600 mb-3">Giám đốc công nghệ</p>
            <p className="text-slate-600 text-sm">
              Chuyên gia về AI và dữ liệu lớn với kinh nghiệm phát triển các hệ thống y tế thông minh
            </p>
          </div>
          
          <div className="text-center">
            <img 
              src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e" 
              alt="Nhà nghiên cứu" 
              className="w-40 h-40 object-cover rounded-full mx-auto mb-4 border-4 border-amber-100"
            />
            <h3 className="text-xl font-semibold">PGS. Thu Hà</h3>
            <p className="text-amber-600 mb-3">Nhà nghiên cứu</p>
            <p className="text-slate-600 text-sm">
              Chuyên gia hàng đầu về nghiên cứu mối quan hệ giữa dinh dưỡng và các bệnh mãn tính
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
