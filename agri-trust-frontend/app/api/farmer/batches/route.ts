// app/api/farmer/batches/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { IncomingForm, File, Fields, Files } from 'formidable'; // Import formidable types
import fs from 'fs'; // Import Node.js fs module
import pinataSDK from '@pinata/sdk'; // Import Pinata SDK
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
    // TransferTransaction // Not currently used
} from '@hashgraph/sdk';
import { Readable } from 'stream'; // Import Readable stream type

// --- Initialize Pinata ---
const pinataApiKey = process.env.PINATA_API_KEY;
const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;
if (!pinataApiKey || !pinataSecretApiKey) {
    console.warn("Pinata API Keys not found in environment variables. IPFS upload will fail.");
}
const pinata = pinataApiKey && pinataSecretApiKey ? new pinataSDK(pinataApiKey, pinataSecretApiKey) : null;

// --- Helper to parse Form Data ---
// Note: This uses formidable v3 syntax. Adjust if using v2.
async function parseFormData(req: NextRequest): Promise<{ fields: Fields; files: Files }> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ multiples: false }); // Handle single file for 'image'

    // formidable needs the raw request, which isn't directly available in App Router API routes.
    // We need to adapt. Let's try getting the form data directly.
    // This part might be tricky with Next.js App Router edge runtime, might need adjustments or alternative library.
    // Let's assume standard Node.js runtime for now.

    // WORKAROUND: Try reading FormData directly from NextRequest
     req.formData()
       .then(formData => {
           const fields: Fields<string> = {};
           const files: Files<string> = {};
           const filePromises: Promise<void>[] = [];

           formData.forEach((value, key) => {
               if (value instanceof File) {
                   // formidable expects properties like filepath, originalFilename etc.
                   // Let's adapt the structure or handle the File object directly later.
                    files[key] = value as any; // Store the File object, cast to any for now
               } else {
                    // Collect field values, handling potential multiple values if needed
                    const existing = fields[key];
                    if (existing) {
                         if (Array.isArray(existing)) {
                            existing.push(value);
                         } else {
                            fields[key] = [existing, value];
                         }
                    } else {
                         fields[key] = value;
                    }
               }
           });
           resolve({ fields: fields as Fields, files: files as Files });

       })
       .catch(err => reject(err));
  });
}


// --- POST Handler (Batch Registration) ---
export async function POST(request: NextRequest) {
    // TODO: Authentication
    const farmerAccountIdString = "0.0.5768282";
    let client;

    try {
        // --- Get FormData Directly ---
        console.log("Getting form data...");
        const formData = await request.formData();
        console.log("FormData received.");

        // --- Extract fields and file from FormData ---
        const productName = formData.get('productName') as string | null;
        const quantity = formData.get('quantity') as string | null;
        const unit = formData.get('unit') as string | null;
        const imageFile = formData.get('image') as File | null; // Get the File object

        // Ensure quantity is a valid number string before parsing later
        if (isNaN(parseInt(quantity, 10))) {
            return NextResponse.json({ error: 'Invalid quantity provided' }, { status: 400 });
        }
       if (!imageFile) {
            return NextResponse.json({ error: 'Missing image file' }, { status: 400 });
       }

        // --- Upload Image to IPFS via Pinata ---
        let imageUrl = `/placeholder-${productName.toLowerCase()}.jpg`; // Default placeholder
        let imageIpfsCid = null;
        if (pinata && imageFile) {
            console.log("Uploading image to Pinata...");
            try {
                // Create readable stream from File object's ArrayBuffer
                const arrayBuffer = await imageFile.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const stream = Readable.from(buffer);

                const options = { /* ... pinata options ... */ };
                const result = await pinata.pinFileToIPFS(stream, options); // Use the stream
                imageIpfsCid = result.IpfsHash;
                imageUrl = `ipfs://${imageIpfsCid}`;
                console.log("Image uploaded to IPFS via Pinata:", imageUrl);
            } catch (pinataError) {
               // ... Pinata error handling ...
               console.error("Pinata upload failed:", pinataError);
               console.warn("Proceeding without IPFS image due to upload failure.");
            }
        } else if (!pinata) {
            console.warn("Pinata keys not configured. Skipping IPFS upload.");
        }


        // --- Continue with Hedera, Prisma operations ---
        const batchId = `B-${uuidv4().slice(0, 8).toUpperCase()}`;
        const creationDate = new Date();

        client = getHederaClient();
        // ... (get platform details, HCS/NFT IDs) ...
        console.log(">>> Using HCS Topic ID:", hcsTopicId.toString()); // Keep debug logs for now
        console.log(">>> Using NFT Token ID:", nftTokenId.toString());

        
        // ... (get account IDs, keys, topic/token IDs) ...
        const platformAccountId = getPlatformAccountId();
        const platformPrivateKey = getPlatformPrivateKey();
        const hcsTopicId = getHcsTopicId();
        const nftTokenId = getNftTokenId();
        console.log(">>> Using HCS Topic ID:", hcsTopicId.toString());
        console.log(">>> Using NFT Token ID:", nftTokenId.toString());


        // --- 1. Submit Batch Creation Event to HCS ---
        // Include image IPFS CID in HCS message
        const hcsMessagePayload = {
            eventId: uuidv4(),
            eventType: "BATCH_CREATED",
            batchId: batchId,
            timestamp: creationDate.toISOString(),
            farmerAccountId: farmerAccountIdString,
            product: { name: productName, quantity: parseInt(quantity, 10), unit: unit, },
            imageIpfsCid: imageIpfsCid, // Add image CID here
            // ipfsCid: placeholderIpfsCid // Keep metadata CID separate?
        };
        const hcsMessage = JSON.stringify(hcsMessagePayload);
        const hcsSubmitTx = await new TopicMessageSubmitTransaction({ topicId: hcsTopicId, message: hcsMessage }).freezeWith(client).sign(platformPrivateKey);
        const hcsSubmitRx = await hcsSubmitTx.execute(client);
        const hcsReceipt = await hcsSubmitRx.getReceipt(client);
        const hcsSequenceNumber = hcsReceipt.topicSequenceNumber;
        console.log(`HCS Message Submitted: Sequence Number ${hcsSequenceNumber}`);


        // --- Prepare Off-Chain Metadata JSON ---
        const offChainMetadata = {
            name: `Batch ${batchId} - ${productName}`,
            description: `AgriTrust registered batch of ${productName}`,
            image: imageUrl, // Use the actual IPFS URL for the image
            creator: "AgriTrust Platform", type: "AgriTrust Batch",
            properties: {
                batchId: batchId, hcsTopicId: hcsTopicId.toString(), hcsInitialSequence: hcsSequenceNumber?.toString(),
                farmerAccountId: farmerAccountIdString, productType: productName, quantity: parseInt(quantity, 10), unit: unit,
                creationTimestamp: creationDate.toISOString()
            }
        };
        // TODO: Upload this offChainMetadata JSON to IPFS
        const offChainIpfsCid = "bafkrei...placeholder_json_cid"; // Replace with real CID later


        // --- Create MINIMAL On-Chain Metadata ---
        const nftMetadata = Buffer.from(`ipfs://${offChainIpfsCid}`);
        console.log("NFT Metadata Buffer Length:", nftMetadata.length);


        // --- 2. Mint the Batch NFT ---
        const mintTx = await new TokenMintTransaction({ tokenId: nftTokenId, metadata: [nftMetadata] }).freezeWith(client).sign(platformPrivateKey);
        const mintRx = await mintTx.execute(client);
        const mintReceipt = await mintRx.getReceipt(client);
        const serialNumber = mintReceipt.serials[0];
        const nftIdString = `${nftTokenId.toString()}/${serialNumber.toString()}`;
        console.log(`NFT Minted: Token ID ${nftTokenId.toString()}, Serial Number ${serialNumber}`);


        // --- (Skipping Self-Transfer Block) ---

        // --- 4. Store results in Database using Prisma ---
        const hcsSequenceNumberLong = hcsReceipt.topicSequenceNumber;
        const hcsSequenceNumberForDb: bigint | null = hcsSequenceNumberLong !== null ? BigInt(hcsSequenceNumberLong.toString()) : null;

        const createdBatch = await prisma.batch.create({
            data: {
                productName: productName, quantity: parseInt(quantity, 10), unit: unit, status: 'Registered',
                creationDate: creationDate,
                imageUrl: imageUrl, // Save the actual image URL (IPFS or placeholder)
                nftId: nftIdString, hcsTopicId: hcsTopicId.toString(), hcsSequenceNumber: hcsSequenceNumberForDb,
                ipfsMetadataCid: offChainIpfsCid, farmerAccountId: farmerAccountIdString,
            }
        });
        console.log("Batch data saved to DB:", createdBatch.id);


        // --- Invalidate Cache ---
        revalidatePath('/farmer/batches');
        console.log("Cache revalidated for /farmer/batches");


        // --- Prepare Response ---
        const responseBatch = {
            ...createdBatch,
            hcsSequenceNumber: createdBatch.hcsSequenceNumber?.toString(),
            creationDate: createdBatch.creationDate.toISOString(),
        };


        // --- 5. Return Success Response ---
        return NextResponse.json(responseBatch, { status: 201 });

    } catch (error: any) {
        console.error("Batch Registration Failed:", error);
        // ... (Prisma and Hedera error checks) ...
         let errorMessage = 'Batch registration failed.';
         if (error instanceof Prisma.PrismaClientKnownRequestError) { /* ... */ }
         else if (error.message?.includes("INVALID_")) { /* ... */ } // Hedera specific errors
         return NextResponse.json({ error: errorMessage, details: error.message || error }, { status: 500 });
    } finally {
        client?.close();
    }
}

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
