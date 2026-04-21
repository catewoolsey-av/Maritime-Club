import React from 'react';

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--primary-color, #1B4D5C)' }}></div>
  </div>
);
