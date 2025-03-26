// lib/hedera.ts
import { Client, AccountId, PrivateKey, TopicId, TokenId } from "@hashgraph/sdk";
import 'dotenv/config'; // Make sure env vars are loaded

export function getHederaClient(): Client {
    const accountIdString = process.env.HEDERA_ACCOUNT_ID;
    const privateKeyString = process.env.HEDERA_PRIVATE_KEY;
    const network = process.env.HEDERA_NETWORK;

    if (!accountIdString || !privateKeyString) {
        throw new Error("HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set in environment variables.");
    }

    let client: Client;
    if (network === 'mainnet') {
        client = Client.forMainnet();
    } else {
        client = Client.forTestnet(); // Default to testnet
    }

    try {
        const operatorId = AccountId.fromString(accountIdString);
        // *** CHANGE THIS LINE ***
        const operatorKey = PrivateKey.fromStringECDSA(privateKeyString);
        client.setOperator(operatorId, operatorKey);
    } catch (error) {
        // ... (error handling) ...
    }

    // Increase default max transaction fee (optional, adjust as needed)
    // client.setDefaultMaxTransactionFee(new Hbar(100));

    // Set max query payment (optional)
    // client.setDefaultMaxQueryPayment(new Hbar(50));

    return client;
}

// --- Helper functions to get IDs from env vars ---

export function getPlatformAccountId(): AccountId {
    const accountIdString = process.env.HEDERA_ACCOUNT_ID;
    if (!accountIdString) throw new Error("HEDERA_ACCOUNT_ID not set");
    return AccountId.fromString(accountIdString);
}

export function getPlatformPrivateKey(): PrivateKey {
    const privateKeyString = process.env.HEDERA_PRIVATE_KEY;
    if (!privateKeyString) throw new Error("HEDERA_PRIVATE_KEY not set");
    // *** CHANGE THIS LINE ***
    return PrivateKey.fromStringECDSA(privateKeyString);
}

export function getHcsTopicId(): TopicId {
    const topicIdString = process.env.AGRITRUST_HCS_TOPIC_ID;
    if (!topicIdString) {
        // Throw error if not set at all
        throw new Error("AGRITRUST_HCS_TOPIC_ID not set in environment variables.");
    }
    try {
         return TopicId.fromString(topicIdString);
    } catch (parseError) {
         // Throw error if the format is wrong
         console.error(`Failed to parse AGRITRUST_HCS_TOPIC_ID: ${topicIdString}`, parseError);
         throw new Error(`Invalid format for AGRITRUST_HCS_TOPIC_ID in environment variables.`);
    }
}

export function getNftTokenId(): TokenId {
    const tokenIdString = process.env.AGRITRUST_NFT_TOKEN_ID;
     if (!tokenIdString || tokenIdString === '0.0.PLACEHOLDER_TOKEN_ID') {
        console.warn("AGRITRUST_NFT_TOKEN_ID is not set or is a placeholder. Using dummy value.");
        return TokenId.fromString("0.0.456"); // Return dummy/throw error
        // throw new Error("AGRITRUST_NFT_TOKEN_ID not set in environment variables.");
    }
    return TokenId.fromString(tokenIdString);
}