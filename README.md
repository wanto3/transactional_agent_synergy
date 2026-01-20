# Synergy Transactional Agent

A Next.js-based autonomous agent capable of negotiating and settling payments using the **x402 Protocol** on **Base Sepolia**.

## 🚀 Features
- **x402 Payment Integration**: Automatically handles 402 Payment Required responses, negotiates payment terms, and settles transactions.
- **Robust Transaction Tracking**: Uses advanced polling, raw RPC calls, and **strict amount verification** to reliably detect "fresh" transactions, ensuring the agent never confuses its payment with others.
- **Real Wallet Integration**: Uses `viem` to securely sign and send USDC/ETH transactions on Base Sepolia.
- **Live UI Streaming**: Real-time logs and transaction explorer links streamed to the frontend.

## 🛠️ Prerequisites
- **Node.js** (v18+ recommended)
- **Base Sepolia ETH**: For gas fees. [Get from Faucet](https://faucet.quicknode.com/base/sepolia).
- **Test USDC**: If testing USDC payments (optional, depending on merchant config).

## 📦 Setup Instructions

1.  **Install Dependencies**
    ```bash
    npm install
    # Install dependencies for the merchant server (submodule)
    cd railbridge_external/facilitator
    npm install
    cd ../..
    ```

2.  **Configure Environment**
    Create a `.env.local` file in the root directory:
    ```bash
    # Required: Your Wallet Private Key (start with 0x)
    PRIVATE_KEY=your_private_key_here
    
    # Optional: Custom RPC URL
    # NEXT_PUBLIC_RPC_URL=...
    ```

## ▶️ How to Run

### 1. Start the Merchant Server (Receiver)
The agent needs a merchant to pay. We use the included RailBridge facilitator reference implementation.
```bash
cd railbridge_external/facilitator
npm run dev
# Server runs at http://localhost:4021
```

### 2. Run the Verification Test (Recommended)
Before running the full UI, verify the payment flow and transaction hash detection using the integration script.
```bash
# In the root directory
npx tsx src/integration-test.ts
```
This script will:
- Attempt to access `http://localhost:4021/api/premium`.
- Receive a `402 Payment Required`.
- Negotiate and pay using your wallet.
- **Verify** that the returned transaction hash is fresh and valid.

### 3. Start the Agent UI
```bash
npm run dev
# Agent runs at http://localhost:3000
```
Open `http://localhost:3000` and look for the **Pay RailBridge Merchant** button/action.

## 🧪 Advanced Debugging

### Request Tracing
The agent logs include a unique **Request ID** (e.g., `[Req:8271]`) for every payment attempt. Use this ID to match the "Start Block" with the found "Transaction Hash" in the logs to confirm freshness.

### Test Scripts
- `src/integration-test.ts`: Full end-to-end payment test.
- `src/check-balance.ts`: Simple utility to check your wallet's ETH and USDC balance on Base Sepolia.
