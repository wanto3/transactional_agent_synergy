import { TransactionalAgent } from "../../../agent";

// Force dynamic prevents caching
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    console.log("API: /api/stream called at " + new Date().toISOString());
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const privateKey = process.env.PRIVATE_KEY;
            const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

            // Initialize Agent
            // NOTE: In a real app, do not expose private key handling this way if possible, or ensure environment is secure.
            const agent = new TransactionalAgent({
                privateKey: privateKey,
                // rpcUrl: rpcUrl, // REMOVED: Using default Base Sepolia RPC from client.ts to avoid env var conflict
                useRealWallet: true
            });

            // Log callback to stream data
            const logCallback = (msg: string) => {
                try {
                    controller.enqueue(encoder.encode(msg + "\n"));
                } catch (e) {
                    // Controller might be closed if client disconnected
                    console.error("Stream closed", e);
                }
            };

            const runId = Date.now().toString() + "-" + Math.floor(Math.random() * 1000);
            logCallback(`[System] 🆔 Run ID: ${runId}`);
            logCallback(`[System] 🕐 Time: ${new Date().toISOString()}`);

            try {
                await agent.run(logCallback);
            } catch (e: any) {
                logCallback(`[System] ❌ Error: ${e.message}`);
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // Disable Nginx buffering if applicable
        },
    });
}
