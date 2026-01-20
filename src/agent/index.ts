
import { RealWallet, X402Client } from '../x402/client';
import { MockMicropayService, MicropayService } from '../micropay/service';

export interface AgentConfig {
    privateKey?: string;
    rpcUrl?: string;
    useRealWallet: boolean;
}

export class TransactionalAgent {
    private wallet: RealWallet;
    // private micropay: MicropayService; 

    constructor(config: AgentConfig) {
        // Initialize Micropay (Mock for now as per plan)
        // this.micropay = new MockMicropayService();

        // Initialize Wallet
        if (config.useRealWallet && config.privateKey) {
            console.log("[Agent] 🔐 Initializing Real Wallet...");
            let pk = config.privateKey.trim();
            // Prefix check is handled inside RealWallet now, but safe to keep or remove.
            // keeping it simple.
            this.wallet = new RealWallet(pk, config.rpcUrl);
        } else {
            console.log("[Agent] ⚠️ Real Wallet required for RailBridge Integration.");
            throw new Error("Real Wallet required for RailBridge Integration");
        }
    }

    /**
     * Executes the main agent workflow: Check -> Pay
     */
    async run(logCallback?: (msg: string) => void) {
        const log = (msg: string) => {
            console.log(msg); // Keep server console log
            if (logCallback) logCallback(msg);
        };

        log("-----------------------------------------");
        log("🤖 Synergy Agent Starting (RailBridge x402 Mode)...");
        log("-----------------------------------------");

        // 1. Initialize X402 Client
        // Pointing to RailBridge Merchant Server on Port 4021
        const merchantUrl = "http://localhost:4021";
        const x402 = new X402Client(merchantUrl, this.wallet, log);

        // 2. Execution Loop
        try {
            log(`[Agent] 🎯 Task: Access Premium Content at ${merchantUrl}/api/premium`);
            log(`[Agent] 🚀 Sending GET request...`);

            // This single line triggers the entire 402 negotiation flow
            const response = await x402.get("/api/premium");

            log("-----------------------------------------");
            log("✅ AGENT SUCCESS");
            log(`[HTTP ${response.status}] 🟢 Content Access Granted`);

            if (response.data && typeof response.data === 'object') {
                log(`Content Accessed: "${response.data.message}"`);
                log(`Data: ${JSON.stringify(response.data.data)}`);
            } else {
                log(`Data: ${response.data}`);
            }

            log("-----------------------------------------");
            return "SUCCESS";
        } catch (error: any) {
            log(`[Agent] ❌ Agent Failed: ${error.message}`);
            if (error.response) {
                log(`[Agent] Status: ${error.response.status}`);
                log(`[Agent] Data: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }

    }
}
