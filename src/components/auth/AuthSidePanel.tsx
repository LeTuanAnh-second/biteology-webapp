
import React from 'react';

const AuthSidePanel = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70 z-10"></div>
      
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80')`,
          backgroundSize: 'cover',
        }}
      ></div>
      
      {/* Content */}
      <div className="relative z-20 flex items-center justify-center p-12 w-full">
        <div className="max-w-lg">
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <span className="text-white/90 text-sm font-medium">B!teology</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Chào mừng đến với B!teology
          </h1>
          <p className="text-white/90 text-lg bg-black/20 backdrop-blur-sm p-4 rounded-lg">
            Nền tảng theo dõi sức khỏe thông minh, giúp bạn có một cuộc sống khỏe mạnh hơn mỗi ngày.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthSidePanel;
