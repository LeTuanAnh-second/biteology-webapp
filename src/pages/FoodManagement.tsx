
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const FoodManagement = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    recipe: "",
    categories: [] as string[]
  });
  const { toast } = useToast();
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*');
      
      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }
      
      if (data) {
        setCategories(data);
      }
    };

    fetchCategories();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      categories: selectedOptions
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, upload the image if one is selected
      let imageUrl = '';
      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('https://ijvtkufzaweqzwczpvgr.supabase.co/functions/v1/upload-food-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const result = await response.json();
        imageUrl = result.filePath;
      }

      // Then, insert the food item
      const { data: foodData, error: foodError } = await supabase
        .from('foods')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            recipe: formData.recipe,
            image_url: imageUrl
          }
        ])
        .select()
        .single();

      if (foodError) throw foodError;

      // Link food with categories
      if (foodData) {
        const categoryIds = await Promise.all(
          formData.categories.map(async (categoryName) => {
            const { data } = await supabase
              .from('categories')
              .select('id')
              .eq('name', categoryName)
              .single();
            return data?.id;
          })
        );

        const { error: linkError } = await supabase
          .from('food_categories')
          .insert(
            categoryIds.filter(id => id != null).map(categoryId => ({
              food_id: foodData.id,
              category_id: categoryId
            }))
          );

        if (linkError) throw linkError;
      }

      toast({
        title: "Thành công",
        description: "Đã thêm món ăn mới",
      });

      // Reset form
      setFormData({
        name: "",
        description: "",
        recipe: "",
        categories: []
      });
      setFile(null);

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm món ăn. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Thêm món ăn mới</h1>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên món ăn
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Công thức
            </label>
            <textarea
              name="recipe"
              value={formData.recipe}
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded"
              rows={5}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại bệnh phù hợp
            </label>
            <select
              multiple
              name="categories"
              value={formData.categories}
              onChange={handleCategoryChange}
              required
              className="w-full p-2 border rounded"
            >
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary/80 transition-colors disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Thêm món ăn"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FoodManagement;
