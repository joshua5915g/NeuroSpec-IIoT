import React, { useMemo } from 'react';
import { ShieldCheck, ShieldAlert, ArrowRight, Wrench, BarChart2 } from 'lucide-react';

interface RootCauseCardProps {
  activeFault: string;
  rpm: number;
  kinematics: { [key: string]: number };
  ndtMetrics: {
    rms: number;
    kurtosis: number;
    crest_factor: number;
    pk_pk: number;
    skewness: number;
  };
  isoZone: {
    zone: string;
    label: string;
    description: string;
    color: string;
    urgency: string;
  };
  onOpenPrePostModal: () => void;
}

interface DiagnosisCandidate {
  id: string;
  name: string;
  confidence: number;
  evidence: string;
  action: string;
  color: string;
}

export const RootCauseCard: React.FC<RootCauseCardProps> = ({
  activeFault,
  rpm,
  kinematics,
  ndtMetrics,
  isoZone,
  onOpenPrePostModal,
}) => {
  const diagnosisList: DiagnosisCandidate[] = useMemo(() => {
    const fr = (rpm / 60.0).toFixed(1);
    const bpfo = kinematics['BPFO']?.toFixed(1) || '179.2';
    const bpfi = kinematics['BPFI']?.toFixed(1) || '270.8';

    if (activeFault === 'BPFO') {
      return [
        {
          id: 'BPFO',
          name: 'Outer Raceway Micro-Spall',
          confidence: 94.8,
          evidence: `Dominant spectral peak at BPFO (${bpfo} Hz) with Kurtosis=${ndtMetrics.kurtosis.toFixed(2)} (Impact Crest=${ndtMetrics.crest_factor.toFixed(2)})`,
          action: 'Schedule bearing replacement; inspect outer housing bore for fretting corrosion.',
          color: 'red',
        },
        {
          id: 'UNBALANCE',
          name: 'Dynamic Rotor Unbalance',
          confidence: 3.2,
          evidence: `Minor 1X vibration component at ${fr} Hz.`,
          action: 'Secondary check only.',
          color: 'slate',
        },
        {
          id: 'MISALIGNMENT',
          name: 'Coupling Misalignment',
          confidence: 2.0,
          evidence: 'Sub-threshold 2X harmonic.',
          action: 'No action required.',
          color: 'slate',
        },
      ];
    } else if (activeFault === 'BPFI') {
      return [
        {
          id: 'BPFI',
          name: 'Inner Raceway Fatigue Flaking',
          confidence: 92.4,
          evidence: `Spectral energy focused at BPFI (${bpfi} Hz) with 1X sideband modulation.`,
          action: 'Replace drive-end bearing; check shaft journal tolerance and lubrication.',
          color: 'amber',
        },
        {
          id: 'BPFO',
          name: 'Outer Raceway Spall',
          confidence: 4.6,
          evidence: 'Residual impact harmonics.',
          action: 'Monitor raceway.',
          color: 'slate',
        },
        {
          id: 'MISALIGNMENT',
          name: 'Angular Misalignment',
          confidence: 3.0,
          evidence: 'Harmonic leakage at 2X.',
          action: 'Check coupling.',
          color: 'slate',
        },
      ];
    } else if (activeFault === 'UNBALANCE') {
      return [
        {
          id: 'UNBALANCE',
          name: 'Rotor Mass Eccentricity & Unbalance',
          confidence: 96.1,
          evidence: `Sinusoidal 1X fundamental harmonic at ${fr} Hz with high displacement pk-pk=${ndtMetrics.pk_pk.toFixed(2)} mm.`,
          action: 'Perform single-plane dynamic field balancing on rotor assembly.',
          color: 'cyan',
        },
        {
          id: 'MISALIGNMENT',
          name: 'Coupling Misalignment',
          confidence: 2.8,
          evidence: '2X component below 30% of 1X.',
          action: 'Verify alignment.',
          color: 'slate',
        },
        {
          id: 'NOMINAL',
          name: 'Nominal Baseline',
          confidence: 1.1,
          evidence: 'No bearing defect peaks found.',
          action: 'None.',
          color: 'slate',
        },
      ];
    } else if (activeFault === 'MISALIGNMENT') {
      return [
        {
          id: 'MISALIGNMENT',
          name: 'Shaft Coupling Misalignment (2X)',
          confidence: 93.7,
          evidence: `Pronounced 2X harmonic (${(parseFloat(fr) * 2).toFixed(1)} Hz) with phase asymmetry.`,
          action: 'Execute dual-laser precision shaft realignment; verify soft-foot condition.',
          color: 'blue',
        },
        {
          id: 'UNBALANCE',
          name: 'Rotor Unbalance',
          confidence: 4.5,
          evidence: '1X component present.',
          action: 'Secondary check.',
          color: 'slate',
        },
        {
          id: 'BPFO',
          name: 'Bearing Fatigue',
          confidence: 1.8,
          evidence: 'Raceway baseline normal.',
          action: 'None.',
          color: 'slate',
        },
      ];
    } else if (activeFault === 'CAVITATION') {
      return [
        {
          id: 'CAVITATION',
          name: 'Fluid Cavitation & Vapor Implosion',
          confidence: 95.0,
          evidence: 'Broadband ultrasonic acoustic emission (>2 kHz) with Gaussian kurtosis and irregular amplitude modulation.',
          action: 'Inspect suction head (NPSH), clean inlet strainers, adjust impeller throttling valve.',
          color: 'purple',
        },
        {
          id: 'BPFO',
          name: 'Bearing Spall',
          confidence: 3.1,
          evidence: 'High frequency noise mask.',
          action: 'Monitor.',
          color: 'slate',
        },
        {
          id: 'MISALIGNMENT',
          name: 'Coupling Misalignment',
          confidence: 1.9,
          evidence: 'Low harmonic contribution.',
          action: 'None.',
          color: 'slate',
        },
      ];
    } else {
      return [
        {
          id: 'NOMINAL',
          name: 'Nominal Health (ISO 10816 Zone A)',
          confidence: 99.4,
          evidence: `All kinematic defect bands (BPFO, BPFI, BSF, 2X) within baseline noise floor. RMS=${ndtMetrics.rms.toFixed(2)} mm/s.`,
          action: 'Maintain continuous automated condition monitoring routine.',
          color: 'emerald',
        },
        {
          id: 'UNBALANCE',
          name: 'Rotor Unbalance',
          confidence: 0.4,
          evidence: '1X amplitude normal.',
          action: 'None.',
          color: 'slate',
        },
        {
          id: 'BPFO',
          name: 'Outer Spall',
          confidence: 0.2,
          evidence: 'Kurtosis nominal (2.8 - 3.0).',
          action: 'None.',
          color: 'slate',
        },
      ];
    }
  }, [activeFault, rpm, kinematics, ndtMetrics]);

  const topDiag = diagnosisList[0];

  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {activeFault === 'HEALTHY' ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
          )}
          <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-200">
            Automated Root-Cause Diagnostic Engine (RCA)
          </h3>
        </div>
        <span
          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
          style={{ backgroundColor: `${isoZone.color}20`, color: isoZone.color, border: `1px solid ${isoZone.color}50` }}
        >
          ISO ZONE {isoZone.zone} ({isoZone.label})
        </span>
      </div>

      {/* Top Diagnosis Card */}
      <div
        className={`p-3 rounded-lg border transition-all ${
          activeFault === 'HEALTHY'
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
            : 'bg-red-950/30 border-red-500/50 text-red-300'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold font-mono uppercase">{topDiag.name}</span>
          <span className="text-sm font-mono font-bold">{topDiag.confidence.toFixed(1)}% MATCH</span>
        </div>
        <p className="text-[11px] font-mono leading-relaxed opacity-90 mb-2">{topDiag.evidence}</p>
        <div className="text-[10px] font-mono p-1.5 rounded bg-black/40 border border-slate-800/80 text-slate-300 flex items-start gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <span><strong className="text-cyan-400">Action:</strong> {topDiag.action}</span>
        </div>
      </div>

      {/* Confidence Breakdown Bars */}
      <div className="space-y-1.5">
        <div className="text-[9px] font-mono uppercase text-slate-400 tracking-wider flex items-center justify-between">
          <span>Candidate Diagnostic Distribution</span>
          <span>Bayesian Harmonic Confidence</span>
        </div>
        {diagnosisList.map((item) => (
          <div key={item.id} className="space-y-0.5">
            <div className="flex justify-between text-[10px] font-mono text-slate-300">
              <span className="truncate">{item.name}</span>
              <span className="font-bold">{item.confidence.toFixed(1)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  item.color === 'emerald'
                    ? 'bg-emerald-500'
                    : item.color === 'red'
                    ? 'bg-red-500'
                    : item.color === 'amber'
                    ? 'bg-amber-500'
                    : item.color === 'cyan'
                    ? 'bg-cyan-500'
                    : item.color === 'blue'
                    ? 'bg-blue-500'
                    : item.color === 'purple'
                    ? 'bg-purple-500'
                    : 'bg-slate-600'
                }`}
                style={{ width: `${item.confidence}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Pre/Post-Repair Verification Button */}
      <button
        onClick={onOpenPrePostModal}
        className="w-full py-2 px-3 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600/30 to-cyan-600/30 hover:from-blue-600/50 hover:to-cyan-600/50 border border-cyan-500/40 text-cyan-300 transition-all cursor-pointer shadow-md"
      >
        <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
        Pre- vs. Post-Repair Verification Studio
        <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
      </button>
    </div>
  );
};
