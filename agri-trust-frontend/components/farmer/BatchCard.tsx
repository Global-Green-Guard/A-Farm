// components/farmer/BatchCard.tsx
'use client'; // Ensures this component runs on the client

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
// Assuming Batch type from @/types might still define creationDate as Date | string
// We will treat the prop as string here as received from the Server Component
import { Batch as BatchType } from '@/types';
import { FiPackage } from 'react-icons/fi';
// Import date-fns for robust date formatting (optional but recommended)
// If not using date-fns, remove this and use new Date().toLocale... directly
import { format, parseISO } from 'date-fns';

// Function to convert ipfs:// URI to a gateway URL
const ipfsGateway = "https://ipfs.io/ipfs/"; // Public gateway
// Alternative: const ipfsGateway = "https://gateway.pinata.cloud/ipfs/";
function resolveIpfsUrl(url: string | null | undefined): string {
    // Default placeholder image in the public folder
    const defaultImage = '/placeholder.png';
    if (!url) return defaultImage;
    if (url.startsWith('ipfs://')) {
        const cid = url.substring(7);
        // Basic check if CID looks valid (alphanumeric, length > 30) - adjust as needed
        if (cid && /^[a-zA-Z0-9]{30,}$/.test(cid)) {
             return `${ipfsGateway}${cid}`;
        } else {
             console.warn(`Invalid IPFS URL detected, using placeholder: ${url}`);
             return defaultImage; // Fallback for invalid IPFS URLs
        }
    }
    // Assume it's already a regular URL (like /placeholder.png) or needs fallback
    // Basic check for common image extensions
     if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
        return url;
     }
     // Fallback for anything else that isn't recognized
     console.warn(`Unrecognized image URL format, using placeholder: ${url}`);
     return defaultImage;
}

// Function to get status color (ensure this matches your Batch type status values)
const getStatusColor = (status: BatchType['status']): string => {
  switch (status?.toLowerCase()) { // Added lowerCase for robustness
    case 'registered': return 'bg-blue-100 text-blue-800';
    case 'verifying': return 'bg-yellow-100 text-yellow-800';
    case 'certified': return 'bg-green-100 text-green-800';
    case 'listed': return 'bg-purple-100 text-purple-800';
    case 'in transit': return 'bg-indigo-100 text-indigo-800';
    case 'sold': return 'bg-gray-100 text-gray-800';
    case 'needs attention': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Define props, explicitly typing batch based on expected API data structure
// where creationDate is a string (ISO format)
interface BatchCardProps {
  batch: Omit<BatchType, 'creationDate'> & { creationDate: string };
}

const BatchCard: React.FC<BatchCardProps> = ({ batch }) => {
  // Get the potentially converted image URL
  const displayImageUrl = resolveIpfsUrl(batch.imageUrl);

  // Format the creationDate string for display
  let formattedDate = 'N/A';
  if (batch.creationDate) {
      try {
          // Parse the ISO string and format it
          const dateObj = parseISO(batch.creationDate);
          formattedDate = format(dateObj, 'PP'); // Format like 'Mar 28, 2025'
          // Alternatively: formattedDate = new Date(batch.creationDate).toLocaleDateString();
      } catch (e) {
          console.error("Failed to parse creation date:", batch.creationDate, e);
          // Keep 'N/A' or use the raw string if parsing fails
          formattedDate = batch.creationDate; // Fallback to raw string
      }
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden transition-shadow duration-200 ease-in-out hover:shadow-lg">
      {/* Image Area */}
      <div className="h-40 w-full bg-gray-200 flex items-center justify-center relative overflow-hidden">
          <Image
              src={displayImageUrl}
              alt={batch.productName || 'Batch Image'} // Provide default alt text
              fill // Use fill to cover the container
              className="object-cover" // Ensure image covers the area, not distorted
              // Consider sizes for optimization if not using fill, e.g., sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized={displayImageUrl.startsWith('http')} // Good practice for external gateway URLs
              priority={false} // Only set priority=true for above-the-fold images
              onError={(e) => {
                  console.warn(`Failed to load image: ${displayImageUrl}`);
                  // Optionally hide the broken image element
                  (e.target as HTMLImageElement).style.opacity = '0';
              }}
          />
          {/* Fallback icon container (shown if image fails/is missing and parent handles errors) */}
           {!displayImageUrl && (
              <FiPackage className="h-16 w-16 text-gray-400 absolute" />
           )}
      </div>

      {/* Card Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2 gap-2"> {/* Added gap */}
            <h3 className="text-md font-semibold text-gray-800 truncate flex-shrink mr-2" title={batch.productName}> {/* Added title for full name on hover */}
                {batch.productName}
            </h3>
             {/* Status Badge */}
             <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap ${getStatusColor(batch.status)}`}>
                 {batch.status || 'Unknown'} {/* Added fallback text */}
             </span>
        </div>
        {/* Details */}
        <p className="text-sm text-gray-600 mb-1">ID: {batch.id}</p> {/* Shortened label */}
        <p className="text-sm text-gray-600 mb-3">{batch.quantity} {batch.unit}</p>

        {/* Footer */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
              {formattedDate} {/* Display formatted date */}
          </p>
          {/* Link to Detail Page */}
          <Link href={`/farmer/batches/${batch.id}`} legacyBehavior>
            <a className="text-sm font-medium text-green-600 hover:text-green-800 transition-colors duration-150">
                View Details
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BatchCard;