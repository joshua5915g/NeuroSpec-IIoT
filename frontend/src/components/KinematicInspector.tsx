import React from 'react';
import { Cpu, Wrench, ShieldAlert, Sparkles, FileText, CheckCircle2 } from 'lucide-react';

interface KinematicInspectorProps {
  rpm: number;
  kinematics: { [key: string]: number };
  activeFault: string;
  isHealing: boolean;
  onSelectFault: (fault: string) => void;
  onAutoHeal: () => void;
  onOpenWorkOrder: () => void;
}

export const KinematicInspector: React.FC<KinematicInspectorProps> = ({
  rpm,
  kinematics,
  activeFault,
  isHealing,
  onSelectFault,
  onAutoHeal,
  onOpenWorkOrder,
}) => {
  const faultOptions = [
    { id: 'HEALTHY', label: 'Nominal Baseline', desc: 'Optimal ISO Zone A', icon: CheckCircle2, color: 'emerald' },
    { id: 'BPFO', label: 'Bearing Outer Spall', desc: 'Impact Shock (BPFO)', icon: ShieldAlert, color: 'red' },
    { id: 'BPFI', label: 'Bearing Inner Spall', desc: '1X Modulated (BPFI)', icon: ShieldAlert, color: 'amber' },
    { id: 'UNBALANCE', label: 'Rotor Mass Unbalance', desc: '1X Rotational Harmonic', icon: Wrench, color: 'cyan' },
    { id: 'MISALIGNMENT', label: 'Shaft Misalignment', desc: '2X Coupling Harmonic', icon: Wrench, color: 'blue' },
    { id: 'CAVITATION', label: 'Fluid Cavitation', desc: 'High-Freq Acoustic Hiss', icon: ShieldAlert, color: 'purple' },
  ];

  return (
    <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-4 space-y-4">
      {/* Header with Bearing Spec */}
      <div className="flex flex-wrap justify-between items-center gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-200">
            Kinematic Defect Calculator (SKF 6205 Bearing)
          </h3>
        </div>
        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-3">
          <span className="text-cyan-400 font-bold">{rpm} RPM (fr = {(rpm/60.0).toFixed(1)} Hz)</span>
          <span>Dp: 39.04mm | d: 7.94mm | N: 9 | α: 0°</span>
        </div>
      </div>

      {/* Kinematic Defect Frequencies Ticker */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {kinematics &&
          Object.entries(kinematics).map(([label, freq]) => {
            const isHighlighted =
              (label === 'BPFO' && activeFault === 'BPFO') ||
              (label === 'BPFI' && activeFault === 'BPFI') ||
              (label === '1X' && activeFault === 'UNBALANCE') ||
              (label === '2X' && activeFault === 'MISALIGNMENT');

            return (
              <div
                key={label}
                className={`p-2 rounded-lg border text-center transition-all ${
                  isHighlighted
                    ? 'border-red-500 bg-red-950/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                    : 'border-slate-800 bg-slate-900/50'
                }`}
              >
                <div className="text-[9px] font-mono text-slate-500">{label}</div>
                <div
                  className={`text-sm font-mono font-bold ${
                    isHighlighted ? 'text-red-400' : 'text-slate-200'
                  }`}
                >
                  {freq?.toFixed(1)} <span className="text-[9px] font-normal text-slate-500">Hz</span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Fault Injection Matrix */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex justify-between items-center">
          <span>Physical Fault Injection Matrix</span>
          <span className="text-slate-500">SELECT TO TEST ACOUSTIC SIGNATURE</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {faultOptions.map((opt) => {
            const isSelected = activeFault === opt.id;
            const Icon = opt.icon;

            return (
              <button
                key={opt.id}
                onClick={() => onSelectFault(opt.id)}
                className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all duration-200 ${
                  isSelected
                    ? opt.id === 'HEALTHY'
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-500'
                      : 'border-red-500 bg-red-950/40 text-red-300 ring-1 ring-red-500'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{opt.label}</span>
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100' : 'opacity-40'}`} />
                </div>
                <span className="text-[9px] font-mono text-slate-400">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onAutoHeal}
            disabled={isHealing || activeFault === 'HEALTHY'}
            className={`px-4 py-2 rounded-lg font-mono text-xs flex items-center gap-2 transition-all ${
              isHealing
                ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 animate-pulse'
                : activeFault === 'HEALTHY'
                ? 'bg-slate-800/40 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-lg shadow-cyan-900/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isHealing ? 'AUTONOMOUS STABILIZATION ACTIVE...' : 'VFD RESONANCE AVOIDANCE & AUTO-HEAL'}
          </button>
        </div>

        <button
          onClick={onOpenWorkOrder}
          className="px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-mono text-xs flex items-center gap-2 transition-all"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          Export CMMS Work Order (SAP PM)
        </button>
      </div>
    </div>
  );
};
