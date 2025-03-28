
import React from 'react';

const AuthSidePanel = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
      <div className="max-w-lg">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Chào mừng đến với B!teology
        </h1>
        <p className="text-white/90 text-lg">
          Nền tảng theo dõi sức khỏe thông minh, giúp bạn có một cuộc sống khỏe mạnh hơn mỗi ngày.
        </p>
      </div>
    </div>
  );
};

export default AuthSidePanel;
