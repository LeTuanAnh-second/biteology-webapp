
import { useState } from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/layout/Layout';
import ExpertsList from '@/components/experts/ExpertsList';
import AppointmentModal from '@/components/experts/AppointmentModal';
import { Expert } from '@/types/expert';

const ExpertConsultation = () => {
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleScheduleAppointment = (expert: Expert) => {
    setSelectedExpert(expert);
    setIsModalOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Đặt lịch tư vấn từ chuyên gia - B!teology</title>
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-slate-800 mb-4">Đặt lịch tư vấn từ chuyên gia</h1>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                Đội ngũ chuyên gia dinh dưỡng hàng đầu của B!teology sẵn sàng tư vấn và hỗ trợ bạn 
                trong hành trình cải thiện sức khỏe và chế độ dinh dưỡng.
              </p>
            </div>
            
            <ExpertsList onSchedule={handleScheduleAppointment} />
          </div>
        </div>
      </Layout>
      
      {selectedExpert && (
        <AppointmentModal 
          expert={selectedExpert}
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default ExpertConsultation;
