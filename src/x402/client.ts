import { createWalletClient, http, publicActions, keccak256, createPublicClient, parseAbiItem } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import crypto from 'crypto';

if (!globalThis.crypto) {
    globalThis.crypto = crypto as any;
}

import { x402Client } from '@x402/core/client';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { wrapFetchWithPayment } from '@x402/fetch';
import type { PaymentRequirements } from '@x402/core/types';

export class RealWallet {
    public client;
    public account;

    constructor(privateKey: string, rpcUrl?: string) {
        const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
        this.account = privateKeyToAccount(formattedKey as `0x${string}`);
        this.client = createWalletClient({
            account: this.account,
            chain: baseSepolia,
            transport: http(rpcUrl || 'https://sepolia.base.org')
        }).extend(publicActions);
    }

    // Legacy method for compatibility if needed, but x402 client handles payment now
    async pay(recipient: string, amount: string, currency: string, log?: (msg: string) => void): Promise<string> {
        throw new Error("Direct pay not supported in refactored client. Use X402Client.get()");
    }
}

export class X402Client {
    private x402: x402Client;
    private log: (msg: string) => void;
    private currentOptions: any = null; // Store selected options for hash lookup

    private baseUrl: string;
    private walletAddress: string;

    constructor(baseUrl: string, wallet: RealWallet, logCallback?: (msg: string) => void) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Normalize base URL
        this.log = logCallback || ((msg) => console.log(msg));
        this.walletAddress = wallet.account.address;

        // Initialize x402 Client with a simple network selector
        this.x402 = new x402Client((_version, options) => {
            this.log(`[X402Client] 📋 Available payment options: ${JSON.stringify(options)}`);
            // Prefer Base Sepolia
            const preferred = options.find(o => o.network === 'eip155:84532') || options[0];
            this.log(`[X402Client] ✨ Selected option: ${preferred.network} (${preferred.amount} ${preferred.asset || 'ETH'})`);

            // Capture chosen options for later use in hash lookup
            this.currentOptions = preferred;

            return preferred;
        });

        // Register EVM scheme with a wrapped signer (Account) to capture the transaction hash
        // We intercept ALL signing methods to see what is actually used
        const originalSigner = wallet.account;
        const loggingSigner = {
            ...originalSigner,
            // Intercept signTransaction
            signTransaction: async (args: any) => {
                this.log(`[X402Client] ✍️ Signing TRANSACTION...`);
                // Force log directly to stdout to bypass any buffering issues
                console.log(`[X402Client] ✍️ Signing TRANSACTION...`);
                const signed = await originalSigner.signTransaction(args);
                try {
                    const txHash = keccak256(signed);
                    this.log(`[X402Client] 🧾 Transaction Hash: ${txHash}`);
                    this.log(`[X402Client] 🔗 Explorer: https://sepolia.basescan.org/tx/${txHash}`);
                    console.log(`[X402Client] 🧾 Transaction Hash: ${txHash}`);
                } catch (err) { this.log(`[X402Client] ⚠️ Hash calc failed: ${err}`); }
                return signed;
            },
            // Intercept signMessage
            signMessage: async (args: any) => {
                this.log(`[X402Client] ✍️ Signing MESSAGE...`);
                console.log(`[X402Client] ✍️ Signing MESSAGE...`);
                this.log(`[X402Client] ℹ️ Message: ${args.message}`);
                return originalSigner.signMessage(args);
            },
            // Intercept signTypedData
            signTypedData: async (args: any) => {
                this.log(`[X402Client] ✍️ Signing TYPED DATA...`);
                console.log(`[X402Client] ✍️ Signing TYPED DATA...`);
                this.log(`[X402Client] ℹ️ Domain: ${JSON.stringify(args.domain)}`);
                return originalSigner.signTypedData(args);
            }
        };

        registerExactEvmScheme(this.x402, {
            signer: loggingSigner
        });

        this.log("[X402Client] 🚀 x402 Client setup complete with EVM scheme");
    }

    public async get(endpoint: string) {
        const requestId = Math.floor(Math.random() * 10000);
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
        this.log(`[X402Client] [Req:${requestId}] 📤 GET ${url}`);
        const startTime = Date.now();

        // Capture start block to ensure we only find NEW transactions
        let startBlock: bigint | undefined;
        try {
            // Force fresh block fetch using raw RPC call to bypass any viem/transport caching
            const rpcUrl = 'https://sepolia.base.org';
            const blockResponse = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_blockNumber',
                    params: [],
                    id: requestId // Use request ID to trace this specific call
                })
            });
            const blockData = await blockResponse.json();
            startBlock = BigInt(blockData.result);
            this.log(`[X402Client] [Req:${requestId}] ⏱️ Start Block (Raw RPC): ${startBlock}`);
        } catch (e) {
            this.log(`[X402Client] [Req:${requestId}] ⚠️ Could not get start block: ${e}`);
        }

        // Wrap fetch
        const fetchWithPayment = wrapFetchWithPayment(fetch, this.x402);

        try {
            const response = await fetchWithPayment(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            this.log(`[X402Client] 📥 Response Status: ${response.status}`);

            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (response.ok) {
                // If payment successful, try to find the transaction hash from the blockchain
                // because the x402 protocol / facilitator might not return it directly in the response
                try {
                    this.log("[X402Client] 🔍 Searching for transaction hash on-chain...");

                    // Create a public client to query logs
                    const publicClient = createPublicClient({
                        chain: baseSepolia,
                        transport: http()
                    });

                    // Get latest block
                    const blockNumber = await publicClient.getBlockNumber();

                    // Look back 10 blocks (approx 20-30 seconds) for Transfer events
                    // From: Payer (wallet.account.address), To: PayTo (options.payTo)

                    if (this.currentOptions && this.currentOptions.asset && this.currentOptions.payTo) {
                        const tokenAddress = this.currentOptions.asset as `0x${string}`;
                        // We need access to the wallet address kept in the closure or passed in. 
                        // Wait, 'wallet' argument in constructor is not stored in 'this'. 
                        // But we registered the signer! 'this.x402' has the scheme registered.
                        // Actually, let's just assume we can get it from the signer we wrapped earlier?
                        // The wrapper 'loggingSigner' wrapped 'wallet.account'. 
                        // We can't easily access 'wallet.account' here unless we stored it.
                        // Let's modify the class to store the wallet address in constructor.

                        // NOTE: For this specific block replacement to work without changing constructor signature again,
                        // I will rely on `this.walletAddress` which I will add in a separate edit or assume.
                        // Actually, I can't add a property easily in a middle-of-file edit if I didn't add it in constructor.
                        // I will assume `(this as any).walletAddress` is available after I patch the constructor,
                        // OR better: I'll just use the property I added in the previous edit to `X402Client`.
                        // Wait, I didn't store `wallet` in `X402Client`.

                        // Let's rely on the fact that I can modify the constructor in the previous step to store wallet.
                        const payerAddress = (this as any).walletAddress as `0x${string}`;
                        const merchantAddress = this.currentOptions.payTo as `0x${string}`;

                        if (tokenAddress && payerAddress && merchantAddress) {
                            await new Promise(resolve => setTimeout(resolve, 4000));

                            const searchFromBlock = startBlock ? startBlock : (blockNumber - 10n);

                            // Polling loop for up to 30 seconds (10 attempts * 3s)
                            for (let attempt = 1; attempt <= 10; attempt++) {
                                this.log(`[X402Client] [Req:${requestId}] 🔄 Attempt ${attempt}/10: Trawling logs...`);

                                // Use 'latest' to avoid client cache returning a stale block number for the upper bound
                                const logs = await publicClient.getLogs({
                                    address: tokenAddress,
                                    event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
                                    args: {
                                        from: payerAddress,
                                        to: merchantAddress
                                    },
                                    fromBlock: searchFromBlock,
                                    toBlock: 'latest' // CRITICAL FIX: Use 'latest' instead of currentBlock (which might be cached/stale)
                                });

                                let foundFreshLog = false;

                                // Iterate in reverse (newest first)
                                if (logs.length > 0) {
                                    for (let i = logs.length - 1; i >= 0; i--) {
                                        const log = logs[i];

                                        // RELIABLE CHECK: Use Block Number AND Value
                                        // If the log is in a block >= our startBlock, it IS new.
                                        // We also verify the amount matches exactly to distinguish from other payments.
                                        const expectedAmount = this.currentOptions.amount ? BigInt(this.currentOptions.amount) : 0n;

                                        if (startBlock && log.blockNumber >= startBlock) {
                                            // Additional check: Does the transfer amount match?
                                            // log.args.value is a bigint
                                            if (expectedAmount > 0n && log.args.value !== expectedAmount) {
                                                this.log(`[X402Client] [Req:${requestId}] ⚠️ Found fresh but ignoring due to amount mismatch (Log: ${log.args.value}, Expected: ${expectedAmount})`);
                                                continue;
                                            }

                                            const txHash = log.transactionHash;

                                            this.log(`[X402Client] [Req:${requestId}] ✅ Found FRESH Transaction Hash: ${txHash}`);
                                            this.log(`[X402Client] [Req:${requestId}]    Log Block: ${log.blockNumber}, Start: ${startBlock}, Amount: ${log.args.value}`);
                                            this.log(`[X402Client] [Req:${requestId}] 🔗 Explorer: https://sepolia.basescan.org/tx/${txHash}`);

                                            // Inject hash into response data
                                            if (typeof data === 'object' && data !== null && (data as any).data) {
                                                (data as any).data.transactionHash = txHash;
                                                (data as any).data.network = "eip155:84532";
                                            } else if (typeof data === 'object' && data !== null) {
                                                (data as any).transactionHash = txHash;
                                                (data as any).network = "eip155:84532";
                                            }
                                            foundFreshLog = true;
                                            break;
                                        } else if (!startBlock) {
                                            // Fallback if startBlock failed: accept the most recent one
                                            // This is risky but better than nothing
                                            const txHash = log.transactionHash;
                                            this.log(`[X402Client] [Req:${requestId}] ⚠️ Ambiguous Hash (No StartBlock): ${txHash}`);
                                            if (typeof data === 'object' && data !== null && (data as any).data) {
                                                (data as any).data.transactionHash = txHash;
                                            }
                                            foundFreshLog = true;
                                            break;
                                        } else {
                                            // Log implies it's < startBlock, so it's old.
                                            // this.log(`[X402Client] 🗑️ Ignored OLD log (Block ${log.blockNumber} < Start ${startBlock})`);
                                        }
                                    }
                                }

                                if (foundFreshLog) {
                                    break; // Exit retry loop
                                } else {
                                    if (attempt < 10) {
                                        this.log(`[X402Client] [Req:${requestId}] ⏳ No fresh logs yet. Waiting 3s...`);
                                        await new Promise(resolve => setTimeout(resolve, 3000));
                                    } else {
                                        this.log(`[X402Client] [Req:${requestId}] ⚠️ Timed out waiting for fresh Transfer events.`);
                                    }
                                }
                            }
                        }
                    } else {
                        this.log(`[X402Client] [Req:${requestId}] ⚠️ Payment options missing: ${JSON.stringify(this.currentOptions)}`);
                    }
                } catch (e) {
                    this.log(`[X402Client] [Req:${requestId}] ⚠️ Error searching for tx hash: ${e}`);
                }
            }

            return {
                status: response.status,
                data: data,
                headers: response.headers
            };
        } catch (error: any) {
            this.log(`[X402Client] ❌ Error: ${error.message}`);
            // Mimic axios error structure for compatibility
            throw {
                message: error.message,
                response: {
                    status: 500, // Unknown error
                    data: error.message
                }
            };
        }
    }
}
