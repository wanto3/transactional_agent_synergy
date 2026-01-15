
import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { createWalletClient, http, parseEther, type WalletClient as ViemWalletClient, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

/**
 * Interface representing the payment details extracted from a 402 response.
 */
interface PaymentRequirement {
    url: string; // The URL to send payment to or metadata about payment
    amount: string;
    currency: string;
    recipientAddress: string;
}

/**
 * Mock Wallet Interface
 */
export interface Wallet {
    pay(recipient: string, amount: string, currency: string): Promise<string>;
}

export class MockWallet implements Wallet {
    async pay(recipient: string, amount: string, currency: string): Promise<string> {
        console.log(`[Wallet] 💸 Paying ${amount} ${currency} to ${recipient}...`);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`[Wallet] ✅ Payment successful!`);
        return "mock_payment_proof_token_" + Date.now();
    }
}

export class RealWallet implements Wallet {
    private client;

    constructor(privateKey: string, rpcUrl?: string) {
        const account = privateKeyToAccount(privateKey as `0x${string}`);
        this.client = createWalletClient({
            account,
            chain: baseSepolia,
            transport: http(rpcUrl || 'https://sepolia.base.org')
        }).extend(publicActions);
    }

    async pay(recipient: string, amount: string, currency: string): Promise<string> {
        console.log(`[RealWallet] 💸 Initiating real transaction: ${amount} ${currency} to ${recipient}`);

        // Simple heuristic: assume amount is in ETH/Standard Unit. 
        // In a real generic agent, we'd need a token map.
        // For this demo, we assume currency='ETH' or 'USDC' implies native/token transfer.
        // SIMPLIFICATION: We will treat everything as native ETH transfer for Base Sepolia demo if 'amount' is small.
        // OR we just parseEther.

        try {
            const hash = await this.client.sendTransaction({
                to: recipient as `0x${string}`,
                value: parseEther(amount),
            });

            console.log(`[RealWallet] 🚀 Transaction sent! Hash: ${hash}`);
            console.log(`[RealWallet] ⏳ Waiting for confirmation...`);

            const receipt = await this.client.waitForTransactionReceipt({ hash });

            console.log(`[RealWallet] ✅ Transaction confirmed in block ${receipt.blockNumber}`);
            return hash;
        } catch (error) {
            console.error(`[RealWallet] ❌ Transaction failed:`, error);
            throw error;
        }
    }
}

export class X402Client {
    private client: AxiosInstance;
    private wallet: Wallet;

    constructor(baseUrl?: string, wallet?: Wallet) {
        this.client = axios.create({
            baseURL: baseUrl || '',
        });
        this.wallet = wallet || new MockWallet();

        this.setupInterceptors();
    }

    private setupInterceptors() {
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                if (error.response && error.response.status === 402) {
                    console.log("[X402Client] ⚠️ Received 402 Payment Required. Handling payment...");
                    return this.handle402(error);
                }
                return Promise.reject(error);
            }
        );
    }

    private async handle402(error: AxiosError): Promise<AxiosResponse> {
        const originalRequest = error.config!;

        // 1. Parse Payment Requirements from Response
        // NOTE: This logic depends heavily on how the server sends 402 details.
        // Common patterns include 'WWW-Authenticate' header or a JSON body.
        // We will assume a JSON body for this synergy test unless standard headers are found.
        const paymentReq = this.parsePaymentRequirements(error.response!);

        if (!paymentReq) {
            throw new Error("Could not parse payment requirements from 402 response");
        }

        // 2. Execute Payment
        const proof = await this.wallet.pay(
            paymentReq.recipientAddress,
            paymentReq.amount,
            paymentReq.currency
        );

        // 3. Attach Proof to Headers and Retry
        // Standard might be 'Authorization: L402 <token>' or custom headers.
        if (!originalRequest.headers) {
            originalRequest.headers = {} as any;
        }
        originalRequest.headers['Authorization'] = `L402 ${proof}`;
        originalRequest.headers['X-Payment-Token'] = proof; // Redundant backup

        console.log(`[X402Client] 🔄 Retrying request with payment proof...`);
        return this.client(originalRequest);
    }

    private parsePaymentRequirements(response: AxiosResponse): PaymentRequirement | null {
        // Strategy 1: Check standard headers (simplistic view)
        const authHeader = response.headers['www-authenticate'];
        if (authHeader) {
            // Parse logic for header if needed
        }

        // Strategy 2: Check Body (easier for custom agent APIs)
        const data = response.data;
        if (data && data.amount && data.address) {
            return {
                url: data.url || '',
                amount: data.amount,
                currency: data.currency || 'USDC',
                recipientAddress: data.address
            };
        }

        return null;
    }

    // Public API to make requests
    public async get(url: string, config?: AxiosRequestConfig) {
        return this.client.get(url, config);
    }

    public async post(url: string, data?: any, config?: AxiosRequestConfig) {
        return this.client.post(url, data, config);
    }
}
