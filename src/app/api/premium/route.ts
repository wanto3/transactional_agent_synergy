import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const paymentSig = request.headers.get('payment-signature'); // Coinbase standard

    // 1. Check for Payment Proof
    // We support standard "Authorization: 402 <proof>" or "Payment-Signature: <proof>"
    const hasValidAuth = (authHeader && authHeader.startsWith("402 0x")) ||
        (paymentSig && paymentSig.startsWith("0x"));

    if (hasValidAuth) {
        return new Response(JSON.stringify({
            message: "🎉 Success! You have accessed the PREMIUM content.",
            data: "This secret data was unlocked by your payment."
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 2. Return 402 Payment Required
    // We send back the requirements using standard headers and body
    const paymentDetails = {
        error: "Payment Required",
        amount: "0.0001",
        currency: "ETH",
        address: "0x000000000000000000000000000000000000dEaD"
    };

    return new Response(JSON.stringify(paymentDetails), {
        status: 402,
        headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'x402 info="Payment Required"',
            'Payment-Required': JSON.stringify(paymentDetails) // Coinbase standard often puts details here
        }
    });
}
