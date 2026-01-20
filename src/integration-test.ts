
import fs from 'fs';
import path from 'path';
import { RealWallet, X402Client } from './x402/client';

// 1. Env Loader
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

async function runIntegrationTest() {
    console.log("🚀 Starting Integration Test: Transactional Agent vs RailBridge Merchant");

    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

    if (!privateKey) {
        console.error("❌ PRIVATE_KEY missing");
        process.exit(1);
    }

    // Initialize Agent
    const wallet = new RealWallet(privateKey, rpcUrl);
    const client = new X402Client('', wallet, (msg) => console.log(`[Agent] ${msg}`));

    // Target RailBridge Merchant
    const merchantUrl = "http://localhost:4021/api/premium";
    console.log(`🎯 Targeting: ${merchantUrl}`);

    try {
        console.log("---------------------------------------------------");
        console.log("📡 Sending request (expecting 402 -> Payment -> 200)...");
        const response = await client.get(merchantUrl);

        console.log("---------------------------------------------------");
        console.log(`✅ Response Status: ${response.status}`);
        console.log("📦 Data:", JSON.stringify(response.data, null, 2));

        if (response.status === 200) {
            console.log("🎉 INTEGRATION SUCCESSFUL!");
        } else {
            console.log("❌ INTEGRATION FAILED (Status not 200)");
        }

    } catch (error: any) {
        console.error("❌ Test Failed:", error.message);
        if (error.response) {
            console.error("Response Status:", error.response.status);
            console.error("Response Data:", error.response.data);
        }
    }
}

runIntegrationTest();
