const {
    Client, PrivateKey, AccountId, TokenCreateTransaction, TokenType, TokenSupplyType
} = require("@hashgraph/sdk");
require('dotenv').config({ path: '.env.local' });

async function main() {
    const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
    // Ensure you use the correct parsing method for YOUR key type (ECDSA here)
    const privateKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY);
    const publicKey = privateKey.publicKey; // Get the public key

    const client = Client.forTestnet().setOperator(accountId, privateKey);

    console.log("Creating HTS NFT Token Class...");

    // Create the NFT Token Class
    const tx = await new TokenCreateTransaction()
        .setTokenName("AgriTrust Batch Token")       // Name of your NFT collection
        .setTokenSymbol("AGRIBATCH")                // Symbol
        .setTokenType(TokenType.NonFungibleUnique)  // Set type to NFT
        .setDecimals(0)                             // NFTs have 0 decimals
        .setInitialSupply(0)                        // Initial supply is 0, we mint later
        .setSupplyType(TokenSupplyType.Infinite)    // Or Finite if you have a max supply
        .setTreasuryAccountId(accountId)            // Your platform account holds tokens initially
        .setAdminKey(publicKey)                     // Key to update token properties (optional but recommended)
        .setSupplyKey(publicKey)                    // Key required to MINT new NFTs (IMPORTANT!)
        // Set other keys as needed (Freeze, Wipe, Pause, Metadata) - Public key used here for simplicity
        .setFreezeKey(publicKey)
        .setWipeKey(publicKey)
        .setPauseKey(publicKey)
        // .setMetadataKey(publicKey) // Use if you need to update NFT metadata after minting
        .setTokenMemo("NFTs representing AgriTrust Batches") // Optional memo
        .freezeWith(client); // Freeze for signing

    // Sign the transaction with the treasury key and admin key (if set)
    // Since they are the same here (platform key), one signature is enough
    const signTx = await tx.sign(privateKey);

    // Submit the transaction to a Hedera network
    const submitTx = await signTx.execute(client);

    // Get the receipt of the transaction
    const receipt = await submitTx.getReceipt(client);

    // Get the token ID from the receipt
    const tokenId = receipt.tokenId;

    console.log(`Successfully created NFT Token Class with ID: ${tokenId}`);

    console.log("\n--------------------------");
    console.log("ACTION REQUIRED:");
    console.log(`Update AGRITRUST_NFT_TOKEN_ID in your .env.local file to: ${tokenId}`);
    console.log("--------------------------\n");

    client.close();
}

main().catch((err) => {
    console.error("Error creating NFT token:", err);
    process.exit(1);
});