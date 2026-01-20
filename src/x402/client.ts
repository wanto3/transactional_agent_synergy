import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { createWalletClient, http, parseEther, type WalletClient as ViemWalletClient, publicActions, stringToHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

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

    async pay(recipient: string, amount: string, currency: string, log?: (msg: string) => void): Promise<string> {
        const logger = (msg: string) => {
            console.log(msg);
            if (log) log(msg);
        };
        logger(`[RealWallet] 💸 Initiating real transaction: ${amount} ${currency} to ${recipient}`);

        const address = this.client.account.address;
        const value = parseEther(amount);
        let attempt = 0;
        const maxAttempts = 5; // Increased retry limit
        let nextNonce: number | null = null;

        while (attempt < maxAttempts) {
            attempt++;

            let count: number;

            if (nextNonce !== null) {
                // If we have a corrected nonce from a previous error, use it
                count = nextNonce;
                logger(`[RealWallet] 🔢 Nonce Check (Attempt ${attempt}) [${new Date().toISOString()}] -> Using CORRECTED nonce: ${count}`);
            } else {
                // Otherwise fetch fresh from RPC
                const rpcNonce = await this.client.getTransactionCount({
                    address: address,
                    blockTag: 'pending'
                });
                count = rpcNonce;
                logger(`[RealWallet] 🔢 Nonce Check (Attempt ${attempt}) [${new Date().toISOString()}] -> RPC: ${rpcNonce}, USING: ${count}`);
            }

            try {
                // We add unique data to ensure the transaction hash is always new.
                // This prevents "replay" of old transaction hashes if parameters are identical.
                // If the nonce is stale (already used), this unique tx will trigger "Nonce too low",
                // enabling our retry logic to increment and find the real nonce.
                const uniqueData = stringToHex(`Synergy-Run-${Date.now()}-${Math.floor(Math.random() * 10000)}`);

                const hash = await this.client.sendTransaction({
                    to: recipient as `0x${string}`,
                    value: value,
                    nonce: count,
                    data: uniqueData,
                });

                logger(`[RealWallet] 🚀 Transaction sent! Hash: ${hash}`);
                logger(`[RealWallet] ⏳ Waiting for confirmation...`);

                const receipt = await this.client.waitForTransactionReceipt({ hash });

                if (receipt.status === 'success') {
                    logger(`[RealWallet] ✅ Transaction confirmed in block ${receipt.blockNumber}`);
                    return hash;
                } else {
                    throw new Error(`Transaction failed with status: ${receipt.status}`);
                }
            } catch (error: any) {
                logger(`[RealWallet] ⚠️ Transaction Attempt ${attempt} failed: ${error.message}`);

                // Check for "Nonce too low" or "Replacement transaction underpriced" / "already known"
                const isNonceError = error.message?.includes("nonce too low") ||
                    error.message?.includes("nonce usage") ||
                    error.message?.includes("replacement transaction underpriced") ||
                    error.message?.includes("already known");

                if (isNonceError) {
                    logger(`[RealWallet] 🔁 Detected Nonce Error. Correction needed.`);

                    // Parse "state: 10" from error if present (Arbitrum/Geth specific)
                    const stateMatch = error.message.match(/state:\s*(\d+)/) || error.message.match(/want\s*(\d+)/);
                    if (stateMatch && stateMatch[1]) {
                        const correctNonce = parseInt(stateMatch[1], 10);
                        logger(`[RealWallet] 🔧 Extracted correct nonce from network: ${correctNonce}`);
                        nextNonce = correctNonce;
                    } else {
                        // Blind increment if we can't parse
                        logger(`[RealWallet] 🔧 Could not parse nonce. Blindly incrementing.`);
                        nextNonce = count + 1;
                    }

                    // Continue to next loop iteration
                    continue;
                }

                // If not a nonce error, rethrow immediately
                throw error;
            }
        }
        throw new Error("Max retry attempts reached for transaction.");
    }
}

export class X402Client {
    private client: AxiosInstance;
    private wallet: Wallet;
    private log: (msg: string) => void;

    constructor(baseUrl?: string, wallet?: Wallet, logCallback?: (msg: string) => void) {
        this.client = axios.create({
            baseURL: baseUrl || '',
        });
        this.wallet = wallet || new MockWallet();
        this.log = logCallback || ((msg) => console.log(msg));

        this.setupInterceptors();
    }

    private setupInterceptors() {
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                if (error.response && error.response.status === 402) {
                    this.log(`[HTTP 402] 🛑 Payment Required`);
                    const payHeader = error.response.headers['payment-required'];
                    const authHeader = error.response.headers['www-authenticate'];

                    if (payHeader) {
                        this.log(`[X402Client] 📥 Header 'Payment-Required' found.`);
                    } else if (authHeader) {
                        this.log(`[X402Client] 📥 Header 'WWW-Authenticate': ${authHeader}`);
                    }

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
            paymentReq.currency,
            this.log
        );
        this.log(`[X402Client] 🧾 Payment Proof Generated: ${proof}`);
        this.log(`[X402Client] Explorer Link: https://sepolia.basescan.org/tx/${proof}`);

        // 3. Attach Proof to Headers and Retry
        const retryHeaders = {
            ...originalRequest.headers,
            'Authorization': `402 ${proof}`, // Standard Auth Scheme
            'Payment-Signature': proof       // Coinbase specific
        };
        originalRequest.headers = retryHeaders as any;

        this.log(`[X402Client] 📤 Sending Retry (Headers):`);
        this.log(JSON.stringify({
            'Payment-Signature': proof
        }));

        this.log(`[X402Client] 🔄 Retrying request...`);
        return this.client(originalRequest);
    }

    private parsePaymentRequirements(response: AxiosResponse): PaymentRequirement | null {
        // Strategy 1: Check 'Payment-Required' Header (Coinbase Standard)
        const payHeader = response.headers['payment-required'];
        if (payHeader) {
            try {
                // Sometimes it's a JSON string
                const data = typeof payHeader === 'string' ? JSON.parse(payHeader) : payHeader;
                if (data.amount && data.address) {
                    return {
                        url: data.url || '',
                        amount: data.amount,
                        currency: data.currency || 'ETH',
                        recipientAddress: data.address
                    };
                }
            } catch (e) {
                this.log(`[X402Client] ⚠️ Could not parse Payment-Required header json`);
            }
        }

        // Strategy 2: Check Body (Fallback / Simple implementations)
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

export class MockWallet implements Wallet {
    async pay(recipient: string, amount: string, currency: string, log?: (msg: string) => void): Promise<string> {
        if (log) log(`[MockWallet] ⚠️ Simulating payment of ${amount} ${currency} to ${recipient}`);
        console.log(`[MockWallet] ⚠️ Simulating payment of ${amount} ${currency} to ${recipient}`);
        await new Promise(r => setTimeout(r, 1000));
        return "0xMOCK_TRANSACTION_HASH_" + Date.now();
    }
}

export interface Wallet {
    pay(recipient: string, amount: string, currency: string, log?: (msg: string) => void): Promise<string>;
}

interface PaymentRequirement {
    url: string;
    amount: string;
    currency: string;
    recipientAddress: string;
}
