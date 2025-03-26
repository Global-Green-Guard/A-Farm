// app/api/farmer/batches/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { Batch } from '@/types';
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

// --- TODO: Replace with actual database interactions ---
const MOCK_BATCHES: Batch[] = [
    { id: 'B007', productId: 'prod_tomato', productName: 'Roma Tomatoes', quantity: 500, unit: 'KG', status: 'Registered', creationDate: new Date(Date.now() - 3600 * 1000).toISOString(), imageUrl: '/placeholder-tomato.jpg' },
    { id: 'B006', productId: 'prod_carrot', productName: 'Nantes Carrots', quantity: 200, unit: 'KG', status: 'Needs Attention', creationDate: new Date(Date.now() - 1.5 * 86400 * 1000).toISOString() },
    { id: 'B005', productId: 'prod_apple', productName: 'Gala Apples', quantity: 150, unit: 'Boxes', status: 'Certified', creationDate: new Date(Date.now() - 2 * 86400 * 1000).toISOString(), nftId: '0.0.12345/3' },
];
// Function to add a batch (replace with DB insert)
function addMockBatch(batch: Batch) { MOCK_BATCHES.unshift(batch); }
// --- End Simulation ---


// --- GET Handler ---
export async function GET(request: Request) {
    // TODO: Implement Authentication
    // const farmerId = await getFarmerIdFromSession(request);
    // if (!farmerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // TODO: Fetch batches for the specific farmerId from the database
        const batches = MOCK_BATCHES; // Replace with DB Query
        return NextResponse.json(batches);
    } catch (error) {
        console.error("Error fetching batches:", error);
        return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
    }
}


// --- POST Handler (Batch Registration) ---
export async function POST(request: NextRequest) {
    // TODO: Implement Authentication
    // const farmerId = await getFarmerIdFromSession(request);
    // if (!farmerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const farmerAccountIdString = "0.0.5768282"; // TODO: Get actual farmer account ID

    let client;
    try {
        const body = await request.json();

        // --- Basic Input Validation (Add more robust validation) ---
        if (!body.productName || !body.quantity || !body.unit) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const batchId = `B-${uuidv4().slice(0, 8).toUpperCase()}`; // Generate unique batch ID
        const creationDate = new Date().toISOString();
        const placeholderIpfsCid = "bafybe...placeholder"; // TODO: Integrate real IPFS upload

        // --- Initialize Hedera Client ---
        client = getHederaClient();
        const platformAccountId = getPlatformAccountId();
        const platformPrivateKey = getPlatformPrivateKey();
        const hcsTopicId = getHcsTopicId();
        const nftTokenId = getNftTokenId();

        // --- 1. Submit Batch Creation Event to HCS ---
        const hcsMessage = JSON.stringify({
            eventId: uuidv4(),
            eventType: "BATCH_CREATED",
            batchId: batchId,
            timestamp: creationDate,
            farmerAccountId: farmerAccountIdString, // TODO: Use authenticated farmer's account ID
            product: {
                name: body.productName,
                quantity: body.quantity,
                unit: body.unit,
                // Add other product details from body
            },
            ipfsCid: placeholderIpfsCid
        });

        const hcsSubmitTx = await new TopicMessageSubmitTransaction({
            topicId: hcsTopicId,
            message: hcsMessage,
        })
        .setMaxChunks(1) // Keep messages small for simplicity
        .freezeWith(client) // Freeze for signing with platform key
        .sign(platformPrivateKey);

        const hcsSubmitRx = await hcsSubmitTx.execute(client);
        const hcsReceipt = await hcsSubmitRx.getReceipt(client);
        const hcsSequenceNumber = hcsReceipt.topicSequenceNumber; // Store this!

        console.log(`HCS Message Submitted: Sequence Number ${hcsSequenceNumber}`);


        // --- Prepare Off-Chain Metadata JSON ---
        const offChainMetadata = {
            name: `Batch ${batchId} - ${body.productName}`,
            description: `AgriTrust registered batch of ${body.productName}`,
            image: `ipfs://${placeholderIpfsCid}`, // Link to the IMAGE file on IPFS
            creator: "AgriTrust Platform",
            type: "AgriTrust Batch",
            properties: {
                batchId: batchId,
                hcsTopicId: hcsTopicId.toString(),
                hcsInitialSequence: hcsSequenceNumber?.toString(),
                farmerAccountId: farmerAccountIdString,
                productType: body.productName,
                quantity: body.quantity,
                unit: body.unit,
                creationTimestamp: creationDate
            },
            // You can add more detailed attributes here following HIP-412 if desired
        };
        
        // --- TODO: Upload offChainMetadata JSON to IPFS ---
        // const offChainJsonString = JSON.stringify(offChainMetadata);
        // const offChainIpfsCid = await uploadToIpfs(offChainJsonString); // Implement this function
        const offChainIpfsCid = "bafkrei...placeholder_json_cid"; // Replace with real CID after upload


        // --- 2. Mint the Batch NFT ---
        const nftMetadata = Buffer.from(`ipfs://${offChainIpfsCid}`);

        // --- Check the buffer length (ADD THIS LINE FOR DEBUGGING) ---
        console.log("NFT Metadata Buffer Length:", nftMetadata.length);
        
        // const nftMetadata = Buffer.from(JSON.stringify({
        //     name: `Batch ${batchId} - ${body.productName}`, // <-- Potentially long
        //     description: `AgriTrust registered batch of ${body.productName}`, // <-- Potentially long
        //     image: `ipfs://${placeholderIpfsCid}`, // <-- Relatively long CID string
        //     creator: "AgriTrust Platform",
        //     type: "AgriTrust Batch",
        //     properties: {
        //         batchId: batchId,
        //         hcsTopicId: hcsTopicId.toString(),
        //         hcsInitialSequence: hcsSequenceNumber?.toString(),
        //         farmerAccountId: farmerAccountIdString,
        //         productType: body.productName, // <-- Repetitive
        //         quantity: body.quantity,
        //         unit: body.unit,
        //         creationTimestamp: creationDate // <-- Long ISO date string
        //     }
        // }));

        
        // --- Create MINIMAL On-Chain Metadata (Just the link) ---
        // Convert the IPFS CID of the JSON file to bytes. This MUST be <= 100 bytes.
   
        const mintTx = await new TokenMintTransaction({
            tokenId: nftTokenId,
            metadata: [nftMetadata], // Array of Buffers
        })
        .freezeWith(client)
        .sign(platformPrivateKey); // Sign with the SUPPLY key (which we assume is the platform key here)

        const mintRx = await mintTx.execute(client);
        const mintReceipt = await mintRx.getReceipt(client);
        const serialNumber = mintReceipt.serials[0]; // Get the serial number of the new NFT. Store this!

        console.log(`NFT Minted: Token ID ${nftTokenId.toString()}, Serial Number ${serialNumber}`);
        const nftIdString = `${nftTokenId.toString()}/${serialNumber.toString()}`;

        // --- (Optional) 3. Transfer NFT to Farmer ---
        // Assumes farmer account is already associated with nftTokenId!
        // TODO: Handle association if needed.
        // const farmerAccountId = AccountId.fromString(farmerAccountIdString); // TODO: Use real ID
        // const transferTx = await new TransferTransaction()
        //     .addNftTransfer(nftTokenId, serialNumber, platformAccountId, farmerAccountId)
        //     .freezeWith(client)
        //     .sign(platformPrivateKey); // Platform signs to send

        // const transferRx = await transferTx.execute(client);
        // await transferRx.getReceipt(client); // Wait for confirmation

        // console.log(`NFT ${nftIdString} transferred to Farmer ${farmerAccountIdString}`);


        // --- 4. Store results (Simulated) ---
        const newBatch: Batch = {
            id: batchId,
            productId: body.productId || `prod-${body.productName.toLowerCase()}`, // Generate or get from body
            productName: body.productName,
            quantity: body.quantity,
            unit: body.unit,
            status: 'Registered',
            creationDate: creationDate,
            imageUrl: `/placeholder-${body.productName.toLowerCase()}.jpg`, // Placeholder image
            nftId: nftIdString, // Store the NFT ID
            // Store hcsSequenceNumber and ipfsCid in your real DB
        };
        // TODO: Replace with actual DB insert
        addMockBatch(newBatch);

        // --- 5. Return Success Response ---
        return NextResponse.json(newBatch, { status: 201 }); // Return the newly created batch

    } catch (error: any) {
        console.error("Batch Registration Failed:", error);
        // Provide more specific error messages if possible
        let errorMessage = 'Batch registration failed.';
        if (error.message?.includes("INSUFFICIENT_TX_FEE")) {
            errorMessage = "Insufficient HBAR balance on the platform account for transaction fees.";
        } else if (error.message?.includes("INVALID_SIGNATURE")) {
             errorMessage = "Invalid signature. Check platform private key.";
        } else if (error.message?.includes("TOKEN_NOT_ASSOCIATED_TO_ACCOUNT")){
             errorMessage = `Farmer account ${farmerAccountIdString} is not associated with Token ${process.env.AGRITRUST_NFT_TOKEN_ID}.`;
        }
        // ... other specific Hedera errors

        return NextResponse.json({ error: errorMessage, details: error.message }, { status: 500 });
    } finally {
         // Close the client if it was created
        client?.close();
    }
}