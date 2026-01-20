# Synergy Transactional Agent

An autonomous agent that negotiates and settles payments on **Base Sepolia** using the x402 Protocol.

## ⚡️ Quick Start

You need two terminals to run the system (Survivor vs Merchant).

### 1. Setup (First time only)
```bash
npm install
cd railbridge_external/facilitator && npm install && cd ../..
# Create .env.local with PRIVATE_KEY=0x...
```

### 2. Run It

**Terminal 1: Start the Merchant** (The Seller)
```bash
npm run start:merchant
```

**Terminal 2: Start the Agent** (The Buyer)
```bash
npm run dev
```

Then open **http://localhost:3000** and click the "Pay" button.

---

### Verification (Optional)
If you want to test the backend logic without the UI:
```bash
npm run test:integration
```

## 🛠 Features
- **Strict Verification**: The agent checks the exact **Amount** and **Time** of the transaction.
- **Raw RPC**: Bypasses caching for guaranteed freshness.
- **Request IDs**: logs every payment with a unique `[Req:ID]`.
