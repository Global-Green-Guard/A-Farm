// components/farmer/ActivityItem.tsx
import React from 'react';
import { Activity } from '@/types';
import { formatDistanceToNow } from 'date-fns'; // For relative time

interface ActivityItemProps {
  activity: Activity;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
      <span className="text-sm text-gray-700">{activity.description}</span>
      <span className="text-xs text-gray-500">
        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
      </span>
    </div>
  );
};

export default ActivityItem;