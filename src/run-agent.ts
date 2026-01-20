
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { TransactionalAgent } from './agent/index.ts';

async function main() {
    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

    if (!privateKey || privateKey.includes("your_private_key")) {
        console.error("❌ Error: PRIVATE_KEY is missing or invalid in .env.local");
        console.error("Please set a valid Testnet private key in .env.local to run the real agent.");
        process.exit(1);
    }

    const agent = new TransactionalAgent({
        privateKey,
        // rpcUrl, // REMOVED: Using default Base Sepolia RPC to avoid env var conflict
        useRealWallet: true
    });

    try {
        await agent.run();
    } catch (error) {
        console.error("Agent execution failed.");
        process.exit(1);
    }
}

main();
