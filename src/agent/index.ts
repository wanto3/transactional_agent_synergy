
import { RealWallet, MockWallet, Wallet, X402Client } from '../x402/client';
import { MockMicropayService, MicropayService } from '../micropay/service';

export interface AgentConfig {
    privateKey?: string;
    rpcUrl?: string;
    useRealWallet: boolean;
}

export class TransactionalAgent {
    private wallet: Wallet;
    private micropay: MicropayService;

    constructor(config: AgentConfig) {
        // Initialize Micropay (Mock for now as per plan)
        this.micropay = new MockMicropayService();

        // Initialize Wallet
        if (config.useRealWallet && config.privateKey) {
            console.log("[Agent] 🔐 Initializing Real Wallet...");
            let pk = config.privateKey.trim();
            if (!pk.startsWith("0x")) {
                pk = "0x" + pk;
            }
            this.wallet = new RealWallet(pk, config.rpcUrl);
        } else {
            console.log("[Agent] ⚠️ Using Mock Wallet (Check PRIVATE_KEY)");
            this.wallet = new MockWallet();
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
        log("🤖 Synergy Agent Starting (x402 Protocol Mode)...");
        log("-----------------------------------------");

        // 1. Initialize X402 Client
        const x402 = new X402Client("http://localhost:3000", this.wallet, log);

        // 2. Execution Loop
        try {
            log(`[Agent] 🎯 Task: Access Premium Content at /api/premium`);
            log(`[Agent] 🚀 Sending GET request...`);

            // This single line triggers the entire 402 negotiation flow
            const response = await x402.get("/api/premium");

            log("-----------------------------------------");
            log("✅ AGENT SUCCESS");
            log(`[HTTP 200] 🟢 Content Access Granted`);
            log(`Content Accessed: "${response.data.message}"`);
            log(`Data: ${response.data.data}`);
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
