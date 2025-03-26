// components/farmer/StatCard.tsx
import React from 'react';
import { Stat } from '@/types'; // Import the Stat type

interface StatCardProps {
  stat: Stat;
}

const StatCard: React.FC<StatCardProps> = ({ stat }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
      <div className="flex items-center">
        {stat.icon && <div className="mr-3 text-green-600">{stat.icon}</div>}
        <div>
          <p className="text-sm font-medium text-gray-500 truncate">{stat.title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{stat.value}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;