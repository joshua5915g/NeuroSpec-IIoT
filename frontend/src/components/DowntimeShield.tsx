import React, { useState } from 'react';
import { DollarSign, ShieldAlert, X } from 'lucide-react';

interface DowntimeShieldProps {
  isOpen: boolean;
  onClose: () => void;
  isCritical: boolean;
}

export const DowntimeShield: React.FC<DowntimeShieldProps> = ({ isOpen, onClose }) => {
  const [productionUnitsPerHour, setProductionUnitsPerHour] = useState<number>(450);
  const [unitMarginEuro, setUnitMarginEuro] = useState<number>(28);
  const [contractorHourlyRate, setContractorHourlyRate] = useState<number>(180);

  // Financial Calculations
  const revenueLossPerHour = productionUnitsPerHour * unitMarginEuro; // €/hr
  const revenueLossPerSec = revenueLossPerHour / 3600; // €/s

  const plannedDowntimeCost = revenueLossPerHour * 4 + 2500; // 4 hours planned
  const catastrophicFailureCost = revenueLossPerHour * 36 + 45000 + contractorHourlyRate * 48; // 36 hours breakdown + cascade damage

  const financialRiskRatio = (catastrophicFailureCost / plannedDowntimeCost).toFixed(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-xl max-w-4xl w-full p-6 shadow-2xl overflow-hidden relative text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                DowntimeShield Financial Matrix
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                  EXPOSURE MODEL
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                REAL-TIME FINANCIAL RISK & PRODUCTION BOTTLENECK EVALUATOR
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-3">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                1. Plant Production Financial Inputs
              </h3>
              <div>
                <label className="text-xs text-slate-400 font-mono">Throughput Rate (Units/Hour)</label>
                <input
                  type="number"
                  value={productionUnitsPerHour}
                  onChange={(e) => setProductionUnitsPerHour(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white font-mono mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-mono">Unit Net Margin (€/Unit)</label>
                <input
                  type="number"
                  value={unitMarginEuro}
                  onChange={(e) => setUnitMarginEuro(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white font-mono mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-mono">Emergency Labor Rate (€/Hour)</label>
                <input
                  type="number"
                  value={contractorHourlyRate}
                  onChange={(e) => setContractorHourlyRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white font-mono mt-1"
                />
              </div>
            </div>

            {/* Hourly Loss Metric */}
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-4 font-mono">
              <span className="text-xs text-slate-400 block">Calculated Revenue Exposure</span>
              <span className="text-2xl font-bold text-white">€{revenueLossPerHour.toLocaleString()} <span className="text-sm font-normal text-emerald-400">/ hour</span></span>
              <span className="text-xs text-emerald-300/80 block mt-1">€{revenueLossPerSec.toFixed(2)} / second downtime loss</span>
            </div>
          </div>

          {/* Decision Matrix Comparison Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-950/80 p-5 rounded-lg border border-slate-800 space-y-4">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                2. Decision Matrix: Planned vs. Unplanned Failure
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Planned Maintenance Option */}
                <div className="bg-slate-900 p-4 rounded border border-emerald-500/30 space-y-2">
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase block">
                    Planned Stop (Today)
                  </span>
                  <span className="text-xl font-bold font-mono text-white">
                    €{plannedDowntimeCost.toLocaleString()}
                  </span>
                  <p className="text-[11px] text-slate-400 font-mono">
                    4h scheduled shift stop + standard SKF replacement part.
                  </p>
                </div>

                {/* Catastrophic Breakdown Option */}
                <div className="bg-slate-900 p-4 rounded border border-red-500/30 space-y-2">
                  <span className="text-xs font-mono font-bold text-red-400 uppercase block">
                    Catastrophic Failure
                  </span>
                  <span className="text-xl font-bold font-mono text-white">
                    €{catastrophicFailureCost.toLocaleString()}
                  </span>
                  <p className="text-[11px] text-slate-400 font-mono">
                    36h emergency outage + housing damage + overtime fees.
                  </p>
                </div>
              </div>

              {/* Financial Risk Ratio */}
              <div className="bg-slate-900 p-4 rounded border border-slate-800 space-y-2 font-mono">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Financial Risk Multiplier:</span>
                  <span className="text-lg font-bold text-amber-400">{financialRiskRatio}x COST PENALTY</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: `${100 / parseFloat(financialRiskRatio)}%` }} />
                  <div className="bg-red-500 h-full flex-1" />
                </div>
              </div>

              {/* Executive Recommendation Banner */}
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded text-xs font-mono text-emerald-300 leading-relaxed flex items-center space-x-3">
                <ShieldAlert className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <strong>RECOMMENDED EXECUTIVE ACTION:</strong> Schedule a 4-hour maintenance window during the next shift change to save <strong className="text-white">€{(catastrophicFailureCost - plannedDowntimeCost).toLocaleString()}</strong> in cascade breakdown losses.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
