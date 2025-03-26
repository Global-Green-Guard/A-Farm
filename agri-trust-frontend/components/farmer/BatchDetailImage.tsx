// components/farmer/BatchDetailImage.tsx
'use client'; // Mark as a Client Component

import React from 'react';
import Image from 'next/image';
import { FiPackage } from 'react-icons/fi';

interface BatchDetailImageProps {
    imageUrl: string | null;
    productName: string;
}

const BatchDetailImage: React.FC<BatchDetailImageProps> = ({ imageUrl, productName }) => {
    return (
        <div className="aspect-square bg-gray-100 rounded overflow-hidden flex items-center justify-center relative">
            {imageUrl ? (
                <Image
                    src={imageUrl}
                    alt={productName}
                    fill
                    className="object-contain"
                    unoptimized={imageUrl.startsWith('http')}
                    onError={(e) => {
                        console.warn(`Failed to load image: ${imageUrl}. Hiding image element.`);
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
            ) : (
                <FiPackage className="h-24 w-24 text-gray-400" />
            )}
        </div>
    );
};

export default BatchDetailImage;