
import TestimonialCard from "./TestimonialCard";

const TestimonialsSection = () => {
  const testimonials = [
    {
      text: "Tôi đã theo dõi đường huyết của mình trong vài tháng qua và thấy sự cải thiện đáng kể. B!teology thực sự đã thay đổi cách tôi quản lý sức khỏe.",
      name: "Nguyễn Văn A",
      role: "Người dùng Premium"
    },
    {
      text: "Tính năng tư vấn dinh dưỡng đã giúp tôi hiểu rõ hơn về thói quen ăn uống. Gói Premium hoàn toàn xứng đáng với giá tiền.",
      name: "Trần Thị B",
      role: "Người dùng Premium"
    },
    {
      text: "Thư viện kiến thức của B!teology rất phong phú. Tôi đã học được rất nhiều về chế độ ăn uống lành mạnh và cách chăm sóc sức khỏe.",
      name: "Lê Văn C",
      role: "Người dùng Premium"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold">Người dùng nói gì về chúng tôi</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard 
              key={index}
              text={testimonial.text}
              name={testimonial.name}
              role={testimonial.role}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
