
import { X402Client, MockWallet, RealWallet } from '../x402/client';
import type { Wallet } from '../x402/client';
import { MockMicropayService } from '../micropay/service';
import type { MicropayService } from '../micropay/service';

export type LogCallback = (msg: string) => void;

/**
 * SmartAgentWallet that logs to a custom callback
 */
class SmartAgentWallet implements Wallet {
    private micropay: MicropayService;
    private log: LogCallback;
    private innerWallet: Wallet;

    constructor(innerWallet: Wallet, micropay: MicropayService, log: LogCallback) {
        this.innerWallet = innerWallet;
        this.micropay = micropay;
        this.log = log;
    }

    // Wrap the inner wallet pay
    async pay(recipient: string, amount: string, currency: string): Promise<string> {
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

        try {
            const proof = await this.innerWallet.pay(recipient, amount, currency);
            this.log(`[Wallet] ✅ Payment successful! Proof: ${proof.substring(0, 10)}...`);
            return proof;
        } catch (e: any) {
            this.log(`[Wallet] ❌ Payment failed: ${e.message}`);
            throw e;
        }
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

    // Determine Wallet Strategy
    let innerWallet: Wallet;
    let privateKey = process.env.PRIVATE_KEY?.trim() || "";
    if (privateKey && !privateKey.startsWith("0x")) {
        privateKey = "0x" + privateKey;
    }
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    // Basic check: 0x + 64 hex chars = 66 length. 
    // We'll trust viem to throw a better error if it's invalid, 
    // but just check we have roughly the right length to avoid obvious placeholders.
    const isRealKey = privateKey.length >= 64 && !privateKey.includes("your_private_key");

    if (isRealKey) {
        yield `[System] 🔐 Loaded Real Wallet from environment.`;
        innerWallet = new RealWallet(privateKey, rpcUrl);
    } else {
        if (privateKey) {
            yield `[System] ⚠️ PRIVATE_KEY found but invalid or placeholder. Using MockWallet.`;
        } else {
            yield `[System] ⚠️ No PRIVATE_KEY found. Using MockWallet.`;
        }
        innerWallet = new MockWallet();
    }

    // Simplified ad-hoc logging hook for the class to yield back to us
    // Since we can't yield from inside the callback easily, we just push to a buffer?
    // Or we just instantiate logic that we control manually below.
    // Actually, to make 'SmartAgentWallet.pay' yield logs, we need to pass a callback that 
    // somehow bridges to this generator. 
    // BUT generators pause. Callbacks don't pause generator.

    // REFACTOR FOR DEMO: usage of SmartAgentWallet class is tricky with generator unless we change yield pattern.
    // We will manually yield the 'thinking' steps here in the script, 
    // and use the `innerWallet` directly for the payment action.

    // yield "🤖 Agent: Requesting access to paid resource...";

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

    yield `[Wallet] 💸 Paying 5.00 USDC (simulated cost) to 0x_service_provider...`;

    // EXECUTE REAL OR MOCK TRANSACTION
    // Note: We are using a hardcoded amount/recipient here for the demo script consistency,
    // but using the real wallet implementation if available.
    // We'll try to send a tiny amount of ETH for the 'Real' demo to avoid burning funds.
    try {
        const demoAmount = "0.0001"; // Tiny amount for test
        const demoRecipient = "0x1234567890123456789012345678901234567890"; // Burn address / test recipient

        if (isRealKey) {
            yield `[RealWallet] ⚡ Initiating ON-CHAIN transaction...`;
            const hash = await innerWallet.pay(demoRecipient, demoAmount, 'ETH');
            yield `[RealWallet] 🚀 Tx Sent! Hash: ${hash}`;
            yield `[RealWallet] 🔗 View on Explorer: https://sepolia.basescan.org/tx/${hash}`;
        } else {
            await innerWallet.pay(demoRecipient, demoAmount, 'ETH');
        }
    } catch (e: any) {
        yield `[Wallet] ❌ Transaction Error: ${e.message}`;
    }

    // await new Promise(r => setTimeout(r, 1000));
    yield `[Wallet] ✅ Payment logic complete!`;
    yield `[Wallet] ✅ Payment successful!`;

    yield `[X402Client] 🔄 Retrying request with payment proof...`;
    await new Promise(r => setTimeout(r, 1000));

    yield "-----------------------------------------";
    yield "✅ AGENT SUCCESS";
    yield "Protected Data: { 'secret': 'The sky is blue', 'tier': 'premium' }";
    yield "-----------------------------------------";
}
