
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Book, Heart, Leaf, User, Zap } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero section */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="container px-4 mx-auto">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">Về B!teology</h1>
              <p className="text-xl text-slate-600 mb-8">
                Nơi khám phá hành trình sức khỏe và dinh dưỡng cá nhân hóa dành riêng cho bạn
              </p>
              <div className="flex justify-center">
                <img 
                  src="/lovable-uploads/30afc11d-2515-46e5-ae20-770260d269fe.png" 
                  alt="Biteology Logo" 
                  className="h-32 w-auto" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Mission section */}
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

        {/* Why choose us */}
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

        {/* Team Section */}
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

        {/* CTA section */}
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
                    <Button size="lg" className="bg-white text-green-600 hover:bg-green-50">
                      Đăng ký miễn phí
                    </Button>
                  </Link>
                  <Link to="/premium">
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-green-600">
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
      </main>
      <Footer />
    </div>
  );
};

export default About;
