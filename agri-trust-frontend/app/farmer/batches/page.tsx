// app/farmer/batches/page.tsx
import React from 'react';
import Link from 'next/link';
import BatchCard from '@/components/farmer/BatchCard';
import { Batch } from '@/types';
import { FiPlus, FiPackage } from 'react-icons/fi';

// --- FETCH DATA FROM API ---
async function getBatchesFromApi(): Promise<Batch[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/farmer/batches`, {
    cache: 'no-store', // Disable cache for now
  });

  if (!res.ok) {
    console.error("Failed to fetch batches:", res.status, await res.text());
    return []; // Return empty array on error
  }
  return res.json();
}
// --- END FETCH DATA ---


const batches = await getBatchesFromApi();

// --- SIMULATED DATA FETCHING ---
const getBatches = async (): Promise<Batch[]> => {
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate delay
  return [
    { id: 'B007', productId: 'prod_tomato', productName: 'Roma Tomatoes', quantity: 500, unit: 'KG', status: 'Registered', creationDate: new Date(Date.now() - 3600 * 1000).toISOString(), imageUrl: '/placeholder-tomato.jpg' },
    { id: 'B006', productId: 'prod_carrot', productName: 'Nantes Carrots', quantity: 200, unit: 'KG', status: 'Needs Attention', creationDate: new Date(Date.now() - 1.5 * 86400 * 1000).toISOString() },
    { id: 'B005', productId: 'prod_apple', productName: 'Gala Apples', quantity: 150, unit: 'Boxes', status: 'Certified', creationDate: new Date(Date.now() - 2 * 86400 * 1000).toISOString(), nftId: '0.0.12345/3' },
    { id: 'B004', productId: 'prod_potato', productName: 'Yukon Gold Potatoes', quantity: 1000, unit: 'KG', status: 'Listed', creationDate: new Date(Date.now() - 5 * 86400 * 1000).toISOString(), nftId: '0.0.12345/2' },
    { id: 'B003', productId: 'prod_lettuce', productName: 'Iceberg Lettuce', quantity: 300, unit: 'Heads', status: 'Sold', creationDate: new Date(Date.now() - 10 * 86400 * 1000).toISOString(), nftId: '0.0.12345/1' },
  ];
};
// --- END SIMULATED DATA ---

export default async function MyBatchesPage() {
  const batches = await getBatches();

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">My Batches</h1>
            <Link href="/farmer/register-batch" legacyBehavior>
                <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                   <FiPlus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                   Register New Batch
                </a>
            </Link>
        </div>

        {/* Add Filtering/Sorting Controls Here Later */}
        <div className="mb-4">
            {/* Placeholder for filters */}
        </div>

        {/* Batches Grid */}
        {batches.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {batches.map((batch) => (
                <BatchCard key={batch.id} batch={batch} />
            ))}
            </div>
        ) : (
             <div className="text-center py-10 bg-white rounded-lg shadow border border-gray-100">
                <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No batches registered</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by registering your first batch.</p>
                <div className="mt-6">
                     <Link href="/farmer/register-batch" legacyBehavior>
                        <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                           <FiPlus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                           Register New Batch
                        </a>
                    </Link>
                </div>
            </div>
        )}
    </div>
  );
}