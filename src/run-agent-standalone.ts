
import fs from 'fs';
import path from 'path';
import { createWalletClient, http, parseEther, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

// ----------------------
// 1. Env Loader (Manual)
// ----------------------
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf-8');
            content.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2 && !line.trim().startsWith('#')) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim();
                    process.env[key] = value;
                }
            });
            console.log("✅ Loaded .env.local");
        } else {
            console.warn("⚠️ .env.local not found");
        }
    } catch (e) {
        console.error("Failed to load .env.local", e);
    }
}

loadEnv();

// ----------------------
// 2. RealWallet Implementation
// ----------------------
class RealWallet {
    private client: any;

    constructor(privateKey: string, rpcUrl?: string) {
        const account = privateKeyToAccount(privateKey as `0x${string}`);
        this.client = createWalletClient({
            account,
            chain: baseSepolia,
            transport: http(rpcUrl || 'https://sepolia.base.org')
        }).extend(publicActions);
    }

    async pay(recipient: string, amount: string, currency: string): Promise<string> {
        console.log(`[RealWallet] 💸 Initiating real transaction: ${amount} ${currency} (Arbitrum Sepolia) to ${recipient}`);

        try {
            const value = parseEther(amount);
            const hash = await this.client.sendTransaction({
                to: recipient as `0x${string}`,
                value: value,
            });

            console.log(`[RealWallet] 🚀 Transaction sent! Hash: ${hash}`);
            console.log(`[RealWallet] ⏳ Waiting for confirmation...`);

            const receipt = await this.client.waitForTransactionReceipt({ hash });

            if (receipt.status === 'success') {
                console.log(`[RealWallet] ✅ Transaction confirmed in block ${receipt.blockNumber}`);
                return hash;
            } else {
                throw new Error(`Transaction failed with status: ${receipt.status}`);
            }
        } catch (error: any) {
            console.error(`[RealWallet] ❌ Transaction failed:`, error.message || error);
            throw error;
        }
    }
}

// ----------------------
// 3. Agent Application
// ----------------------
async function runAgent() {
    console.log("-----------------------------------------");
    console.log("🤖 Synergy Agent Starting (Single Chain - Arbitrum Sepolia)...");
    console.log("-----------------------------------------");

    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

    if (!privateKey || privateKey.includes("your_private_key")) {
        console.error("❌ Error: PRIVATE_KEY is missing or invalid in .env.local");
        process.exit(1);
    }

    const wallet = new RealWallet(privateKey, rpcUrl);

    // Task definition
    const amount = "0.0001";
    const currency = "ETH";
    const recipient = "0x000000000000000000000000000000000000dEaD"; // Demo recipient

    console.log(`[Agent] 🎯 Task: Pay ${amount} ${currency} to ${recipient}`);

    try {
        const txHash = await wallet.pay(recipient, amount, currency);

        console.log("-----------------------------------------");
        console.log("✅ AGENT SUCCESS");
        console.log(`Transaction Hash: ${txHash}`);
        console.log(`Explorer Link: https://sepolia.basescan.org/tx/${txHash}`);
        console.log("-----------------------------------------");
    } catch (e) {
        console.error("Agent failed.");
        process.exit(1);
    }
}

// Execute
runAgent();
