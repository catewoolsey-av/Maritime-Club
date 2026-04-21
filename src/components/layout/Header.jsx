import React from 'react';
import { Menu, ChevronLeft } from 'lucide-react';

export const Header = ({ title, subtitle, setIsOpen, onBack }) => (
  <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={() => setIsOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
          <Menu size={20} />
        </button>
        {onBack && (
          <button onClick={onBack} className="hidden lg:flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
            <ChevronLeft size={16} />
            Back
          </button>
        )}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  </header>
);
