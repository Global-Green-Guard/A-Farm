// app/farmer/batches/page.tsx
import React from 'react';
import Link from 'next/link';
import BatchCard from '@/components/farmer/BatchCard';
// Ensure the Batch type definition matches the data structure, especially Date fields
// If the API sends ISO strings, the type here should reflect that for clarity.
// Let's assume the type might still define Date, so we'll handle conversion.
import { Batch as BatchType } from '@/types'; // Renaming to avoid conflict if needed
import { FiPlus, FiPackage } from 'react-icons/fi';

// Force dynamic rendering and no caching during debugging
export const dynamic = 'force-dynamic';

// --- Type Definition Clarification ---
// Define a type for the data *as received from the API* (dates as strings)
// This helps ensure we know what format the data is in after fetch/parse.
interface ApiBatchData {
  id: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unit: string;
  status: string;
  creationDate: string; // Explicitly string from API JSON
  imageUrl: string | null;
  nftId: string | null;
  hcsTopicId: string | null;
  hcsSequenceNumber: string | null; // API sends string after conversion
  ipfsMetadataCid: string | null;
  farmerAccountId: string;
}


// --- FETCH DATA FROM API ---
async function getBatchesFromApi(): Promise<ApiBatchData[]> { // Return type uses string date
  const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/farmer/batches`;
  console.log(">>> Fetching batches from:", apiUrl);

  try {
    const res = await fetch(apiUrl, {
      cache: 'no-store', // Disable fetch cache
    });

    console.log(">>> API Response Status:", res.status);

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Could not read error response body");
      console.error(">>> Failed to fetch batches:", res.status, errorText);
      return [];
    }

    const rawText = await res.text();
    console.log(">>> Raw API Response Text:", rawText);

    if (!rawText) {
        console.warn(">>> Received empty response body from API.");
        return [];
    }

    // JSON.parse will create objects with string dates, matching ApiBatchData
    const data = JSON.parse(rawText);
    console.log(">>> Parsed API Data:", data);

    if (!Array.isArray(data)) {
        console.error(">>> Parsed API data is not an array:", data);
        return [];
    }

    // We can optionally validate each object here if needed before casting
    return data as ApiBatchData[]; // Cast to our specific type

  } catch (error) {
    console.error(">>> Error during fetch or JSON parsing in getBatchesFromApi:", error);
    return [];
  }
}
// --- END FETCH DATA FROM API ---


// --- Define the Page Component (Server Component) ---
export default async function MyBatchesPage() {
  const batches: ApiBatchData[] = await getBatchesFromApi(); // Data has dates as strings

  console.log(">>> Batches received in page component (count):", batches.length);

  // Type check (redundant if getBatchesFromApi guarantees array, but safe)
  if (!Array.isArray(batches)) {
     console.error(">>> Data received by page component is NOT an array!", batches);
     return <div className="p-6 text-red-600">Error: Invalid data format received.</div>;
  }

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

        {/* Placeholder for filters */}
        <div className="mb-4"></div>

        {/* Batches Grid */}
        {batches.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Map over the data (which has dates as strings) */}
            {batches.map((batch) => {
                if (!batch || !batch.id) {
                     console.warn(">>> Skipping invalid batch object:", batch);
                     return null;
                }
                 // Directly pass the batch object (with string date) to the Client Component
                 // The 'Only plain objects' error check happens on this prop boundary.
                 // Since `batch` comes from JSON.parse, it should be plain.
                 console.log(`>>> Rendering BatchCard for: ${batch.id} with creationDate type: ${typeof batch.creationDate}`);
                return <BatchCard key={batch.id} batch={batch} />; // Pass the ApiBatchData object
            })}
            </div>
        ) : (
             <div className="text-center py-10 bg-white rounded-lg shadow border border-gray-100">
                <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Batches Found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by registering your first batch, or check back later.</p>
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
// --- END Page Component ---
