# Synergy Transactional Agent

A Next.js-based autonomous agent capable of performing real blockchain transactions on **Arbitrum Sepolia**.

## 🚀 Features
- **Real Wallet Integration**: Uses `viem` to securely sign and send transactions.
- **Agent Workflow**: Defined tasks that are executed autonomously.
- **Live UI Streaming**: Real-time logs streamed from the server to the frontend via Server-Sent Events (SSE).

## 🛠️ Prerequisites
- **Node.js** (v18+ recommended)
- **Arbitrum Sepolia ETH**: You need testnet ETH in your wallet. [Get some here](https://faucet.quicknode.com/arbitrum/sepolia).

## 📦 Setup Instructions

1.  **Clone/Open the project**
2.  **Install Dependencies**
    ```bash
    npm install
    ```
3.  **Configure Environment**
    Create a `.env.local` file in the root directory:
    ```bash
    # Required: Your Wallet Private Key (with or without 0x prefix)
    PRIVATE_KEY=your_private_key_here

    # Optional: Custom RPC URL (defaults to public Arbitrum Sepolia RPC)
    NEXT_PUBLIC_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
    ```

## ▶️ How to Run
1.  Start the development server:
    ```bash
    npm run dev
    ```
2.  Open your browser to the URL shown in the terminal (usually `http://localhost:3000`).

## 🧪 Testing
1.  Click the **Pay 0.0001 ETH (Arbitrum)** button.
2.  The UI will show the agent's progress:
    - initializing wallet...
    - sending transaction...
    - **Success!** (with a link to the transaction on Arbiscan)

## 📁 Project Structure
- `src/agent/index.ts`: The core agent logic.
- `src/x402/client.ts`: Wallet implementation (Real & Mock).
- `src/app/api/stream/route.ts`: API endpoint for running the agent.
- `src/app/page.tsx`: Frontend UI.
