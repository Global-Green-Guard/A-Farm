// app/api/farmer/batches/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { Readable } from 'stream'; 
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import pinataSDK from '@pinata/sdk'; // Correctly import the default export
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
// No need for Readable stream if Pinata SDK handles Buffer/ArrayBuffer

// --- Initialize Pinata ---
// Ensure these are set in your .env.local or .env file
const pinataApiKey = process.env.PINATA_API_KEY;
const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;

// Initialize Pinata SDK only if keys are present
const pinata = pinataApiKey && pinataSecretApiKey ? new pinataSDK(pinataApiKey, pinataSecretApiKey) : null;

if (!pinata) {
    console.warn("Pinata API Keys not found or incomplete in environment variables. IPFS image upload will be skipped.");
}

// --- POST Handler (Batch Registration) ---
export async function POST(request: NextRequest) {
    // TODO: Authentication check to get real farmerAccountIdString
    const farmerAccountIdString = "0.0.5768282"; // Hardcoded for now
    let client; // Hedera client
    let imageIpfsCid = "bafybei...placeholder_image_cid"; // Default placeholder
    let imageUrl = `ipfs://${imageIpfsCid}`; // Default placeholder URL

    try {
        // --- Read FormData Directly ---
        console.log("Getting form data...");
        const formData = await request.formData();
        console.log("FormData received.");

        // --- Get Form Fields ---
        const productName = formData.get('productName') as string | null;
        const quantityString = formData.get('quantity') as string | null;
        const unit = formData.get('unit') as string | null;
        const imageFile = formData.get('image') as File | null; // Assuming input name is 'image'

        // --- Basic Input Validation ---
        if (!productName || !quantityString || !unit) {
            return NextResponse.json({ error: 'Missing required text fields (productName, quantity, unit)' }, { status: 400 });
        }
        const quantity = parseInt(quantityString, 10);
         if (isNaN(quantity) || quantity <= 0) {
             return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
         }
        // No validation for imageFile here, proceed even if missing

        // --- Define batchId AFTER getting necessary fields ---
        const batchId = `B-${uuidv4().slice(0, 8).toUpperCase()}`;

        // --- Handle Image Upload (if present and Pinata configured) ---
        if (imageFile && pinata) { // Only attempt if file exists AND pinata is initialized
            console.log("FormData contains image file. Attempting IPFS upload via Pinata...");
            try {
                 // Convert File to Buffer/ArrayBuffer which SDK might handle
                 // Pinata SDK might prefer a readable stream, but let's try buffer first
                 // Forcing stream: const stream = Readable.from(Buffer.from(await imageFile.arrayBuffer()));
                 const buffer = Buffer.from(await imageFile.arrayBuffer());

                const options = {
                    pinataMetadata: {
                        name: `${batchId}-${imageFile.name}`, // batchId is now defined
                        // keyvalues: { batchId: batchId } // Example custom metadata
                    },
                    pinataOptions: {
                        cidVersion: 0 // Or 1
                    }
                };
                console.log("Uploading image buffer to Pinata...");

                // Use pinata.pinFileToIPFS - check SDK requirements (stream vs buffer)
                // Assuming pinata SDK needs a stream:
                const stream = Readable.from(buffer);
                stream.path = `${batchId}-${imageFile.name}`; // Some SDK versions might need path on stream

                const result = await pinata.pinFileToIPFS(stream, options);
                imageIpfsCid = result.IpfsHash;
                imageUrl = `ipfs://${imageIpfsCid}`;
                console.log("Image uploaded to IPFS via Pinata:", imageUrl);

            } // In POST /api/farmer/batches, inside the catch block for Pinata upload:
            catch (ipfsError: any) {
                console.error("Pinata upload failed:", ipfsError?.message || ipfsError);
                console.log("Proceeding without IPFS image due to upload failure.");
                // Set imageUrl to a valid local placeholder IF upload fails
                imageUrl = "/placeholder.jpg"; 
                imageIpfsCid = ""; // Clear IPFS CID if upload failed
            }
        } else if (imageFile && !pinata) {
            console.log("Image file found, but Pinata is not configured. Skipping IPFS upload.");
        } else {
            console.log("No image file found in form data.");
        }

        // --- Define creationDate ---
        const creationDate = new Date();

        // --- Initialize Hedera Client & Get IDs ---
        // Ensure these are called AFTER potentially slow IPFS upload
        client = getHederaClient();
        const platformAccountId = getPlatformAccountId();
        const platformPrivateKey = getPlatformPrivateKey();
        const hcsTopicId = getHcsTopicId(); // Retrieve ID HERE
        const nftTokenId = getNftTokenId(); // Retrieve ID HERE
        console.log(">>> Using HCS Topic ID:", hcsTopicId.toString()); // Log AFTER retrieval
        console.log(">>> Using NFT Token ID:", nftTokenId.toString()); // Log AFTER retrieval

        // --- 1. Submit Batch Creation Event to HCS ---
        const hcsMessage = JSON.stringify({
            eventId: uuidv4(),
            eventType: "BATCH_CREATED",
            batchId: batchId,
            timestamp: creationDate.toISOString(),
            farmerAccountId: farmerAccountIdString,
            product: { name: productName, quantity: quantity, unit: unit },
            ipfsImageUrl: imageUrl // Use the potentially updated imageUrl
        });

        const hcsSubmitTx = await new TopicMessageSubmitTransaction({
            topicId: hcsTopicId, // Use the retrieved variable
            message: hcsMessage,
        }).setMaxChunks(1).freezeWith(client).sign(platformPrivateKey);

        console.log("Submitting HCS message...");
        const hcsSubmitRx = await hcsSubmitTx.execute(client);
        const hcsReceipt = await hcsSubmitRx.getReceipt(client);
        const hcsSequenceNumberLong = hcsReceipt.topicSequenceNumber; // This is Long | null
        console.log(`HCS Message Submitted: Sequence Number ${hcsSequenceNumberLong?.toString() ?? 'N/A'}`);


        // --- Prepare Off-Chain Metadata JSON ---
        const offChainMetadata = {
            name: `Batch ${batchId} - ${productName}`,
            description: `AgriTrust registered batch of ${productName}`,
            image: imageUrl, // Use the actual IPFS URL (or placeholder)
            creator: "AgriTrust Platform", type: "AgriTrust Batch",
            properties: {
                batchId: batchId, hcsTopicId: hcsTopicId.toString(), hcsInitialSequence: hcsSequenceNumberLong?.toString(),
                farmerAccountId: farmerAccountIdString, productType: productName, quantity: quantity, unit: unit,
                creationTimestamp: creationDate.toISOString()
            }
        };
        // TODO: Upload offChainMetadata JSON to IPFS
        const offChainIpfsCid = "bafkrei...placeholder_json_cid"; // Placeholder JSON CID


        // --- Create MINIMAL On-Chain Metadata ---
        const nftMetadata = Buffer.from(`ipfs://${offChainIpfsCid}`);
        console.log("NFT Metadata Buffer Length:", nftMetadata.length);


        // --- 2. Mint the Batch NFT ---
        const mintTx = await new TokenMintTransaction({
            tokenId: nftTokenId, // Use the retrieved variable
            metadata: [nftMetadata]
        }).freezeWith(client).sign(platformPrivateKey);

        console.log("Minting NFT...");
        const mintRx = await mintTx.execute(client);
        const mintReceipt = await mintRx.getReceipt(client);
        const serialNumberLong = mintReceipt.serials[0]; // This is Long
        const nftIdString = `${nftTokenId.toString()}/${serialNumberLong.toString()}`;
        console.log(`NFT Minted: Token ID ${nftTokenId.toString()}, Serial Number ${serialNumberLong.toString()}`);


        // --- (Skipping Self-Transfer Block) ---

        // --- 4. Store results in Database using Prisma ---
        // Convert Long | null to bigint | null for Prisma's BigInt? type
        const hcsSequenceNumberForDb: bigint | null = hcsSequenceNumberLong ? BigInt(hcsSequenceNumberLong.toString()) : null;

        console.log("Saving batch data to database...");
        const createdBatch = await prisma.batch.create({
            data: {
                // id is generated by cuid() default
                productName: productName,
                quantity: quantity,
                unit: unit,
                status: 'Registered',
                creationDate: creationDate, // Store the Date object
                imageUrl: imageUrl, // Save the actual image URL used
                nftId: nftIdString,
                hcsTopicId: hcsTopicId.toString(),
                hcsSequenceNumber: hcsSequenceNumberForDb, // Use the converted bigint | null
                ipfsMetadataCid: offChainIpfsCid, // Store the JSON metadata CID placeholder
                farmerAccountId: farmerAccountIdString,
                // productId: body.productId, // Add if available later
            }
        });
        console.log("Batch data saved to DB:", createdBatch.id);


        // --- Invalidate Cache for the batches page ---
        revalidatePath('/farmer/batches');
        console.log("Cache revalidated for /farmer/batches");


        // --- Prepare Response Data (Serialize BigInt/Date for JSON) ---
        const responseBatch = {
            ...createdBatch,
            hcsSequenceNumber: createdBatch.hcsSequenceNumber?.toString(), // Convert BigInt back to string for JSON
            creationDate: createdBatch.creationDate.toISOString(), // Convert Date to ISO string for JSON
        };


        // --- 5. Return Success Response ---
        return NextResponse.json(responseBatch, { status: 201 });

    } catch (error: any) {
        console.error("Batch Registration Failed:", error); // Log the full error

        let errorMessage = 'Batch registration failed.';
        let errorDetails = error.message || error;
        let statusCode = 500;

        // Check for Prisma specific errors
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             console.error("Prisma Error Code:", error.code);
             if (error.code === 'P2002') { // Unique constraint failed
                errorMessage = `Database unique constraint failed. Check if NFT ID ${error.meta?.target} already exists.`;
                statusCode = 409; // Conflict
             } else {
                errorMessage = `Database error occurred (Code: ${error.code}).`;
             }
             errorDetails = error.meta || error.message;
        }
        // Check for Hedera specific errors (using message includes for simplicity)
        else if (error.message?.includes("INVALID_") || error.message?.includes("INSUFFICIENT_")) { // Common prefixes
             errorMessage = `Hedera transaction failed: ${error.status ? error.status.toString() : error.message}`;
             // Keep statusCode 500 or adjust based on error type if needed
        }
         // Add more specific error checks if needed

         return NextResponse.json({ error: errorMessage, details: errorDetails }, { status: statusCode });
    } finally {
        // Ensure Hedera client is closed if it was initialized
        client?.close();
        console.log("Hedera client closed.");
    }
}

// --- GET Handler ---
export async function GET(request: Request) {
    // TODO: Implement Authentication and get actual farmerId
    const farmerId = "0.0.5768282"; // Hardcoded for now

    console.log(`Fetching batches for farmer: ${farmerId}`);
    try {
        const batches = await prisma.batch.findMany({
            where: {
                farmerAccountId: farmerId, // Filter by farmer
            },
            orderBy: {
                creationDate: 'desc', // Show newest first
            },
        });
        console.log(`Found ${batches.length} batches in DB.`);

        // Convert BigInt to string for JSON serialization
        const serializedBatches = batches.map(batch => ({
            ...batch,
            hcsSequenceNumber: batch.hcsSequenceNumber?.toString(),
            creationDate: batch.creationDate.toISOString(), // Also ensure date is serialized consistently
        }));

        return NextResponse.json(serializedBatches);
    } catch (error: any) {
        console.error("Error fetching batches from DB:", error);
        return NextResponse.json({ error: 'Failed to fetch batches', details: error.message }, { status: 500 });
    }
}