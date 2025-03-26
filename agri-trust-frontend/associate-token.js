const {
    Client, PrivateKey, AccountId, TokenId, TokenAssociateTransaction
} = require("@hashgraph/sdk");
require('dotenv').config({ path: '.env.local' });

// --- CONFIGURATION ---
const farmerAccountIdString = "0.0.5768282"; // <--- REPLACE with the actual target farmer ID
const farmerPrivateKeyString = "bea9170333ef1b1b8d248c08e103c446bedfa97d4cfe89a70e32b68420e6d0fc"; // <--- REPLACE with the farmer's private key (hex, no 0x)
const farmerKeyType = "ECDSA"; // Or "ED25519" - MUST match the farmer's key type
const tokenIdToAssociate = process.env.AGRITRUST_NFT_TOKEN_ID;
// --- END CONFIGURATION ---

async function main() {
    if (!tokenIdToAssociate || tokenIdToAssociate.includes('PLACEHOLDER')) {
        console.error("AGRITRUST_NFT_TOKEN_ID is not set correctly in .env.local");
        process.exit(1);
    }
     if (farmerAccountIdString === "0.0.FARMER_ID" || farmerPrivateKeyString === "FARMER_PRIVATE_KEY") {
        console.error("Please update farmerAccountIdString and farmerPrivateKeyString in the script.");
        process.exit(1);
    }

    const farmerAccountId = AccountId.fromString(farmerAccountIdString);
    let farmerPrivateKey;
    if (farmerKeyType === "ECDSA") {
        farmerPrivateKey = PrivateKey.fromStringECDSA(farmerPrivateKeyString);
    } else {
        farmerPrivateKey = PrivateKey.fromStringED25519(farmerPrivateKeyString);
    }


    const client = Client.forTestnet().setOperator(farmerAccountId, farmerPrivateKey); // Operate as the farmer

    console.log(`Associating account ${farmerAccountId} with token ${tokenIdToAssociate}...`);

    // Create the transaction
    const transaction = await new TokenAssociateTransaction()
        .setAccountId(farmerAccountId)
        .setTokenIds([TokenId.fromString(tokenIdToAssociate)])
        .freezeWith(client); // Freeze using the farmer's client

    // Sign the transaction with the farmer's key
    const signTx = await transaction.sign(farmerPrivateKey);

    // Submit the transaction to a Hedera network
    const txResponse = await signTx.execute(client);

    // Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    // Get the transaction consensus status
    const transactionStatus = receipt.status;

    console.log(`Association transaction consensus status: ${transactionStatus.toString()}`);

    client.close();
}

main().catch((err) => {
    console.error("Error associating token:", err);
    process.exit(1);
});