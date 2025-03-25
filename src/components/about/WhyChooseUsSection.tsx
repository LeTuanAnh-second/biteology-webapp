
import React from "react";
import { Heart, Book, Zap, User, Leaf } from "lucide-react";

const WhyChooseUsSection = () => {
  return (
    <section className="py-16 bg-slate-50">
      <div className="container px-4 mx-auto">
        <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">Tại sao chọn B!teology?</h2>
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <img 
            src="https://images.unsplash.com/photo-1490818387583-1baba5e638af" 
            alt="Healthy lifestyle visualization" 
            className="rounded-lg shadow-md w-full h-auto object-cover aspect-[16/6] mb-8"
          />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Cá nhân hóa hoàn toàn</h3>
            <p className="text-slate-600">
              Chúng tôi hiểu rằng mỗi cơ thể là khác nhau. B!teology cung cấp lộ trình dinh dưỡng 
              được thiết kế riêng dựa trên nhu cầu, mục tiêu và tình trạng sức khỏe của bạn.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Book className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Kho tàng kiến thức</h3>
            <p className="text-slate-600">
              Với thư viện đa dạng về thực phẩm, công thức nấu ăn và bài viết về dinh dưỡng, 
              bạn sẽ không bao giờ thiếu ý tưởng cho những bữa ăn lành mạnh.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Đơn giản và hiệu quả</h3>
            <p className="text-slate-600">
              Chúng tôi biến quá trình theo dõi dinh dưỡng trở nên dễ dàng và thú vị, 
              giúp bạn duy trì động lực và đạt được mục tiêu sức khỏe.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Cộng đồng hỗ trợ</h3>
            <p className="text-slate-600">
              Tham gia cộng đồng B!teology để chia sẻ kinh nghiệm, tìm động lực và 
              kết nối với những người có cùng mục tiêu sức khỏe.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Leaf className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Phát triển bền vững</h3>
            <p className="text-slate-600">
              Chúng tôi không chỉ quan tâm đến sức khỏe của bạn mà còn cả sức khỏe của 
              hành tinh, khuyến khích lựa chọn thực phẩm có trách nhiệm.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-teal-600">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Chất lượng đảm bảo</h3>
            <p className="text-slate-600">
              Mọi thông tin trên B!teology đều được kiểm chứng bởi các chuyên gia dinh dưỡng 
              và dựa trên những nghiên cứu khoa học mới nhất.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
