import { Leaf, Cloud } from 'lucide-react';
import type { ImpactMetrics } from '../utils/metrics';

interface EcoPanelProps {
    metrics: ImpactMetrics;
    isCritical: boolean;
}

export function EcoPanel({ metrics }: EcoPanelProps) {
    const { efficiency, carbonKg, powerKW } = metrics;

    const isEfficient = efficiency >= 95;
    const isInefficient = efficiency < 60;

    // Color coding
    const efficiencyColor = isEfficient ? 'text-emerald-400' : isInefficient ? 'text-red-400' : 'text-orange-400';
    const borderColor = isEfficient ? 'border-emerald-500/50' : isInefficient ? 'border-red-500/50' : 'border-orange-500/50';
    const bgColor = isEfficient ? 'bg-emerald-900/20' : isInefficient ? 'bg-red-900/20' : 'bg-orange-900/20';

    return (
        <div className={`bg-slate-900/80 backdrop-blur-sm rounded-xl border ${borderColor} p-4`}>
            <div className="flex items-center gap-2 mb-3">
                {isEfficient ? (
                    <Leaf className="w-5 h-5 text-emerald-400 animate-pulse" />
                ) : (
                    <Cloud className={`w-5 h-5 ${isInefficient ? 'text-red-400 animate-pulse' : 'text-orange-400'}`} />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Eco-Sense</span>
            </div>

            {/* Circular Progress: OEE */}
            <div className="relative flex items-center justify-center mb-4">
                <svg className="w-32 h-32 transform -rotate-90">
                    {/* Background circle */}
                    <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-slate-800"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - efficiency / 100)}`}
                        className={efficiencyColor}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className={`text-3xl font-bold font-mono ${efficiencyColor}`}>
                        {efficiency.toFixed(1)}%
                    </div>
                    <div className="text-[9px] text-slate-500 uppercase">OEE</div>
                </div>
            </div>

            {/* Metrics */}
            <div className="space-y-2">
                <div className={`${bgColor} rounded-lg p-2 border ${borderColor}`}>
                    <div className="text-[9px] text-slate-500 uppercase mb-1">Live Carbon Footprint</div>
                    <div className="flex items-baseline justify-between">
                        <span className={`text-lg font-mono font-bold ${efficiencyColor}`}>
                            {carbonKg.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400">kg/h</span>
                    </div>
                </div>

                <div className={`${bgColor} rounded-lg p-2 border ${borderColor}`}>
                    <div className="text-[9px] text-slate-500 uppercase mb-1">Power Consumption</div>
                    <div className="flex items-baseline justify-between">
                        <span className={`text-lg font-mono font-bold ${efficiencyColor}`}>
                            {powerKW.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-400">kW</span>
                    </div>
                </div>
            </div>

            {/* Status Label */}
            <div className="mt-3 text-center">
                <div className={`text-[10px] font-mono ${efficiencyColor}`}>
                    {isEfficient ? '✓ SUSTAINABLE' : isInefficient ? '⚠ HIGH IMPACT' : '◐ MODERATE'}
                </div>
            </div>
        </div>
    );
}

export default EcoPanel;
