// components/farmer/PendingActionItem.tsx
import React from 'react';
import Link from 'next/link';
import { PendingAction } from '@/types';
import { FiAlertTriangle } from 'react-icons/fi';

interface PendingActionItemProps {
  action: PendingAction;
}

const PendingActionItem: React.FC<PendingActionItemProps> = ({ action }) => {
  const content = (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
        <div className="flex items-center">
             <FiAlertTriangle className="h-5 w-5 text-yellow-500 mr-3"/>
             <span className="text-sm text-gray-700">{action.description}</span>
        </div>
        {action.batchId && <span className="text-xs text-gray-500">Batch: {action.batchId}</span>}
    </div>
  );

  return action.actionLink ? (
    <Link href={action.actionLink} legacyBehavior><a>{content}</a></Link>
  ) : (
    content
  );
};

export default PendingActionItem;