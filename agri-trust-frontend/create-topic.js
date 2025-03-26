const {
    Client, PrivateKey, AccountId, TopicCreateTransaction
} = require("@hashgraph/sdk");
require('dotenv').config({ path: '.env.local' }); // Read from your existing env file

async function main() {
    const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
    // Ensure you use the correct parsing method for YOUR key type (ECDSA here)
    const privateKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY);

    const client = Client.forTestnet().setOperator(accountId, privateKey);

    console.log("Creating HCS Topic...");

    const tx = await new TopicCreateTransaction()
        .setAdminKey(privateKey.publicKey) // Optional: Set admin key to allow updates/deletion
        .setSubmitKey(privateKey.publicKey) // Optional: Restrict who can submit (can leave open)
        .setTopicMemo("AgriTrust Batch Events Topic")
        .execute(client);

    const receipt = await tx.getReceipt(client);
    const topicId = receipt.topicId;

    console.log(`Successfully created Topic with ID: ${topicId}`);

    console.log("\n--------------------------");
    console.log("ACTION REQUIRED:");
    console.log(`Update AGRITRUST_HCS_TOPIC_ID in your .env.local file to: ${topicId}`);
    console.log("--------------------------\n");

    client.close();
}

main().catch((err) => {
    console.error("Error creating topic:", err);
    process.exit(1);
});