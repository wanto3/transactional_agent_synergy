# Transactional Agent x Micropay Synergy

## 🚀 Project Overview

This project is a technical proof-of-concept demonstrating the synergy between **Autonomous Agents** (built by Us) and **Liquidity Infrastructure** (Micropay, built by Marco). 

We are solving the critical "Last Mile" problem for AI Agents: **How do agents pay for resources, APIs, and services autonomously?**

### The Core Problem
1.  **Payment Friction**: Agents encounter paywalls (HTTP 402) but lack the context/funds to solve them instantly.
2.  **Liquidity Fragmentation**: An agent might have funds on Arbitrum, but the service demands payment on Base.
3.  **Complexity**: Embedding complex bridging/swapping logic into every agent bloats the codebase and introduces security risks.

### The Solution: "Synergy"
*   **The Agent (Client)**: Lightweight, focused on the task. It uses the **x402 Protocol** to standardise payment handling.
*   **Micropay (Infrastructure)**: The "Liquidity Engine". The agent treats Micropay as its treasury, requesting funds on-demand for specific chains.

---

## 🗺️ Roadmap & Phasing

### Phase 1: The "Base Sepolia First" approach (Current Focus)
**Goal**: Prove the Agent <-> x402 interaction is seamless on a single high-performance chain.

*   **Network**: Base Sepolia (Chain ID: 84532).
*   **Why Base?**: The native home of x402, fast, and testnet is free.
*   **Workflow**:
    1.  Agent hits a paid resource.
    2.  Receives `402 Payment Required`.
    3.  Agent handles the invoice autonomously.
    4.  **Verification**: Confirm successful payment and resource access.
*   **Status**: ✅ Simulation Complete.

### Phase 2: The "Micropay" Evolution (Future)
**Goal**: Solve the cross-chain liquidity problem.

*   **Scenario**: Agent is on Base, Service is on Optimism.
*   **Workflow**:
    1.  Agent receives 402 (Optimism USDC).
    2.  Agent checks local wallet: *Insufficient funds on Optimism*.
    3.  **Call to Micropay**: "I need 5 USDC on Optimism, I have funds on Base."
    4.  Micropay provides instant liquidity to the Agent's Optimism address.
    5.  Agent completes the x402 payment.

---

## 🏗️ Technical Architecture

### 1. **x402 Client (`src/x402`)**
A specialized HTTP client (Axios wrapper) that acts as a middleware for the agent.
*   **Interceptor**: Automatically catches `402` errors.
*   **Parser**: Extracts `amount`, `currency`, and `destination`.
*   **Executor**: Triggers the wallet to Pay & Retry.

### 2. **Smart Wallet (`src/agent`)**
The brain of the operation. It decides *how* to pay.
*   **Phase 1**: Checks local balance -> Pays.
*   **Phase 2**: Checks local balance -> Falls back to Micropay -> Pays.

### 3. **Micropay Service Interface (`src/micropay`)**
The abstraction layer for Marco's infrastructure.
```typescript
interface MicropayService {
    provideLiquidity(req: LiquidityRequest): Promise<LiquidityResponse>;
}
```

## 🛠️ Running the Simulation

We have upgraded the project to a **Next.js Web App** for a better visual experience.

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start the Dashboard**:
    ```bash
    npm run dev
    ```

3.  **Visualize**:
    Open [http://localhost:3000](http://localhost:3000) in your browser.
    Click **"Start Simulation"** to watch the Agent <-> Micropay synergy in real-time.

## 📝 Usage Example (Code Snippet)

```typescript
// The agent simply tries to 'get' data. 
// The complexity of payment is hidden in the client layers.
try {
    const data = await agent.get('https://api.premium-service.com/data');
} catch (e) {
    // 402 errors are handled automatically!
    // If code reaches here, it's a real error (404, 500, etc)
}
```
