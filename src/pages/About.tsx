
import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/about/HeroSection";
import IntroductionSection from "@/components/about/IntroductionSection";
import PainPointsSection from "@/components/about/PainPointsSection";
import MissionSection from "@/components/about/MissionSection";
import CompetitiveAdvantagesSection from "@/components/about/CompetitiveAdvantagesSection";
import MarketNeedSection from "@/components/about/MarketNeedSection";
import WhyChooseUsSection from "@/components/about/WhyChooseUsSection";
import TeamSection from "@/components/about/TeamSection";
import CTASection from "@/components/about/CTASection";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <IntroductionSection />
        <PainPointsSection />
        <MissionSection />
        <CompetitiveAdvantagesSection />
        <MarketNeedSection />
        <WhyChooseUsSection />
        <TeamSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default About;
