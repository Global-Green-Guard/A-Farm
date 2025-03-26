// app/api/farmer/batches/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client'; // Import Prisma namespace
import prisma from '@/lib/prisma'; // Import the Prisma client instance
import { Batch } from '@/types';
import { revalidateTag } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import {
    getHederaClient,
    getPlatformAccountId,
    getPlatformPrivateKey,
    getHcsTopicId,
    getNftTokenId
} from '@/lib/hedera';
import {
    TopicMessageSubmitTransaction,
    TokenMintTransaction,
    AccountId,
    NftId,
    TransferTransaction
} from '@hashgraph/sdk';



// --- GET Handler ---
export async function GET(request: Request) {
    // TODO: Implement Authentication and get farmerId
    const farmerId = "0.0.5768282"; // Replace with authenticated farmer ID later

    try {
        const batches = await prisma.batch.findMany({
            where: {
                farmerAccountId: farmerId, // Filter by farmer
            },
            orderBy: {
                creationDate: 'desc', // Show newest first
            },
        });

        // Convert BigInt to string for JSON serialization if needed (Prisma might handle this)
        // Or handle on the frontend if necessary
        const serializedBatches = batches.map(batch => ({
            ...batch,
            hcsSequenceNumber: batch.hcsSequenceNumber?.toString(), // Convert BigInt to string
        }));


        return NextResponse.json(serializedBatches);
    } catch (error) {
        console.error("Error fetching batches from DB:", error);
        return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
    }
}

// --- POST Handler (Batch Registration) ---
export async function POST(request: NextRequest) {
    // TODO: Implement Authentication and get farmerId/farmerAccountIdString
    const farmerAccountIdString = "0.0.5768282"; // Use authenticated ID later

    let client; // Hedera client
    try {
        const body = await request.json();

        // --- Basic Input Validation ---
        if (!body.productName || !body.quantity || !body.unit) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const batchId = `B-${uuidv4().slice(0, 8).toUpperCase()}`;
        const creationDate = new Date(); // Use Date object

        // --- Hedera Client & Transactions ---
        client = getHederaClient();
        const platformAccountId = getPlatformAccountId();
        const platformPrivateKey = getPlatformPrivateKey();
        const hcsTopicId = getHcsTopicId();
        console.log(">>> Using HCS Topic ID:", hcsTopicId.toString()); // DEBUG LOG
        const nftTokenId = getNftTokenId();
        console.log(">>> Using NFT Token ID:", nftTokenId.toString()); // DEBUG LOG

        // --- 1. Submit Batch Creation Event to HCS ---
        // ... (HCS message creation - ensure timestamp is ISO string or handle conversion) ...
        const hcsMessage = JSON.stringify({ /* ... HCS payload ... */ timestamp: creationDate.toISOString() });
        const hcsSubmitTx = await new TopicMessageSubmitTransaction({
            topicId: hcsTopicId, // <-- Make sure this variable is used here
            message: hcsMessage,
        }).freezeWith(client).sign(platformPrivateKey);

        const hcsSubmitRx = await hcsSubmitTx.execute(client);
        const hcsReceipt = await hcsSubmitRx.getReceipt(client);
        const hcsSequenceNumber = hcsReceipt.topicSequenceNumber; // This is BigInt | null
        console.log(`HCS Message Submitted: Sequence Number ${hcsSequenceNumber}`);

        // --- Prepare Off-Chain Metadata JSON ---
        const offChainMetadata = { /* ... define metadata object ... */ };
        // TODO: Upload JSON to IPFS
        const offChainIpfsCid = "bafkrei...placeholder_json_cid"; // Placeholder JSON CID

        // --- Create MINIMAL On-Chain Metadata ---
        const nftMetadata = Buffer.from(`ipfs://${offChainIpfsCid}`);
        console.log("NFT Metadata Buffer Length:", nftMetadata.length);

        // --- 2. Mint the Batch NFT ---
        const mintTx = await new TokenMintTransaction({ tokenId: nftTokenId, metadata: [nftMetadata] }).freezeWith(client).sign(platformPrivateKey);
        const mintRx = await mintTx.execute(client);
        const mintReceipt = await mintRx.getReceipt(client);
        const serialNumber = mintReceipt.serials[0]; // This is Long/BigInt compatible
        const nftIdString = `${nftTokenId.toString()}/${serialNumber.toString()}`;
        console.log(`NFT Minted: Token ID ${nftTokenId.toString()}, Serial Number ${serialNumber}`);

        // --- (Skipping Self-Transfer Block as per previous step) ---
        // --- 4. Store results in Database using Prisma ---
        // Get the sequence number from the receipt (this is Long | null)
        const hcsSequenceNumberLong = hcsReceipt.topicSequenceNumber;

        // Convert Long | null to BigInt | null for Prisma
        const hcsSequenceNumberForDb: bigint | null = hcsSequenceNumberLong !== null
            ? BigInt(hcsSequenceNumberLong.toString()) // Convert Long -> String -> BigInt
            : null;                                      // Handle null case

        const createdBatch = await prisma.batch.create({
            data: {
                // id is generated by cuid() default
                productName: body.productName,
                quantity: parseInt(body.quantity, 10), // Ensure number
                unit: body.unit,
                status: 'Registered', // Initial status
                creationDate: creationDate, // Store the Date object
                imageUrl: `/placeholder-${body.productName.toLowerCase()}.jpg`, // Example placeholder
                nftId: nftIdString,
                hcsTopicId: hcsTopicId.toString(),
                // Use the converted BigInt value
                hcsSequenceNumber: hcsSequenceNumberForDb,
                ipfsMetadataCid: offChainIpfsCid,
                farmerAccountId: farmerAccountIdString,  // Store farmer ID
                // productId: body.productId, // Add if available
            }
        });

        console.log("Batch data saved to DB:", createdBatch.id);

        // --- Invalidate Cache for the Batches Page ---
        revalidatePath('/farmer/batches'); // <--- ADD THIS LINE
        console.log("Cache revalidated for /farmer/batches");

        // Convert BigInt and Date for response
        const responseBatch = {
            ...createdBatch,
            hcsSequenceNumber: createdBatch.hcsSequenceNumber?.toString(),
            creationDate: createdBatch.creationDate.toISOString(), // Ensure ISO string
        };

        // --- 5. Return Success Response ---
        return NextResponse.json(responseBatch, { status: 201 });

    } catch (error: any) {
        console.error("Batch Registration Failed:", error);
        // ---> Check for Prisma-specific errors <---
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             if (error.code === 'P2002') { // Unique constraint failed
                console.error("Prisma Unique constraint violation:", error.meta);
                return NextResponse.json({ error: `Database unique constraint failed (e.g., duplicate NFT ID?).`, details: error.meta }, { status: 409 }); // Conflict
             }
             // Add other specific Prisma error codes if needed
        }
        // ---> Fallback for Hedera or other errors <---
        let errorMessage = 'Batch registration failed.';
        // ... (keep existing Hedera error message checks) ...
        return NextResponse.json({ error: errorMessage, details: error.message || error }, { status: 500 });
    } finally {
         client?.close(); // Close Hedera client
         // Prisma client managed by singleton, no need to close here
    }
}