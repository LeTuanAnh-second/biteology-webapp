
import React from "react";

const MissionSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container px-4 mx-auto">
        <div className="grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
          <div className="order-2 md:order-1">
            <h2 className="text-3xl font-bold text-slate-800 mb-8">Sứ mệnh của chúng tôi</h2>
            <div className="prose prose-lg">
              <p>
                <strong>B!teology</strong> ra đời với sứ mệnh giúp mỗi người Việt Nam có thể chủ động quản lý sức khỏe của bản thân 
                thông qua việc theo dõi và điều chỉnh chế độ dinh dưỡng một cách khoa học.
              </p>
              <p>
                Chúng tôi tin rằng mỗi người đều xứng đáng có được một lối sống khỏe mạnh, và điều đó bắt đầu từ 
                những bữa ăn hàng ngày. Với B!teology, bạn không còn phải lo lắng về việc lựa chọn thực phẩm 
                phù hợp hay theo dõi lượng calo nạp vào - chúng tôi sẽ làm điều đó cho bạn!
              </p>
              <p>
                Dựa trên công nghệ tiên tiến kết hợp với kiến thức dinh dưỡng từ các chuyên gia hàng đầu, 
                B!teology cung cấp cho bạn những công cụ và thông tin cần thiết để xây dựng một lối sống 
                lành mạnh bền vững.
              </p>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <img 
              src="https://images.unsplash.com/photo-1505576399279-565b52d4ac71" 
              alt="Healthy foods assortment" 
              className="rounded-lg shadow-xl w-full h-auto object-cover aspect-[4/3]"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
