// app/farmer/batches/[batchId]/page.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Batch } from '@/types'; // Assuming Batch type covers all fields now
import { FiExternalLink, FiPackage } from 'react-icons/fi';
import { notFound } from 'next/navigation'; // Import notFound
import BatchDetailImage from '../../../../components/farmer/BatchDetailImage';

// Helper to resolve IPFS URLs (same as in BatchCard)
const ipfsGateway = "https://ipfs.io/ipfs/";
function resolveIpfsUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('ipfs://')) { return `${ipfsGateway}${url.substring(7)}`; }
    return url;
}

// --- Fetch Data for a Single Batch ---
async function getBatchDetails(batchId: string | undefined): Promise<Batch | null> { // Allow undefined input
  console.log(`>>> getBatchDetails called with ID: ${batchId}`); // Add log here
  if (!batchId || batchId === 'undefined') { // Check upfront
      console.error(">>> getBatchDetails received invalid batchId");
      return null; // Or throw an error appropriate for this function
  }

  const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/farmer/batches/${batchId}`;
  try {
      const res = await fetch(apiUrl, { cache: 'no-store' });
      console.log(`>>> Detail Fetch Status for ${batchId}:`, res.status);

      if (res.status === 404) { return null; }
      if (!res.ok) {
          console.error(`>>> Failed to fetch batch ${batchId}:`, res.status, await res.text().catch(() => "N/A"));
          throw new Error("Failed to fetch batch data");
      }
      const data = await res.json();
      console.log(`>>> Detail Fetch Parsed Data for ${batchId}:`, data);
      return data;
  } catch (error) {
      console.error(`>>> Error in getBatchDetails for ${batchId}:`, error);
      throw error; // Re-throw
  }
}

// --- Define Page Component Props ---
interface BatchDetailPageProps {
  // Params might be missing, let's make it optional for debugging
  params?: { batchId?: string };
  // Include searchParams just in case (though unlikely relevant here)
  searchParams?: { [key: string]: string | string[] | undefined };
}

// --- Define the Page Component ---
export default async function BatchDetailPage(props: BatchDetailPageProps) { // Receive the whole props object
  console.log(">>> BatchDetailPage received props:", JSON.stringify(props, null, 2)); // Log the entire props object

  // Check if params and params.batchId exist before destructuring
  if (!props.params || typeof props.params.batchId !== 'string') {
    console.error(">>> ERROR: params or params.batchId is missing/invalid in props!", props.params);
    // You could render an error message or call notFound() here
    // For now, let's throw to see the error clearly, though notFound() is better UX
     throw new Error("Batch ID not found in page parameters.");
    // notFound();
  }

  // Now destructure safely
  const { batchId } = props.params;

  console.log(`>>> BatchDetailPage rendering for ID: ${batchId}`);

  const batch = await getBatchDetails(batchId);
  // If batch is not found (or ID was invalid), trigger Next.js 404 page
  if (!batch) {
    console.log(`>>> Batch not found for ID: ${batchId}, calling notFound()`);
    notFound();
  }

  const displayImageUrl = resolveIpfsUrl(batch.imageUrl);
  const metadataIpfsUrl = resolveIpfsUrl(batch.ipfsMetadataCid ? `ipfs://${batch.ipfsMetadataCid}` : null);
  // Construct HashScan link (adjust network if needed)
  const hashscanNftLink = batch.nftId ? `https://hashscan.io/testnet/token/${batch.nftId.split('/')[0]}?serial=${batch.nftId.split('/')[1]}` : null;


  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow border border-gray-100 space-y-6">

      {/* Header */}
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">{batch.productName}</h1>
        <p className="text-sm text-gray-500">Batch ID: {batch.id}</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Image Section */}
        <div className="md:col-span-1">
          <div className="md:col-span-1">
            <BatchDetailImage imageUrl={displayImageUrl} productName={batch.productName} />
          </div>
        </div>

        {/* Details Section */}
        <div className="md:col-span-2 space-y-4">
            <DetailItem label="Status" value={batch.status} />
            <DetailItem label="Quantity" value={`${batch.quantity} ${batch.unit}`} />
            <DetailItem label="Registered On" value={new Date(batch.creationDate).toLocaleString()} />
            <DetailItem label="Farmer Account" value={batch.farmerAccountId} />

             {/* Blockchain Info */}
             <div className="pt-4 border-t border-gray-100">
                <h3 className="text-md font-medium text-gray-700 mb-2">Blockchain Details</h3>
                {batch.nftId && hashscanNftLink && (
                    <DetailItem label="NFT ID">
                       <a href={hashscanNftLink} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 hover:underline inline-flex items-center">
                         {batch.nftId} <FiExternalLink className="ml-1 h-3 w-3"/>
                       </a>
                    </DetailItem>
                )}
                 {batch.ipfsMetadataCid && metadataIpfsUrl && (
                    <DetailItem label="Metadata">
                       <a href={metadataIpfsUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 hover:underline inline-flex items-center">
                         View on IPFS <FiExternalLink className="ml-1 h-3 w-3"/>
                       </a>
                       <span className="text-xs text-gray-400 block">(CID: {batch.ipfsMetadataCid})</span>
                    </DetailItem>
                )}
                 {batch.hcsTopicId && (
                    <DetailItem label="HCS Topic ID" value={batch.hcsTopicId} />
                 )}
                  {batch.hcsSequenceNumber && (
                    <DetailItem label="HCS Initial Sequence" value={batch.hcsSequenceNumber} />
                 )}
             </div>

             {/* TODO: Add Supply Chain Timeline Section Here Later */}
             {/* This would fetch HCS messages from a mirror node */}

        </div>
      </div>

        {/* Back Button */}
         <div className="pt-6 border-t border-gray-200 text-center">
            <Link href="/farmer/batches" legacyBehavior>
                <a className="text-sm font-medium text-green-600 hover:text-green-800">
                    ← Back to My Batches
                </a>
            </Link>
        </div>
    </div>
  );
}

// --- Helper Component for Detail Items ---
interface DetailItemProps {
    label: string;
    value?: string | number | null;
    children?: React.ReactNode; // Allow passing complex children like links
}
const DetailItem: React.FC<DetailItemProps> = ({ label, value, children }) => (
    <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {children ? (
             <div className="mt-1 text-sm text-gray-900">{children}</div>
        ) : (
             <p className="mt-1 text-sm text-gray-900">{value ?? 'N/A'}</p>
        )}
    </div>
);