import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-gray-600">Chargement...</p>
      <p className="text-xs text-gray-400 mt-2">Le serveur peut prendre du temps à répondre (plan gratuit)</p>
    </div>
  );
};

export default LoadingSpinner;