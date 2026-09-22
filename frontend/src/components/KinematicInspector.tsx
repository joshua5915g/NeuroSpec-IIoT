import React, { useState } from 'react';
import { Cpu, Wrench, ShieldAlert, Sparkles, FileText, CheckCircle2, ChevronDown, SlidersHorizontal, Settings2 } from 'lucide-react';
import { BEARING_CATALOG, type BearingSpec } from '../utils/bearingDatabase';

interface KinematicInspectorProps {
  rpm: number;
  kinematics: { [key: string]: number };
  activeFault: string;
  isHealing: boolean;
  selectedBearing: BearingSpec;
  onSelectFault: (fault: string) => void;
  onSelectBearing: (bearing: BearingSpec) => void;
  onAutoHeal: () => void;
  onOpenWorkOrder: () => void;
}

export const KinematicInspector: React.FC<KinematicInspectorProps> = ({
  rpm,
  kinematics,
  activeFault,
  isHealing,
  selectedBearing,
  onSelectFault,
  onSelectBearing,
  onAutoHeal,
  onOpenWorkOrder,
}) => {
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customSpec, setCustomSpec] = useState<BearingSpec>({
    id: 'CUSTOM_BEARING',
    name: 'Custom User Spec',
    manufacturer: 'User Defined',
    type: 'Custom Geometry',
    dp: 45.0,
    d: 8.5,
    n: 10,
    alpha: 0,
    description: 'Custom pitch/ball parameters',
  });

  const faultOptions = [
    { id: 'HEALTHY', label: 'Nominal Baseline', desc: 'Optimal ISO Zone A', icon: CheckCircle2, color: 'emerald' },
    { id: 'BPFO', label: 'Bearing Outer Spall', desc: 'Impact Shock (BPFO)', icon: ShieldAlert, color: 'red' },
    { id: 'BPFI', label: 'Bearing Inner Spall', desc: '1X Modulated (BPFI)', icon: ShieldAlert, color: 'amber' },
    { id: 'UNBALANCE', label: 'Rotor Mass Unbalance', desc: '1X Rotational Harmonic', icon: Wrench, color: 'cyan' },
    { id: 'MISALIGNMENT', label: 'Shaft Misalignment', desc: '2X Coupling Harmonic', icon: Wrench, color: 'blue' },
    { id: 'CAVITATION', label: 'Fluid Cavitation', desc: 'High-Freq Acoustic Hiss', icon: ShieldAlert, color: 'purple' },
  ];

  const handleCustomApply = () => {
    onSelectBearing(customSpec);
    setIsCustomOpen(false);
  };

  return (
    <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-4 space-y-4">
      {/* Header with Bearing Catalog Selector */}
      <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-slate-200">
            Kinematic Defect Calculator & Bearing Catalog
          </h3>
        </div>

        {/* Bearing Selector Dropdown & Custom Button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedBearing.id}
              onChange={(e) => {
                const b = BEARING_CATALOG.find((item) => item.id === e.target.value);
                if (b) onSelectBearing(b);
              }}
              className="appearance-none bg-slate-800/90 border border-slate-700 hover:border-cyan-500/50 rounded-lg px-3 py-1.5 pr-8 text-xs font-mono text-cyan-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              {BEARING_CATALOG.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.manufacturer})
                </option>
              ))}
              {selectedBearing.id === 'CUSTOM_BEARING' && (
                <option value="CUSTOM_BEARING">Custom Spec ({selectedBearing.dp}mm / {selectedBearing.d}mm)</option>
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => setIsCustomOpen(!isCustomOpen)}
            className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-all ${
              isCustomOpen
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Configure Custom Bearing Geometry"
          >
            <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Bearing Geometry Specs Strip */}
      <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="text-cyan-400 font-bold">{selectedBearing.name}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">{selectedBearing.type}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span>Pitch Dp: <strong className="text-cyan-400">{selectedBearing.dp} mm</strong></span>
          <span>Ball d: <strong className="text-cyan-400">{selectedBearing.d} mm</strong></span>
          <span>Elements N: <strong className="text-cyan-400">{selectedBearing.n}</strong></span>
          <span>Angle α: <strong className="text-cyan-400">{selectedBearing.alpha}°</strong></span>
          <span className="text-emerald-400 font-bold">fr = {(rpm / 60.0).toFixed(1)} Hz</span>
        </div>
      </div>

      {/* Custom Bearing Modal / Inline Form */}
      {isCustomOpen && (
        <div className="p-3 rounded-lg border border-cyan-500/40 bg-slate-950/80 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              Custom Bearing Geometry Parameters
            </span>
            <button
              onClick={() => setIsCustomOpen(false)}
              className="text-slate-400 hover:text-slate-200 text-xs font-mono"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="text-[9px] font-mono text-slate-400 block mb-1">Pitch Diameter (Dp mm)</label>
              <input
                type="number"
                step="0.1"
                value={customSpec.dp}
                onChange={(e) => setCustomSpec({ ...customSpec, dp: parseFloat(e.target.value) || 30.0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[9px] font-mono text-slate-400 block mb-1">Ball Diameter (d mm)</label>
              <input
                type="number"
                step="0.1"
                value={customSpec.d}
                onChange={(e) => setCustomSpec({ ...customSpec, d: parseFloat(e.target.value) || 5.0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[9px] font-mono text-slate-400 block mb-1">Elements Count (N)</label>
              <input
                type="number"
                value={customSpec.n}
                onChange={(e) => setCustomSpec({ ...customSpec, n: parseInt(e.target.value) || 8 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[9px] font-mono text-slate-400 block mb-1">Contact Angle (α deg)</label>
              <input
                type="number"
                value={customSpec.alpha}
                onChange={(e) => setCustomSpec({ ...customSpec, alpha: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setIsCustomOpen(false)}
              className="px-3 py-1 rounded text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleCustomApply}
              className="px-3 py-1 rounded text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              Apply Kinematics
            </button>
          </div>
        </div>
      )}

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
                className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer ${
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
            className={`px-4 py-2 rounded-lg font-mono text-xs flex items-center gap-2 transition-all cursor-pointer ${
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
          className="px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-mono text-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          Export CMMS Work Order (SAP PM)
        </button>
      </div>
    </div>
  );
};
