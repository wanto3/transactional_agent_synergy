import { simulateAgent } from "../../../agent";

// Force dynamic prevents caching
export const dynamic = 'force-dynamic';

export async function GET() {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const iterator = simulateAgent();

            try {
                for await (const log of iterator) {
                    // Send log line encoded
                    controller.enqueue(encoder.encode(log + "\n"));
                }
            } catch (e) {
                controller.error(e);
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
        },
    });
}
