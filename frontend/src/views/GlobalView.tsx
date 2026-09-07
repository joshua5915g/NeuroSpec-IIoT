import { useState, useEffect, useRef } from 'react';
import { PlanetaryGrid } from '../components/PlanetaryGrid';
import { Shield, AlertTriangle, Activity, Lock } from 'lucide-react';

interface GlobalViewProps {
    isCritical: boolean;
}

export function GlobalView({ isCritical }: GlobalViewProps) {
    const [isUnderAttack, setIsUnderAttack] = useState(false);
    const [isNodeIsolated, setIsNodeIsolated] = useState(false);
    const [packetLog, setPacketLog] = useState<string[]>([]);
    const logRef = useRef<HTMLDivElement>(null);

    // Generate packet log
    useEffect(() => {
        const interval = setInterval(() => {
            const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
            const randomIP = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
            const randomHex = Array.from({ length: 16 }, () =>
                Math.floor(Math.random() * 16).toString(16)
            ).join('').toUpperCase();

            let logEntry = '';

            if (isUnderAttack) {
                const attackTypes = [
                    `[ALERT] MALICIOUS PAYLOAD DETECTED FROM IP ${randomIP}`,
                    `[THREAT] DDoS AMPLIFICATION ATTACK - ${randomHex}`,
                    `[URGENT] UNAUTHORIZED ACCESS ATTEMPT - ${randomIP}`,
                    `[CRITICAL] PACKET FLOOD DETECTED - ${(Math.random() * 10000).toFixed(0)} req/s`
                ];
                logEntry = `${timestamp} ${attackTypes[Math.floor(Math.random() * attackTypes.length)]}`;
            } else {
                logEntry = `${timestamp} [OK] PACKET ${randomHex} FROM ${randomIP}`;
            }

            setPacketLog(prev => {
                const updated = [...prev, logEntry];
                return updated.slice(-50); // Keep last 50 entries
            });
        }, isUnderAttack ? 100 : 500); // Faster when under attack

        return () => clearInterval(interval);
    }, [isUnderAttack]);

    // Auto-scroll log
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [packetLog]);

    const handleIsolateNode = () => {
        setIsNodeIsolated(true);
        setIsUnderAttack(false);
        setTimeout(() => setIsNodeIsolated(false), 3000); // Reset after 3s
    };

    return (
        <div className="h-full w-full flex gap-3">
            {/* NetSec Ops Panel */}
            <div className="w-80 flex flex-col gap-3">
                {/* Control Panel */}
                <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Shield className={`w-4 h-4 ${isUnderAttack ? 'text-purple-500' : 'text-cyan-500'}`} />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">NetSec Ops</span>
                    </div>

                    {/* Status */}
                    <div className={`mb-3 p-2 rounded border ${isUnderAttack
                            ? 'bg-purple-900/30 border-purple-500/50'
                            : isNodeIsolated
                                ? 'bg-orange-900/30 border-orange-500/50'
                                : 'bg-emerald-900/30 border-emerald-500/50'
                        }`}>
                        <div className="text-[10px] font-mono flex items-center gap-2">
                            {isUnderAttack ? (
                                <>
                                    <AlertTriangle className="w-3 h-3 text-purple-400 animate-pulse" />
                                    <span className="text-purple-400">CYBER ATTACK IN PROGRESS</span>
                                </>
                            ) : isNodeIsolated ? (
                                <>
                                    <Lock className="w-3 h-3 text-orange-400" />
                                    <span className="text-orange-400">NODE ISOLATED</span>
                                </>
                            ) : (
                                <>
                                    <Activity className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">NETWORK SECURE</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="space-y-2">
                        <button
                            onClick={() => setIsUnderAttack(!isUnderAttack)}
                            className={`w-full py-2 px-3 rounded-lg font-bold text-xs tracking-wider transition-all ${isUnderAttack
                                    ? 'bg-emerald-500 text-slate-900 hover:bg-emerald-600'
                                    : 'bg-purple-500 text-white hover:bg-purple-600'
                                }`}
                        >
                            {isUnderAttack ? 'STOP ATTACK' : 'SIMULATE DDoS ATTACK'}
                        </button>

                        {isUnderAttack && !isNodeIsolated && (
                            <button
                                onClick={handleIsolateNode}
                                className="w-full py-2 px-3 rounded-lg bg-red-500 text-white font-bold text-xs tracking-wider hover:bg-red-600 transition-all animate-pulse"
                            >
                                🔴 ISOLATE NODE (KILL SWITCH)
                            </button>
                        )}
                    </div>
                </div>

                {/* Packet Log */}
                <div className="flex-1 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700 p-3 overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${isUnderAttack ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Packet Monitor</span>
                    </div>

                    <div
                        ref={logRef}
                        className="h-96 overflow-y-auto bg-black rounded border border-slate-800 p-2 font-mono text-[9px] leading-relaxed scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900"
                    >
                        {packetLog.map((log, idx) => (
                            <div
                                key={idx}
                                className={`${log.includes('[ALERT]') || log.includes('[THREAT]') || log.includes('[URGENT]') || log.includes('[CRITICAL]')
                                        ? 'text-red-400'
                                        : 'text-green-400'
                                    }`}
                            >
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Globe */}
            <div className="flex-1 bg-[#050508] rounded-xl border border-cyan-500/30 overflow-hidden relative">
                <PlanetaryGrid
                    isCritical={isCritical}
                    isUnderAttack={isUnderAttack}
                    isNodeIsolated={isNodeIsolated}
                />

                {/* Attack Overlay */}
                {isUnderAttack && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-purple-900/90 border border-purple-500 rounded-lg px-6 py-2 animate-pulse">
                        <div className="text-purple-200 font-mono text-sm tracking-wider flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            CYBER ATTACK DETECTED - PURPLE ALERT
                        </div>
                    </div>
                )}

                {isNodeIsolated && (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-orange-900/90 border border-orange-500 rounded-lg px-6 py-2">
                        <div className="text-orange-200 font-mono text-sm tracking-wider flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            NODE ISOLATED - THREAT CONTAINED
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default GlobalView;
