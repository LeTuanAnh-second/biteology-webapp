
import { useState } from "react";
import { ArrowLeft, AlertCircle, Plus, Activity, LineChart, Ruler } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface HealthMetrics {
  weight?: number;
  height?: number;
  bloodSugar?: number;
  systolic?: number;
  diastolic?: number;
}

const HealthTracking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showWeightDialog, setShowWeightDialog] = useState(false);
  const [showBloodSugarDialog, setShowBloodSugarDialog] = useState(false);
  const [showHeightDialog, setShowHeightDialog] = useState(false);
  const [showBloodPressureDialog, setShowBloodPressureDialog] = useState(false);
  const [metrics, setMetrics] = useState<HealthMetrics>({});
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSaveWeight = (value: number) => {
    setMetrics(prev => ({ ...prev, weight: value }));
    setShowWeightDialog(false);
    toast({
      title: "Đã lưu cân nặng",
      description: `${value} kg đã được lưu vào hồ sơ của bạn.`
    });
  };

  const handleSaveHeight = (value: number) => {
    setMetrics(prev => ({ ...prev, height: value }));
    setShowHeightDialog(false);
    toast({
      title: "Đã lưu chiều cao",
      description: `${value} cm đã được lưu vào hồ sơ của bạn.`
    });
  };

  const handleSaveBloodSugar = (value: number) => {
    setMetrics(prev => ({ ...prev, bloodSugar: value }));
    setShowBloodSugarDialog(false);
    toast({
      title: "Đã lưu chỉ số đường huyết",
      description: `${value} mg/dL đã được lưu vào hồ sơ của bạn.`
    });
  };

  const handleSaveBloodPressure = (systolic: number, diastolic: number) => {
    setMetrics(prev => ({ ...prev, systolic, diastolic }));
    setShowBloodPressureDialog(false);
    toast({
      title: "Đã lưu huyết áp",
      description: `${systolic}/${diastolic} mmHg đã được lưu vào hồ sơ của bạn.`
    });
  };

  const analyzeHealthMetrics = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Bạn cần đăng nhập để sử dụng tính năng này."
      });
      return;
    }

    setIsAnalyzing(true);
    setShowAnalysisDialog(true);
    
    try {
      // Construct a comprehensive message for the AI
      let message = `Phân tích chỉ số sức khỏe của tôi: `;
      
      if (metrics.height) message += `Chiều cao: ${metrics.height} cm. `;
      if (metrics.weight) message += `Cân nặng: ${metrics.weight} kg. `;
      if (metrics.bloodSugar) message += `Đường huyết: ${metrics.bloodSugar} mg/dL. `;
      if (metrics.systolic && metrics.diastolic) {
        message += `Huyết áp: ${metrics.systolic}/${metrics.diastolic} mmHg. `;
      }
      
      message += `Hãy tính BMI (nếu có chiều cao và cân nặng) và đánh giá các chỉ số của tôi. Nếu có chỉ số bất thường, hãy cung cấp lời khuyên để cải thiện.`;

      // Call nutrition-ai-chat function
      const response = await supabase.functions.invoke('nutrition-ai-chat', {
        body: { 
          message,
          userId: user.id 
        }
      });
      
      if (response.error) throw new Error(response.error.message);
      
      setAnalysis(response.data.answer || "Không thể phân tích chỉ số sức khỏe lúc này.");
    } catch (error) {
      console.error("Error analyzing metrics:", error);
      setAnalysis("Xin lỗi, đã xảy ra lỗi khi phân tích chỉ số sức khỏe. Vui lòng thử lại sau.");
    } finally {
      setIsAnalyzing(false);
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
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <Activity className="h-5 w-5 text-green-600" />
          <p className="text-green-600">Theo dõi và phân tích chỉ số sức khỏe của bạn</p>
        </div>

        <h1 className="text-3xl font-bold mb-6">Theo dõi chỉ số sức khỏe</h1>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 rounded-lg border bg-card">
            <div className="flex items-center mb-4">
              <LineChart className="h-6 w-6 mr-2 text-primary" />
              <h2 className="text-xl font-semibold">Cân nặng</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              {metrics.weight 
                ? `Chỉ số hiện tại: ${metrics.weight} kg` 
                : "Ghi lại và theo dõi cân nặng của bạn theo thời gian."}
            </p>
            <Button onClick={() => setShowWeightDialog(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Thêm chỉ số
            </Button>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <div className="flex items-center mb-4">
              <Ruler className="h-6 w-6 mr-2 text-primary" />
              <h2 className="text-xl font-semibold">Chiều cao</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              {metrics.height 
                ? `Chỉ số hiện tại: ${metrics.height} cm` 
                : "Ghi lại chiều cao của bạn để tính toán chỉ số BMI."}
            </p>
            <Button onClick={() => setShowHeightDialog(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Thêm chỉ số
            </Button>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <div className="flex items-center mb-4">
              <Activity className="h-6 w-6 mr-2 text-primary" />
              <h2 className="text-xl font-semibold">Đường huyết</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              {metrics.bloodSugar 
                ? `Chỉ số hiện tại: ${metrics.bloodSugar} mg/dL` 
                : "Ghi lại và theo dõi chỉ số đường huyết của bạn."}
            </p>
            <Button onClick={() => setShowBloodSugarDialog(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Thêm chỉ số
            </Button>
          </div>
          
          <div className="p-6 rounded-lg border bg-card">
            <div className="flex items-center mb-4">
              <Activity className="h-6 w-6 mr-2 text-primary" />
              <h2 className="text-xl font-semibold">Huyết áp</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              {metrics.systolic && metrics.diastolic 
                ? `Chỉ số hiện tại: ${metrics.systolic}/${metrics.diastolic} mmHg` 
                : "Ghi lại và theo dõi huyết áp của bạn."}
            </p>
            <Button onClick={() => setShowBloodPressureDialog(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Thêm chỉ số
            </Button>
          </div>
        </div>

        {(metrics.weight || metrics.height || metrics.bloodSugar || metrics.systolic) && (
          <div className="mt-8">
            <Button 
              onClick={analyzeHealthMetrics} 
              className="w-full md:w-auto bg-primary text-white hover:bg-primary/90 py-6 text-lg"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? "Đang phân tích..." : "Phân tích chỉ số sức khỏe"}
            </Button>
          </div>
        )}

        {/* Weight Dialog */}
        <WeightDialog 
          open={showWeightDialog} 
          onClose={() => setShowWeightDialog(false)} 
          onSave={handleSaveWeight} 
        />

        {/* Height Dialog */}
        <HeightDialog 
          open={showHeightDialog} 
          onClose={() => setShowHeightDialog(false)} 
          onSave={handleSaveHeight} 
        />

        {/* Blood Sugar Dialog */}
        <BloodSugarDialog 
          open={showBloodSugarDialog} 
          onClose={() => setShowBloodSugarDialog(false)} 
          onSave={handleSaveBloodSugar} 
        />

        {/* Blood Pressure Dialog */}
        <BloodPressureDialog 
          open={showBloodPressureDialog} 
          onClose={() => setShowBloodPressureDialog(false)} 
          onSave={handleSaveBloodPressure} 
        />

        {/* Analysis Dialog */}
        <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Phân tích chỉ số sức khỏe</DialogTitle>
              <DialogDescription>
                Kết quả phân tích dựa trên các chỉ số bạn đã cung cấp.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Activity className="h-10 w-10 animate-pulse text-primary mb-4" />
                  <p>Đang phân tích chỉ số sức khỏe...</p>
                </div>
              ) : (
                <div className="text-sm whitespace-pre-line py-4">
                  {analysis}
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Đóng</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

interface WeightDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (weight: number) => void;
}

const WeightDialog = ({ open, onClose, onSave }: WeightDialogProps) => {
  const [weight, setWeight] = useState<string>("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weightValue = parseFloat(weight);
    if (!isNaN(weightValue) && weightValue > 0) {
      onSave(weightValue);
      setWeight("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm chỉ số cân nặng</DialogTitle>
          <DialogDescription>
            Nhập cân nặng hiện tại của bạn (kg).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="weight" className="col-span-1 text-right">
                Cân nặng
              </label>
              <div className="col-span-3 flex">
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="VD: 60.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="flex-1"
                />
                <span className="ml-2 flex items-center">kg</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={!weight}>
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface HeightDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (height: number) => void;
}

const HeightDialog = ({ open, onClose, onSave }: HeightDialogProps) => {
  const [height, setHeight] = useState<string>("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const heightValue = parseFloat(height);
    if (!isNaN(heightValue) && heightValue > 0) {
      onSave(heightValue);
      setHeight("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm chỉ số chiều cao</DialogTitle>
          <DialogDescription>
            Nhập chiều cao của bạn (cm).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="height" className="col-span-1 text-right">
                Chiều cao
              </label>
              <div className="col-span-3 flex">
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="VD: 170"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="flex-1"
                />
                <span className="ml-2 flex items-center">cm</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={!height}>
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface BloodSugarDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (bloodSugar: number) => void;
}

const BloodSugarDialog = ({ open, onClose, onSave }: BloodSugarDialogProps) => {
  const [bloodSugar, setBloodSugar] = useState<string>("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bloodSugarValue = parseFloat(bloodSugar);
    if (!isNaN(bloodSugarValue) && bloodSugarValue > 0) {
      onSave(bloodSugarValue);
      setBloodSugar("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm chỉ số đường huyết</DialogTitle>
          <DialogDescription>
            Nhập chỉ số đường huyết hiện tại của bạn (mg/dL).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="bloodSugar" className="col-span-1 text-right">
                Đường huyết
              </label>
              <div className="col-span-3 flex">
                <Input
                  id="bloodSugar"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="VD: 100"
                  value={bloodSugar}
                  onChange={(e) => setBloodSugar(e.target.value)}
                  className="flex-1"
                />
                <span className="ml-2 flex items-center">mg/dL</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={!bloodSugar}>
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface BloodPressureDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (systolic: number, diastolic: number) => void;
}

const BloodPressureDialog = ({ open, onClose, onSave }: BloodPressureDialogProps) => {
  const [systolic, setSystolic] = useState<string>("");
  const [diastolic, setDiastolic] = useState<string>("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const systolicValue = parseInt(systolic);
    const diastolicValue = parseInt(diastolic);
    if (!isNaN(systolicValue) && !isNaN(diastolicValue) && systolicValue > 0 && diastolicValue > 0) {
      onSave(systolicValue, diastolicValue);
      setSystolic("");
      setDiastolic("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm chỉ số huyết áp</DialogTitle>
          <DialogDescription>
            Nhập chỉ số huyết áp hiện tại của bạn (mmHg).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="systolic" className="col-span-1 text-right">
                Tâm thu
              </label>
              <div className="col-span-3 flex">
                <Input
                  id="systolic"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="VD: 120"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="flex-1"
                />
                <span className="ml-2 flex items-center">mmHg</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="diastolic" className="col-span-1 text-right">
                Tâm trương
              </label>
              <div className="col-span-3 flex">
                <Input
                  id="diastolic"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="VD: 80"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="flex-1"
                />
                <span className="ml-2 flex items-center">mmHg</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={!systolic || !diastolic}>
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HealthTracking;
