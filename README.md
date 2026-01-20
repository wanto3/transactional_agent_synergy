# Synergy Transactional Agent

An autonomous agent that negotiates and settles payments on **Base Sepolia** using the x402 Protocol.

## ⚡️ Quick Start

### 1. Setup (One-Time)
```bash
# Install everything
npm install
cd railbridge_external/facilitator && npm install && cd ../..

# Configure Env
cp .env.template .env.local
# Edit .env.local with your Private Key(s) (Agent & Merchant)
```

### 2. Run
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
