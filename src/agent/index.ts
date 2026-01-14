
import { X402Client, MockWallet } from '../x402/client';
import type { Wallet } from '../x402/client';
import { MockMicropayService } from '../micropay/service';
import type { MicropayService } from '../micropay/service';

export type LogCallback = (msg: string) => void;

/**
 * SmartAgentWallet that logs to a custom callback
 */
class SmartAgentWallet extends MockWallet {
    private micropay: MicropayService;
    private log: LogCallback;

    constructor(micropay: MicropayService, log: LogCallback) {
        super();
        this.micropay = micropay;
        this.log = log;
    }

    // Override the MockWallet pay log to use our callback
    override async pay(recipient: string, amount: string, currency: string): Promise<string> {
        this.log(`[AgentWallet] 🧠 Thinking: I need to pay ${amount} ${currency} on BASE SEPOLIA. Do I have enough?`);

        await new Promise(r => setTimeout(r, 800)); // Think time

        // Logic: For Phase 1 (Base Sepolia), we simulate checking local balance.
        this.log(`[AgentWallet] 💡 requesting liquidity from Micropay (Base Sepolia Pool)...`);

        const liquidityResponse = await this.micropay.provideLiquidity({
            amount: amount,
            token: currency,
            chainId: 84532, // Base Sepolia
            destinationAddress: "0x_my_agent_wallet"
        });

        if (liquidityResponse.success) {
            this.log(`[Micropay] ✅ Liquidity provided to 0x_my_agent_wallet (Tx: ${liquidityResponse.txHash})`);
        } else {
            this.log(`[Micropay] ❌ Liquidity failed.`);
        }

        this.log(`[AgentWallet] 💰 Liquidity secured! Proceeding to pay.`);

        // Custom pay logic here instead of super to capture logs nicely
        this.log(`[Wallet] 💸 Paying ${amount} ${currency} to ${recipient}...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        this.log(`[Wallet] ✅ Payment successful!`);
        return "mock_payment_proof_token_" + Date.now();
    }
}

/**
 * Main Simulation Function Generator
 * Yields log lines as they happen.
 */
export async function* simulateAgent() {
    yield "-----------------------------------------";
    yield "🤖 Synergy Agent Starting (Phase 1: Base Sepolia)...";
    yield "-----------------------------------------";

    // Helper to capture internal logs from services if we were to refactor them fully.
    // For now, we will just emit our main story logs.
    const micropay = new MockMicropayService();

    // We create a wallet that yields logs? No, generator is async.
    // We need a way to push logs out. 
    // Simplified: The wallet will call a localized log function, but we need to receive it.
    // Since we can't easily yield from a callback in a class, let's use a queue or just accept 
    // that the `SmartAgentWallet` needs to be adapted.
    // WORKAROUND: We will pass a simple push function, but since `yield` must be top level of generator, 
    // we might need to accumulate or use a proper stream.
    // EASIER: `simulateAgent` returns a ReadableStream or we use an AsyncGenerator that awaits events.

    // Let's stick to a simpler "step by step" script for the demo that just YIELDS strings directly in the flow.

    yield "🤖 Agent: Requesting access to paid resource...";
    await new Promise(r => setTimeout(r, 1000));

    yield "[X402Client] ⚠️ Received 402 Payment Required. Handling payment...";
    await new Promise(r => setTimeout(r, 800));

    yield `[AgentWallet] 🧠 Thinking: I need to pay 5.00 USDC on BASE SEPOLIA. Do I have enough?`;
    await new Promise(r => setTimeout(r, 1000));

    yield `[AgentWallet] 💡 requesting liquidity from Micropay (Base Sepolia Pool)...`;
    await new Promise(r => setTimeout(r, 800));

    yield `[Micropay] 💧 Liquidity requested: 5.00 USDC on chain 84532`;
    yield `[Micropay] ⚙️  Processing cross-chain liquidity pipeline...`;
    await new Promise(r => setTimeout(r, 1500));

    yield `[Micropay] ✅ Liquidity provided to 0x_my_agent_wallet`;
    yield `[AgentWallet] 💰 Liquidity secured! Proceeding to pay.`;
    await new Promise(r => setTimeout(r, 800));

    yield `[Wallet] 💸 Paying 5.00 USDC to 0x_service_provider...`;
    await new Promise(r => setTimeout(r, 1000));
    yield `[Wallet] ✅ Payment successful!`;

    yield `[X402Client] 🔄 Retrying request with payment proof...`;
    await new Promise(r => setTimeout(r, 1000));

    yield "-----------------------------------------";
    yield "✅ AGENT SUCCESS";
    yield "Protected Data: { 'secret': 'The sky is blue', 'tier': 'premium' }";
    yield "-----------------------------------------";
}
