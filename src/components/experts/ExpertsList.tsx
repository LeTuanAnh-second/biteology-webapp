
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Mail, User } from "lucide-react";
import { Expert } from "@/types/expert";

interface ExpertsListProps {
  onSchedule: (expert: Expert) => void;
}

const experts: Expert[] = [
  {
    id: 1,
    name: "Lê Anh",
    age: 40,
    email: "anhltse170584@fpt.edu.vn",
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
    specialization: "Dinh dưỡng thể thao",
    experience: "15 năm kinh nghiệm trong lĩnh vực dinh dưỡng và sức khỏe. Từng làm việc tại Bệnh viện Bạch Mai và là cố vấn dinh dưỡng cho nhiều vận động viên Olympic.",
    bio: "Tiến sĩ Lê Anh là chuyên gia dinh dưỡng hàng đầu tại Việt Nam với chuyên môn sâu về dinh dưỡng thể thao và y học thể thao. Ông đã xuất bản nhiều nghiên cứu khoa học về mối liên hệ giữa dinh dưỡng và hiệu suất thể thao."
  },
  {
    id: 2,
    name: "Nguyễn Duy Hoàng",
    age: 33,
    email: "manhlon18@gmail.com",
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
    specialization: "Dinh dưỡng lâm sàng",
    experience: "10 năm kinh nghiệm trong lĩnh vực dinh dưỡng lâm sàng và dinh dưỡng điều trị. Giảng viên tại Đại học Y Hà Nội và cố vấn cho nhiều bệnh viện lớn.",
    bio: "Thạc sĩ Nguyễn Duy Hoàng chuyên về dinh dưỡng lâm sàng và các bệnh liên quan đến chuyển hóa. Anh đã giúp hàng nghìn bệnh nhân cải thiện sức khỏe thông qua phương pháp điều trị bằng dinh dưỡng và thay đổi lối sống."
  }
];

const ExpertsList = ({ onSchedule }: ExpertsListProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      {experts.map((expert) => (
        <Card key={expert.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3">
                <img 
                  src={expert.avatar} 
                  alt={expert.name} 
                  className="w-full h-full object-cover aspect-square"
                />
              </div>
              <div className="md:w-2/3 p-6">
                <h3 className="text-xl font-semibold mb-1">{expert.name}</h3>
                <p className="text-green-600 font-medium mb-3">Chuyên gia {expert.specialization}</p>
                
                <div className="space-y-2 mb-4 text-sm text-slate-700">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-slate-400" />
                    <span>{expert.age} tuổi</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-slate-400" />
                    <span>{expert.email}</span>
                  </div>
                </div>
                
                <p className="text-slate-600 text-sm mb-4 line-clamp-2">{expert.experience}</p>
                
                <Button 
                  onClick={() => onSchedule(expert)} 
                  className="w-full flex items-center justify-center"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Đặt lịch hẹn
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ExpertsList;
