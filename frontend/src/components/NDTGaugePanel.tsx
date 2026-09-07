import React from 'react';
import { ShieldCheck, Activity, Clock, Flame } from 'lucide-react';

interface NDTMetrics {
  rms: number;
  kurtosis: number;
  crest_factor: number;
  pk_pk: number;
  skewness: number;
  shape_factor?: number;
}

interface ISOZone {
  zone: string;
  label: string;
  description: string;
  color: string;
  urgency: string;
}

interface PrognosticsData {
  health_index: number;
  health_percent: number;
  rul_hours: number;
  degradation_rate_pct_hr: number;
  projection_status: string;
  urgency: string;
}

interface NDTGaugePanelProps {
  ndt: NDTMetrics;
  isoZone: ISOZone;
  prognostics: PrognosticsData;
  anomalyScore: number;
}

export const NDTGaugePanel: React.FC<NDTGaugePanelProps> = ({
  ndt,
  isoZone,
  prognostics,
  anomalyScore,
}) => {
  const isHealthyKurtosis = ndt.kurtosis <= 3.4;
  const isWarningKurtosis = ndt.kurtosis > 3.4 && ndt.kurtosis <= 5.0;

  const kurtosisColor = isHealthyKurtosis
    ? 'text-emerald-400'
    : isWarningKurtosis
    ? 'text-amber-400'
    : 'text-red-400';

  const zoneBorderColor =
    isoZone?.zone === 'A'
      ? 'border-emerald-500/50 bg-emerald-950/20'
      : isoZone?.zone === 'B'
      ? 'border-cyan-500/50 bg-cyan-950/20'
      : isoZone?.zone === 'C'
      ? 'border-amber-500/50 bg-amber-950/20'
      : 'border-red-500/50 bg-red-950/30';

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {/* 1. ISO 10816-3 Severity Card */}
      <div className={`p-3 rounded-xl border ${zoneBorderColor} flex flex-col justify-between transition-all duration-300`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            ISO 10816-3 Zone
          </span>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
            style={{ backgroundColor: `${isoZone?.color || '#10b981'}25`, color: isoZone?.color || '#10b981' }}
          >
            ZONE {isoZone?.zone || 'A'}
          </span>
        </div>

        <div className="my-2">
          <div className="text-2xl font-mono font-black" style={{ color: isoZone?.color || '#10b981' }}>
            {ndt.rms.toFixed(3)} <span className="text-xs font-normal text-slate-400">mm/s RMS</span>
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-1 line-clamp-1">
            {isoZone?.description || 'Optimal machine baseline'}
          </p>
        </div>

        {/* Severity Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
          <div className="bg-emerald-500 h-full" style={{ width: '31%' }}></div>
          <div className="bg-cyan-500 h-full" style={{ width: '31%' }}></div>
          <div className="bg-amber-500 h-full" style={{ width: '38%' }}></div>
        </div>
      </div>

      {/* 2. Statistical NDT Indicators (Kurtosis & Crest) */}
      <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            NDT Health Metrics
          </span>
          <span className="text-[9px] font-mono text-slate-500">GAUSSIAN REF: 3.0</span>
        </div>

        <div className="grid grid-cols-2 gap-2 my-1">
          <div>
            <div className="text-[9px] font-mono text-slate-500">KURTOSIS (4TH)</div>
            <div className={`text-xl font-mono font-bold ${kurtosisColor}`}>
              {ndt.kurtosis.toFixed(2)}
            </div>
            <div className="text-[8px] font-mono text-slate-400">
              {ndt.kurtosis > 4.0 ? '⚠ Micro-Impacts' : '✔ Normal'}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-mono text-slate-500">CREST FACTOR</div>
            <div className="text-xl font-mono font-bold text-slate-200">
              {ndt.crest_factor.toFixed(2)}
            </div>
            <div className="text-[8px] font-mono text-slate-400">
              Pk-Pk: {ndt.pk_pk.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="text-[9px] font-mono text-slate-500">
          Skewness: <span className="text-slate-300">{ndt.skewness.toFixed(3)}</span>
        </div>
      </div>

      {/* 3. Deep Spectral Anomaly Score */}
      <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            Neural Anomaly MSE
          </span>
          <span className="text-[9px] font-mono text-cyan-400">LATENT: 8D</span>
        </div>

        <div className="my-1">
          <div className={`text-2xl font-mono font-black ${anomalyScore > 0.8 ? 'text-red-400' : 'text-emerald-400'}`}>
            {anomalyScore.toFixed(4)}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">
            {anomalyScore > 0.8 ? 'Spectral Signature Shift' : 'Manifold Divergence: Minimal'}
          </div>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${anomalyScore > 0.8 ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(100, (anomalyScore / 2.0) * 100)}%` }}
          ></div>
        </div>
      </div>

      {/* 4. Prognostics & RUL Projection */}
      <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            Prognostics (RUL)
          </span>
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
            prognostics?.urgency === 'OPTIMAL' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
          }`}>
            {prognostics?.urgency || 'OPTIMAL'}
          </span>
        </div>

        <div className="my-1">
          <div className="text-2xl font-mono font-black text-purple-300">
            {prognostics?.rul_hours > 1000 ? '> 5,000' : prognostics?.rul_hours.toFixed(1)}{' '}
            <span className="text-xs font-normal text-slate-400">Hours</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">
            Health Index: <span className="text-purple-400 font-bold">{prognostics?.health_percent.toFixed(1)}%</span>
          </div>
        </div>

        <div className="text-[9px] font-mono text-slate-500 flex justify-between">
          <span>Degradation: {prognostics?.degradation_rate_pct_hr}%/hr</span>
          <span className="text-slate-400">{prognostics?.projection_status}</span>
        </div>
      </div>
    </div>
  );
};
