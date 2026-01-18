import React from "react";

const FullScreenSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-white/60 backdrop-blur-sm flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default FullScreenSpinner;
