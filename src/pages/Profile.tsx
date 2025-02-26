
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DiseaseType {
  id: number;
  name: string;
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [diseaseTypeId, setDiseaseTypeId] = useState<string>("");
  const [diseaseTypes, setDiseaseTypes] = useState<DiseaseType[]>([]);

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;

      try {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profile) {
          setFullName(profile.full_name || "");
          setPhoneNumber(profile.phone_number || "");
          setDiseaseTypeId(profile.disease_type_id?.toString() || "");
        }

        const { data: diseases, error: diseasesError } = await supabase
          .from('type_of_disease')
          .select('*');

        if (diseasesError) throw diseasesError;

        setDiseaseTypes(diseases);
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tải thông tin người dùng"
        });
      }
    }

    loadProfile();
  }, [user?.id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName,
          phone_number: phoneNumber,
          disease_type_id: diseaseTypeId ? parseInt(diseaseTypeId) : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Thông tin của bạn đã được cập nhật"
      });
      navigate('/');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật thông tin"
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Cập nhật thông tin</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên của bạn"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Số điện thoại</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Nhập số điện thoại của bạn"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diseaseType">Loại bệnh</Label>
              <Select value={diseaseTypeId} onValueChange={setDiseaseTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại bệnh" />
                </SelectTrigger>
                <SelectContent>
                  {diseaseTypes.map((disease) => (
                    <SelectItem key={disease.id} value={disease.id.toString()}>
                      {disease.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full primary-button"
            >
              {isLoading ? "Đang cập nhật..." : "Cập nhật thông tin"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Profile;
