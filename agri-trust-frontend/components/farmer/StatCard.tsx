// components/farmer/StatCard.tsx
'use client'; // <--- Add this directive

import React from 'react';
import { Stat } from '@/types';
// Import specific icons you need
import { FiPackage, FiCheckSquare, FiTrendingUp, FiAlertCircle, FiBox } from 'react-icons/fi';

// Helper function or mapping to get the icon component
const getIconComponent = (iconName?: string): React.ReactNode => {
  switch (iconName) {
    case 'package': return <FiPackage size={24} />;
    case 'check-square': return <FiCheckSquare size={24} />;
    case 'alert-circle': return <FiAlertCircle size={24} />;
    case 'trending-up': return <FiTrendingUp size={24} />;
    default: return <FiBox size={24} />; // Default icon
  }
};

interface StatCardProps {
  stat: Stat;
}

const StatCard: React.FC<StatCardProps> = ({ stat }) => {
  const IconComponent = getIconComponent(stat.icon); // Get the icon component based on the string

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
      <div className="flex items-center">
        {IconComponent && <div className="mr-3 text-green-600">{IconComponent}</div>} {/* Render the selected icon */}
        <div>
          <p className="text-sm font-medium text-gray-500 truncate">{stat.title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{stat.value}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
