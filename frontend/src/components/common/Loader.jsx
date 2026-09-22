import React from 'react';
import { RefreshCw } from 'lucide-react';

const Loader = ({ message = 'Chargement...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      <p className="text-sm font-medium text-gray-600">{message}</p>
    </div>
  );
};

export default Loader;