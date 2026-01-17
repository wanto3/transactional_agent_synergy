import { TransactionalAgent } from "../../../agent";

// Force dynamic prevents caching
export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("API: /api/stream called");
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const privateKey = process.env.PRIVATE_KEY;
            const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

            // Initialize Agent
            // NOTE: In a real app, do not expose private key handling this way if possible, or ensure environment is secure.
            const agent = new TransactionalAgent({
                privateKey: privateKey,
                rpcUrl: rpcUrl,
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

            const runId = Date.now().toString().slice(-4);
            logCallback(`[System] 🆔 Run ID: ${runId}`);

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
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Connection': 'keep-alive',
        },
    });
}
