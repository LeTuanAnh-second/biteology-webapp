
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const KnowledgeBase = () => {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link to="/" className="flex items-center space-x-2 text-primary hover:text-primary/80">
            <ArrowLeft className="h-5 w-5" />
            <span>Quay lại</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-6">Thư viện kiến thức</h1>
        <div className="grid gap-6">
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-xl font-semibold mb-4">Bài viết mới nhất</h2>
            <p className="text-muted-foreground mb-4">
              Khám phá các bài viết về sức khỏe và dinh dưỡng.
            </p>
            <button className="primary-button">Xem bài viết</button>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-xl font-semibold mb-4">Công thức nấu ăn</h2>
            <p className="text-muted-foreground mb-4">
              Khám phá các công thức nấu ăn lành mạnh.
            </p>
            <button className="primary-button">Xem công thức</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default KnowledgeBase;
