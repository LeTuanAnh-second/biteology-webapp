
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
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">Sứ mệnh của chúng tôi</h2>
              <div className="prose prose-lg mx-auto">
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
          </div>
        </section>

        {/* Why choose us */}
        <section className="py-16 bg-slate-50">
          <div className="container px-4 mx-auto">
            <h2 className="text-3xl font-bold text-slate-800 mb-12 text-center">Tại sao chọn B!teology?</h2>
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

        {/* CTA section */}
        <section className="py-20 bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="container px-4 mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Bắt đầu hành trình sức khỏe của bạn ngay hôm nay</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Chỉ với vài phút mỗi ngày, bạn có thể xây dựng thói quen ăn uống lành mạnh và cải thiện sức khỏe tổng thể
            </p>
            <div className="flex flex-wrap justify-center gap-4">
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
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
