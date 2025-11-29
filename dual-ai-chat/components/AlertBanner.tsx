import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface AlertBannerProps {
  message: string | null;
  isVisible: boolean;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ message, isVisible }) => {
  if (!message || !isVisible) return null;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl shadow-xl flex items-center text-sm z-50 max-w-lg text-center backdrop-blur-md bg-opacity-95">
      <AlertTriangle size={20} className="mr-3 shrink-0 text-red-600" /> 
      <span>{message}</span>
    </div>
  );
};

export default AlertBanner;