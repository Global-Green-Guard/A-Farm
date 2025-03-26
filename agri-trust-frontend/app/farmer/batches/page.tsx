// app/farmer/batches/page.tsx
import React from 'react';
import Link from 'next/link';
import BatchCard from '@/components/farmer/BatchCard';
import { Batch } from '@/types';
import { FiPlus, FiPackage } from 'react-icons/fi';

// Force dynamic rendering to ensure no caching during debugging
export const dynamic = 'force-dynamic';

// --- FETCH DATA FROM API ---
async function getBatchesFromApi(): Promise<Batch[]> {
  const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/farmer/batches`;
  console.log(">>> Fetching batches from:", apiUrl); // Log URL

  try {
    const res = await fetch(apiUrl, {
      cache: 'no-store', // Explicitly disable fetch cache
    });

    console.log(">>> API Response Status:", res.status); // Log Status

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Could not read error response body"); // Get raw error text safely
      console.error(">>> Failed to fetch batches:", res.status, errorText);
      return []; // Return empty array on error
    }

    // Try parsing the JSON response
    const rawText = await res.text(); // Get raw response text first
    console.log(">>> Raw API Response Text:", rawText); // Log Raw Text

    // Check if rawText is empty before parsing
    if (!rawText) {
        console.warn(">>> Received empty response body from API.");
        return [];
    }

    const data = JSON.parse(rawText); // Manually parse
    console.log(">>> Parsed API Data:", data); // Log Parsed Data

    // Ensure the data is an array before returning
    if (!Array.isArray(data)) {
        console.error(">>> Parsed API data is not an array:", data);
        return [];
    }

    return data; // Return the parsed data

  } catch (error) {
    console.error(">>> Error during fetch or JSON parsing in getBatchesFromApi:", error);
    return []; // Return empty array on any fetch/parse error
  }
}
// --- END FETCH DATA FROM API ---

// --- REMOVE THE OLD SIMULATED getBatches FUNCTION ---
// const getBatches = async (): Promise<Batch[]> => { ... }; // DELETE THIS ENTIRE FUNCTION


// --- Define the Page Component ---
export default async function MyBatchesPage() {
  // Call the CORRECT function to fetch from the API
  const batches = await getBatchesFromApi();

  console.log(">>> Batches received in page component:", batches); // Log batches array

  // Add a type check for the received data
  if (!Array.isArray(batches)) {
     console.error(">>> Data received by page component is NOT an array!", batches);
     // Optionally render an error message to the user
     return <div className="p-6 text-red-600">Error: Invalid data format received from the server.</div>;
  }
   console.log(">>> Number of batches received:", batches.length);

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
            {batches.map((batch) => {
                // Add a check for batch validity if needed, though type safety helps
                if (!batch || !batch.id) {
                     console.warn(">>> Skipping invalid batch object:", batch);
                     return null; // Skip rendering if batch object is invalid
                }
                console.log(">>> Rendering BatchCard for:", batch.id); // Log each batch being mapped
                return <BatchCard key={batch.id} batch={batch} />;
            })}
            </div>
        ) : (
             <div className="text-center py-10 bg-white rounded-lg shadow border border-gray-100">
                <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Batches Found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by registering your first batch, or check back later.</p> {/* Updated text */}
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