import { useState } from 'react';
import { GenerativeDesign } from '../components/GenerativeDesign';
import { Dna, Box, Sparkles } from 'lucide-react';
import { BiomimeticLatticeLab } from '../components/BiomimeticLatticeLab';

interface GenerativeLabProps {
  isCritical: boolean;
  onLog?: (message: string) => void;
}

export function GenerativeLab({ isCritical, onLog }: GenerativeLabProps) {
  const [activeTab, setActiveTab] = useState<'topology' | 'tpms'>('topology');
  const [isTPMSModalOpen, setIsTPMSModalOpen] = useState(false);

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Lab Header & Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              GENERATIVE HARDWARE & TPMS ADDITIVE STUDIO
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              Biomimetic Damping Optimization • Anti-Resonant Lattice Metallurgy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('topology')}
              className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                activeTab === 'topology'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5 inline mr-1.5" />
              Darwin Topology
            </button>
            <button
              onClick={() => setIsTPMSModalOpen(true)}
              className="px-3 py-1 rounded text-xs font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-900/80 transition-all font-bold flex items-center gap-1.5 cursor-pointer ml-1"
            >
              <Dna className="w-3.5 h-3.5 text-cyan-400" />
              Open TPMS Lattice Lab
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 min-h-[500px]">
        <GenerativeDesign isCritical={isCritical} onLog={onLog} />
      </div>

      {/* Embedded Modal Launcher */}
      <BiomimeticLatticeLab
        isOpen={isTPMSModalOpen}
        onClose={() => setIsTPMSModalOpen(false)}
        rpm={3000}
        activeFault={isCritical ? 'BPFO' : 'HEALTHY'}
        isCritical={isCritical}
      />
    </div>
  );
}

export default GenerativeLab;
