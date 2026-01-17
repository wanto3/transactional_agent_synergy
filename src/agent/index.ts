
import { RealWallet, MockWallet, Wallet } from '../x402/client';
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
        log("🤖 Synergy Agent Starting (Real Transaction Mode - Arbitrum Sepolia)...");
        log("-----------------------------------------");

        // 1. Define the task
        const amountRef = "0.0001"; // small test amount
        const currencyRef = "ETH";
        // Demo recipient (e.g. burn address or self)
        const recipientRef = "0x000000000000000000000000000000000000dEaD";

        log(`[Agent] 🎯 Task: Pay ${amountRef} ${currencyRef} to ${recipientRef}`);
        log(`[Agent] 🧠 Checks: skipping liquidity check for single-chain simple mode.`);

        // 2. Execute Payment
        try {
            log(`[Agent] 💸 Sending payment...`);
            const txHash = await this.wallet.pay(recipientRef, amountRef, currencyRef);

            log("-----------------------------------------");
            log("✅ AGENT SUCCESS");
            log(`Transaction Hash: ${txHash}`);
            log(`Explorer Link: https://sepolia.arbiscan.io/tx/${txHash}`);
            log("-----------------------------------------");
            return txHash;
        } catch (error: any) {
            log(`[Agent] ❌ Agent Failed: ${error.message}`);
            throw error;
        }
    }
}
