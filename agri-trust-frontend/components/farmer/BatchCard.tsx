// components/farmer/BatchCard.tsx
'use client'; 

import { format } from 'date-fns';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Batch } from '@/types';
import { FiPackage } from 'react-icons/fi';

// Function to convert ipfs:// URI to a gateway URL
const ipfsGateway = "https://ipfs.io/ipfs/"; // Or use a dedicated gateway like Pinata's
function resolveIpfsUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('ipfs://')) {
        return `${ipfsGateway}${url.substring(7)}`;
    }
    // Assume it's already a regular URL or a placeholder path
    return url;
}


// Function to get status color (unchanged)
const getStatusColor = (status: Batch['status']): string => { /* ... */ };

interface BatchCardProps {
  batch: Batch;
}

const BatchCard: React.FC<BatchCardProps> = ({ batch }) => {
  const displayImageUrl = resolveIpfsUrl(batch.imageUrl); // Convert IPFS URL

  return (
    <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
      {/* Image Area - Use resolved URL */}
      <div className="h-40 bg-gray-200 flex items-center justify-center relative overflow-hidden"> {/* Added relative and overflow-hidden */}
        {displayImageUrl ? (
           <Image
                src={displayImageUrl}
                alt={batch.productName}
                fill // Use fill prop instead of layout="fill"
                // Use Tailwind classes for object-fit
                className="object-cover" // Add Tailwind class for cover behavior
                unoptimized={displayImageUrl.startsWith('http')}
                onError={(e) => { console.warn(`Failed to load image: ${displayImageUrl}`); (e.target as HTMLImageElement).style.display = 'none'; }}
            />
        ) : (
          <FiPackage className="h-16 w-16 text-gray-400" />
        )}
      </div>

      {/* Card Content (Unchanged) */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-md font-semibold text-gray-800 truncate">{batch.productName}</h3>
             {/* <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(batch.status)}`}> {batch.status} </span> */}
        </div>
        <p className="text-sm text-gray-600 mb-1">Batch ID: {batch.id}</p>
        <p className="text-sm text-gray-600 mb-3">{batch.quantity} {batch.unit}</p>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
              Registered: {batch.creationDate ? new Date(batch.creationDate).toLocaleString() : 'N/A'}
          </p>
             {/* Link to Detail Page (Added in Part 2) */}
             <Link href={`/farmer/batches/${batch.id}`} legacyBehavior>
                <a className="text-sm font-medium text-green-600 hover:text-green-800"> View Details </a>
             </Link>
        </div>
      </div>
    </div>
  );
};

export default BatchCard;