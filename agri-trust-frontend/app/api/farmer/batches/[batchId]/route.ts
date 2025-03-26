// app/api/farmer/batches/[batchId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Remove the Params interface if it's not used elsewhere
// interface Params { ... }

// GET handler for /api/farmer/batches/[batchId]
export async function GET(
    request: NextRequest,
    // Access params via the context object (second argument)
    context: { params: { batchId: string } }
) {
  // Get batchId from the context object
  const batchId = context.params.batchId;
  console.log(`>>> API fetching details for batchId: ${batchId}`); // Add log

  // TODO: Implement authentication and check if the batch belongs to the logged-in farmer

  if (!batchId || batchId === 'undefined') { // Check for 'undefined' string too
    console.error(">>> API received invalid batchId:", batchId);
    return NextResponse.json({ error: 'Valid Batch ID is required' }, { status: 400 });
  }

  try {
    const batch = await prisma.batch.findUnique({
      where: {
        id: batchId,
        // TODO: Add farmerAccountId filter based on authentication
      },
    });

    if (!batch) {
      console.log(`>>> API Batch not found for ID: ${batchId}`);
      return NextResponse.json({ error: 'Batch not found or access denied' }, { status: 404 });
    }
    console.log(`>>> API Found batch: ${batch.id}`);

    // Convert BigInt and Date for JSON response
    const responseBatch = {
        ...batch,
        hcsSequenceNumber: batch.hcsSequenceNumber?.toString(),
        creationDate: batch.creationDate.toISOString(),
    };

    return NextResponse.json(responseBatch);

  } catch (error) {
    console.error(`>>> API Error fetching batch ${batchId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch batch details' }, { status: 500 });
  }
}