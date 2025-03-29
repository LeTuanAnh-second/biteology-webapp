
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Expert } from "@/types/expert";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface AppointmentModalProps {
  expert: Expert;
  isOpen: boolean;
  onClose: () => void;
}

const timeSlots = [
  "09:00", "10:00", "11:00", 
  "14:00", "15:00", "16:00", "17:00"
];

const AppointmentModal = ({ expert, isOpen, onClose }: AppointmentModalProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!date || !time) {
      toast({
        variant: "destructive",
        title: "Thông tin chưa đầy đủ",
        description: "Vui lòng chọn ngày và giờ cho cuộc hẹn",
      });
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Bạn cần đăng nhập",
        description: "Vui lòng đăng nhập để đặt lịch tư vấn",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Format the appointment details
      const appointmentDate = format(date, "dd/MM/yyyy", { locale: vi });
      const appointmentDetails = {
        expertId: expert.id,
        expertName: expert.name,
        expertEmail: expert.email,
        date: appointmentDate,
        time,
        reason: reason.trim() || "Tư vấn dinh dưỡng"
      };

      // Call the Supabase Edge Function to send the email
      const { data, error } = await supabase.functions.invoke("send-appointment-email", {
        body: appointmentDetails
      });

      if (error) {
        console.error("Error invoking edge function:", error);
        throw new Error(`Lỗi khi gửi thông tin đặt lịch: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error("Không thể gửi thông tin đặt lịch, vui lòng thử lại sau.");
      }

      toast({
        title: "Đặt lịch thành công!",
        description: `Lịch hẹn của bạn với ${expert.name} vào ngày ${appointmentDate} lúc ${time} đã được gửi. Chuyên gia sẽ xác nhận qua email.`,
      });

      onClose();
      setDate(undefined);
      setTime(null);
      setReason("");
    } catch (error) {
      console.error("Error sending appointment:", error);
      toast({
        variant: "destructive",
        title: "Đặt lịch thất bại",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại sau.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    // 0 is Sunday, 6 is Saturday
    return day === 0 || day === 6;
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Đặt lịch hẹn với {expert.name}</DialogTitle>
          <DialogDescription>
            Chuyên gia {expert.specialization} với nhiều năm kinh nghiệm
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Chọn ngày</h3>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) => isWeekend(date) || isPastDate(date)}
              className="border rounded-md pointer-events-auto"
              initialFocus
            />
          </div>

          {date && (
            <>
              <div>
                <h3 className="text-sm font-medium mb-2">Chọn giờ</h3>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      variant={time === slot ? "default" : "outline"}
                      onClick={() => setTime(slot)}
                      className="text-sm"
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Lý do tư vấn (không bắt buộc)</h3>
                <textarea
                  className="w-full border rounded-md p-2 h-20 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Mô tả ngắn gọn về vấn đề bạn muốn tư vấn..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!date || !time || isSubmitting}
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận đặt lịch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentModal;
