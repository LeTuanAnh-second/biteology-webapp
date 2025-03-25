
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
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
  );
};

export default HeroSection;
