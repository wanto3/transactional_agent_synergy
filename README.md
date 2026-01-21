# Synergy Transactional Agent

An autonomous agent that negotiates and settles payments on **Base Sepolia** using the x402 Protocol.

## ⚡️ Quick Start

### 1. Installation
```bash
# Install everything
npm install
cd railbridge_external/facilitator && npm install && cd ../..
```

### 2. Configuration
```bash
# Create Environment File
cp .env.local.template .env.local

# Edit .env.local
# 1. Get a Private Key from your wallet (e.g. MetaMask/Coinbase Wallet)
# 2. Assign it to PRIVATE_KEY (for Agent)
# 3. Assign it (or a different one) to MERCHANT_PRIVATE_KEY (for Merchant)
# NOTE: For testing on testnet, you can use the SAME key for both.
```

### 3. Run
**Option A: The Easy Way (Recommended)**
Starts both Merchant and Agent in one terminal.
```bash
npm run dev
```

**Option B: The Robust Way (Debug)**
Run services separately to see cleaner logs for each.
*   **Terminal 1**: `npm run start:merchant`
*   **Terminal 2**: `npm run dev:agent`

---

## 🛠 Features
- **Strict Verification**: Checks exact Amount + Freshness.
- **Raw RPC**: Guaranteed blockchain data accuracy.
- **Single Config**: One `.env.local` for the entire system.
