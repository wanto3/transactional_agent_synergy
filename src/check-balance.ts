
import { createPublicClient, http, formatEther, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

async function checkBalance() {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error("PRIVATE_KEY missing");

    const account = privateKeyToAccount(privateKey.startsWith('0x') ? privateKey as `0x${string}` : `0x${privateKey}` as `0x${string}`);
    const client = createPublicClient({
        chain: baseSepolia,
        transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org')
    });

    console.log(`Address: ${account.address}`);

    const ethBalance = await client.getBalance({ address: account.address });
    console.log(`ETH Balance: ${formatEther(ethBalance)} ETH`);

    const usdcBalance = await client.readContract({
        address: USDC_ADDRESS,
        abi: [{ name: 'balanceOf', type: 'function', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] }],
        functionName: 'balanceOf',
        args: [account.address]
    }) as bigint;

    console.log(`USDC Balance: ${formatUnits(usdcBalance, 6)} USDC`);

    // Check Merchant Relayer Balance
    const RELAYER_ADDRESS = '0x7621106919A7485daF135C1EE0216AaFD1AD144D';
    console.log(`\nChecking Relayer (Merchant) stats...`);
    console.log(`Relayer Address: ${RELAYER_ADDRESS}`);
    const relayerEth = await client.getBalance({ address: RELAYER_ADDRESS });
    console.log(`Relayer ETH Balance: ${formatEther(relayerEth)} ETH`);
}

checkBalance().catch(console.error);
