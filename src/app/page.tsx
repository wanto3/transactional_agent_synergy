"use client";

import { useState, useRef, useEffect } from "react";
import { Terminal, Play, CreditCard, ShieldCheck, Coins } from "lucide-react";

export default function Home() {
    const [logs, setLogs] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [micropayActive, setMicropayActive] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of terminal
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    // Effect to toggle visual indicator based on logs
    useEffect(() => {
        const lastLog = logs[logs.length - 1];
        if (lastLog?.includes("requesting liquidity")) {
            setMicropayActive(true);
        }
        if (lastLog?.includes("Liquidity provided")) {
            setTimeout(() => setMicropayActive(false), 2000);
        }
    }, [logs]);

    const runSimulation = async () => {
        if (isRunning) return;
        setIsRunning(true);
        setLogs([]);

        try {
            console.log("Starting fetch to /api/stream");
            const response = await fetch("/api/stream");
            console.log("Fetch response status:", response.status);
            if (!response.body) {
                console.error("Response body is null");
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                // Split by lines in case multiple come at once
                const lines = text.split("\n").filter(l => l.trim() !== "");
                setLogs(prev => [...prev, ...lines]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsRunning(false);
            setMicropayActive(false);
        }
    };

    return (
        <main className="min-h-screen bg-black text-white p-8 font-mono relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />

            <div className="max-w-5xl mx-auto relative z-10">
                <header className="flex items-center justify-between mb-12 border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            Transactional Agent
                        </h1>
                        <p className="text-gray-400 mt-2">x402 Protocol • Transactional Agent • Arbitrum Sepolia</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${micropayActive ? 'bg-green-500/20 text-green-400 border border-green-500/50 animate-pulse' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                        {micropayActive ? "● AGENT ACTIVE" : "○ AGENT IDLE"}
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Status & Controls */}
                    <div className="space-y-6">
                        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl p-6 border border-white/10">
                            <h2 className="text-sm text-gray-400 mb-4 uppercase tracking-wider">Agent State</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-white/5">
                                    <span className="flex items-center gap-2 text-sm text-gray-300">
                                        <CreditCard size={16} />
                                        Wallet
                                    </span>
                                    <span className="text-green-400 text-sm">Active</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-white/5">
                                    <span className="flex items-center gap-2 text-sm text-gray-300">
                                        <ShieldCheck size={16} />
                                        Security
                                    </span>
                                    <span className="text-blue-400 text-sm">x402 Ready</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-white/5">
                                    <span className="flex items-center gap-2 text-sm text-gray-300">
                                        <Coins size={16} />
                                        Liquidity
                                    </span>
                                    <span className="text-purple-400 text-sm">Native Wallet</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={runSimulation}
                            disabled={isRunning}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${isRunning
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-900/20'
                                }`}
                        >
                            {isRunning ? (
                                <>Processing Transaction...</>
                            ) : (
                                <>
                                    <Play size={20} /> Pay 0.0001 ETH (Arbitrum)
                                </>
                            )}
                        </button>
                    </div>

                    {/* Right Column: Terminal */}
                    <div className="md:col-span-2">
                        <div className="bg-[#0c0c0c] rounded-xl border border-white/10 overflow-hidden flex flex-col h-[500px] shadow-2xl">
                            <div className="bg-[#1a1a1a] px-4 py-2 flex items-center gap-2 border-b border-white/5">
                                <Terminal size={14} className="text-gray-500" />
                                <span className="text-xs text-gray-400">agent_execution_logs.bash</span>
                            </div>
                            <div
                                ref={scrollRef}
                                className="flex-1 p-6 overflow-y-auto font-mono text-sm space-y-2"
                            >
                                {logs.length === 0 && (
                                    <div className="text-gray-600 italic">Waiting for execution...</div>
                                )}
                                {logs.map((log, i) => (
                                    <div key={i} className={`
                                ${log.includes("ERROR") ? "text-red-400" : ""}
                                ${log.includes("SUCCESS") ? "text-green-400 font-bold" : ""}
                                ${log.includes("Micropay") ? "text-purple-300" : "text-gray-300"}
                                ${log.includes("Thinking") ? "text-yellow-200/80 italic" : ""}
                            `}>
                                        <span className="text-gray-700 mr-2 opacity-50">[{i + 1}]</span>
                                        {log}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
