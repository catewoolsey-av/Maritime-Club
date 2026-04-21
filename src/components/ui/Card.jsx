import React from 'react';

export const Card = ({ children, className = '', padding = true, ...props }) => (
  <div
    className={`bg-white rounded-xl shadow-sm border border-gray-100 ${padding ? 'p-6' : ''} ${className}`}
    {...props}
  >
    {children}
  </div>
);
