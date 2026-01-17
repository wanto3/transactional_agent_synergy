import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');

    // 1. Check for Payment Proof (Simulated by checking for "L402" prefix)
    if (authHeader && authHeader.startsWith("L402 0x")) {
        return new Response(JSON.stringify({
            message: "🎉 Success! You have accessed the PREMIUM content.",
            data: "This secret data was unlocked by your payment."
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 2. Return 402 Payment Required
    // We send back the requirements: Pay 0.0001 ETH to a specific address
    return new Response(JSON.stringify({
        error: "Payment Required",
        amount: "0.0001",
        currency: "ETH",
        // Using the burn address or a specific wallet as the "Service Provider"
        address: "0x000000000000000000000000000000000000dEaD"
    }), {
        status: 402,
        headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'L402' // Standard indication
        }
    });
}
