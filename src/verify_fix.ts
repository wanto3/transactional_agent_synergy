
import fs from 'fs';
import path from 'path';

// Manual env parsing
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    });
}

import { RealWallet } from './x402/client';

async function main() {
    console.log("Verifying RealWallet fix...");
    let pk = process.env.PRIVATE_KEY;
    if (!pk) {
        console.error("No private key found");
        return;
    }
    // Simple fix for hex prefix if missing
    if (!pk.startsWith("0x")) pk = "0x" + pk;

    const wallet = new RealWallet(pk, process.env.NEXT_PUBLIC_RPC_URL);

    // We mock the log function to see what it prints
    const log = (msg: string) => console.log(msg);

    try {
        // Try to pay a tiny amount to self or burn address to trigger nonce check
        // We expect to see "RPC: 22" (or whatever is current) and NO "Cached"
        await wallet.pay("0x000000000000000000000000000000000000dEaD", "0.000001", "ETH", log);
    } catch (e: any) {
        console.log("Finished with error (expected if funds low or user cancel, but we want to see logs):", e.message);
    }
}

main();
