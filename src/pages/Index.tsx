import { BookOpen, Activity, Library, Sparkles, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ProfileMenu from "@/components/profile/ProfileMenu";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">B!teology</span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link 
                  to="/premium" 
                  className="flex items-center text-amber-500 hover:text-amber-600 font-medium bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full transition-colors"
                >
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Nâng cấp Premium
                </Link>
                <ProfileMenu />
              </>
            ) : (
              <>
                <Link to="/login" className="secondary-button">
                  Đăng nhập
                </Link>
                <Link to="/register" className="primary-button">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section with background image */}
      <main className="flex-1">
        <section className="py-20 px-4 bg-gradient-to-r from-green-50 to-blue-50 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 z-0">
            <img 
              src="https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7" 
              alt="Healthy lifestyle background" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-8 text-left">
                <div className="hero-badge">
                  Chào mừng đến với B!teology
                </div>
                
                <h1 className="hero-title text-left">
                  Quản lý sức khỏe của bạn<br />
                  một cách thông minh
                </h1>
                
                <p className="hero-subtitle text-left max-w-full mx-0">
                  Theo dõi sức khỏe, nhận lời khuyên dinh dưỡng và chia sẻ kinh nghiệm với cộng đồng.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  {user ? (
                    <>
                      <Link to="/health-tracking" className="primary-button">
                        Bắt đầu ngay
                      </Link>
                      <Link to="/premium" className="flex items-center secondary-button">
                        <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                        Nâng cấp Premium
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/register" className="primary-button">
                        Bắt đầu miễn phí
                      </Link>
                      <button className="secondary-button">
                        Tìm hiểu thêm
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="hidden md:block">
                <img 
                  src="https://images.unsplash.com/photo-1505576399279-565b52d4ac71"
                  alt="Healthy food and lifestyle" 
                  className="w-full h-auto rounded-xl shadow-xl transform hover:-translate-y-2 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section with card images */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold">Tính năng nổi bật</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Chúng tôi cung cấp các công cụ cần thiết để bạn có thể theo dõi và cải thiện sức khỏe của mình.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Link to="/health-tracking" className="feature-card group">
                <div className="relative h-48 mb-6 overflow-hidden rounded-lg">
                  <img 
                    src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b"
                    alt="Theo dõi chỉ số" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/10 transition-colors duration-300"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className="h-16 w-16 text-white drop-shadow-md" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Theo dõi chỉ số</h3>
                <p className="text-muted-foreground">
                  Ghi lại và theo dõi các chỉ số sức khỏe quan trọng như cân nặng và đường huyết.
                </p>
              </Link>

              <Link to="/nutrition-advice" className="feature-card group">
                <div className="relative h-48 mb-6 overflow-hidden rounded-lg">
                  <img 
                    src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd"
                    alt="Tư vấn dinh dưỡng" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/10 transition-colors duration-300"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Heart className="h-16 w-16 text-white drop-shadow-md" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Tư vấn dinh dưỡng</h3>
                <p className="text-muted-foreground">
                  Nhận lời khuyên về chế độ ăn uống phù hợp với tình trạng sức khỏe của bạn.
                </p>
              </Link>

              <Link to="/knowledge-base" className="feature-card group">
                <div className="relative h-48 mb-6 overflow-hidden rounded-lg">
                  <img 
                    src="https://images.unsplash.com/photo-1490645935967-10de6ba17061"
                    alt="Thư viện kiến thức" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/10 transition-colors duration-300"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Library className="h-16 w-16 text-white drop-shadow-md" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Thư viện kiến thức</h3>
                <p className="text-muted-foreground">
                  Truy cập kho tàng kiến thức về sức khỏe và các thức nấu ăn lành mạnh.
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold">Người dùng nói gì về chúng tôi</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-slate-50 p-6 rounded-xl">
                <div className="flex items-center space-x-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
                <p className="text-slate-700 mb-4">
                  "Tôi đã theo dõi đường huyết của mình trong vài tháng qua và thấy sự cải thiện đáng kể. B!teology thực sự đã thay đổi cách tôi quản lý sức khỏe."
                </p>
                <div className="font-medium">Nguyễn Văn A</div>
                <div className="text-sm text-muted-foreground">Người dùng Premium</div>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-xl">
                <div className="flex items-center space-x-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
                <p className="text-slate-700 mb-4">
                  "Tính năng tư vấn dinh dưỡng đã giúp tôi hiểu rõ hơn về thói quen ăn uống. Gói Premium hoàn toàn xứng đáng với giá tiền."
                </p>
                <div className="font-medium">Trần Thị B</div>
                <div className="text-sm text-muted-foreground">Người dùng Premium</div>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-xl">
                <div className="flex items-center space-x-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
                <p className="text-slate-700 mb-4">
                  "Thư viện kiến thức của B!teology rất phong phú. Tôi đã học được rất nhiều về chế độ ăn uống lành mạnh và cách chăm sóc sức khỏe."
                </p>
                <div className="font-medium">Lê Văn C</div>
                <div className="text-sm text-muted-foreground">Người dùng Premium</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Activity className="h-5 w-5 text-primary" />
                <span className="font-semibold">B!teology</span>
              </div>
              <p className="text-sm text-slate-600">
                Giải pháp quản lý sức khỏe toàn diện dành cho mọi người.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Dịch vụ</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/health-tracking" className="text-slate-600 hover:text-primary">Theo dõi sức khỏe</Link></li>
                <li><Link to="/nutrition-advice" className="text-slate-600 hover:text-primary">Tư vấn dinh dưỡng</Link></li>
                <li><Link to="/knowledge-base" className="text-slate-600 hover:text-primary">Thư viện kiến thức</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Liên kết</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-slate-600 hover:text-primary">Trang chủ</Link></li>
                <li><Link to="/premium" className="text-slate-600 hover:text-primary">Gói Premium</Link></li>
                <li><Link to="/profile" className="text-slate-600 hover:text-primary">Tài khoản</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Kết nối</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-600 hover:text-primary">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="text-slate-600 hover:text-primary">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="text-slate-600 hover:text-primary">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363-.416-2.427-.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.045-1.064.218-1.504.344-1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748 1.351.058 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-500 text-center">
              © 2024 B!teology. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
