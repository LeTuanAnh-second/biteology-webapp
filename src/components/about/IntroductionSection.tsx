
import React from "react";

const IntroductionSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container px-4 mx-auto">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-6">Hiểu rõ hơn về B!teology</h2>
              <div className="prose prose-lg">
                <p>
                  <strong>B!teology</strong> là nền tảng công nghệ dinh dưỡng thông minh, được phát triển bởi đội ngũ chuyên gia 
                  hàng đầu Việt Nam trong lĩnh vực công nghệ và y tế dinh dưỡng.
                </p>
                <p>
                  Chúng tôi kết hợp trí tuệ nhân tạo và kiến thức dinh dưỡng để cung cấp các giải pháp 
                  quản lý sức khỏe cá nhân hóa, giúp người Việt Nam xây dựng lối sống lành mạnh bền vững 
                  thông qua chế độ ăn uống khoa học.
                </p>
                <p>
                  Với B!teology, việc theo dõi dinh dưỡng và quản lý sức khỏe trở nên đơn giản, chính xác 
                  và hiệu quả hơn bao giờ hết.
                </p>
              </div>
            </div>
            <div>
              <img 
                src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd" 
                alt="Healthy food variety" 
                className="rounded-lg shadow-xl w-full h-auto object-cover aspect-square"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntroductionSection;
