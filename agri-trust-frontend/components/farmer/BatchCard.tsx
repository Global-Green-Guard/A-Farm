// components/farmer/BatchCard.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image'; // For optimized images
import { Batch } from '@/types';
import { FiPackage } from 'react-icons/fi'; // Placeholder icon

// Function to get status color (Tailwind classes)
const getStatusColor = (status: Batch['status']): string => {
  switch (status) {
    case 'Registered': return 'bg-blue-100 text-blue-800';
    case 'Verifying': return 'bg-yellow-100 text-yellow-800';
    case 'Certified': return 'bg-green-100 text-green-800';
    case 'Listed': return 'bg-purple-100 text-purple-800';
    case 'In Transit': return 'bg-indigo-100 text-indigo-800';
    case 'Sold': return 'bg-gray-100 text-gray-800';
    case 'Needs Attention': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

interface BatchCardProps {
  batch: Batch;
}

const BatchCard: React.FC<BatchCardProps> = ({ batch }) => {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
      {/* Optional Image Area */}
      <div className="h-32 bg-gray-200 flex items-center justify-center">
        {batch.imageUrl ? (
           <Image src={batch.imageUrl} alt={batch.productName} width={128} height={128} className="object-cover h-full w-full" />
        ) : (
          <FiPackage className="h-16 w-16 text-gray-400" />
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-md font-semibold text-gray-800 truncate">{batch.productName}</h3>
             <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(batch.status)}`}>
                {batch.status}
             </span>
        </div>

        <p className="text-sm text-gray-600 mb-1">Batch ID: {batch.id}</p>
        <p className="text-sm text-gray-600 mb-3">{batch.quantity} {batch.unit}</p>


        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
             <p className="text-xs text-gray-500">
                Registered: {new Date(batch.creationDate).toLocaleDateString()}
             </p>
             <Link href={`/farmer/batches/${batch.id}`} legacyBehavior>
                <a className="text-sm font-medium text-green-600 hover:text-green-800">
                    View Details
                </a>
             </Link>
        </div>
      </div>
    </div>
  );
};

export default BatchCard;