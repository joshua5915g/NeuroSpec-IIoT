import React, { useState, useEffect } from 'react';
import { Fingerprint, X } from 'lucide-react';

interface DefectFingerprint {
  id: string;
  name: string;
  category: string;
  similarity: number;
  frequencyPeaks: string;
  severity: 'CRITICAL' | 'WARNING' | 'MODERATE';
  description: string;
}

interface SoundPrintIDProps {
  isOpen: boolean;
  onClose: () => void;
  activeFault: string;
}

export const SoundPrintID: React.FC<SoundPrintIDProps> = ({ isOpen, onClose, activeFault }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [fingerprints, setFingerprints] = useState<DefectFingerprint[]>([]);
  const [selectedFingerprint, setSelectedFingerprint] = useState<DefectFingerprint | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsScanning(true);

    const DATABASE_CATALOG: DefectFingerprint[] = [
      {
        id: 'FP-BPFO-884',
        name: 'SKF 6205 Outer-Race Subsurface Spall',
        category: 'Rolling Element Bearing',
        similarity: activeFault === 'BPFO' ? 98.4 : 24.1,
        frequencyPeaks: '179.2 Hz (BPFO), 358.4 Hz (2xBPFO)',
        severity: 'CRITICAL',
        description: 'Micro-spall spalling on stationary outer ring under heavy radial load.'
      },
      {
        id: 'FP-BPFI-912',
        name: 'Inner-Race Cyclic Flaking & Micro-Cracks',
        category: 'Rolling Element Bearing',
        similarity: activeFault === 'BPFI' ? 96.8 : 18.5,
        frequencyPeaks: '270.8 Hz (BPFI) + 1X Sidebands',
        severity: 'CRITICAL',
        description: 'Progressive fatigue pitting on rotating inner raceway with shaft modulation.'
      },
      {
        id: 'FP-UNBAL-104',
        name: 'Rotor Mass Dynamic Unbalance',
        category: 'Rotating Assembly',
        similarity: activeFault === 'UNBALANCE' ? 99.1 : 32.0,
        frequencyPeaks: '50.0 Hz (1X Fundamental)',
        severity: 'WARNING',
        description: 'Centrifugal force vector from uneven mass distribution on drive shaft.'
      },
      {
        id: 'FP-MISALIGN-208',
        name: 'Jaw Coupling Angular & Parallel Misalignment',
        category: 'Coupling Assembly',
        similarity: activeFault === 'MISALIGNMENT' ? 97.5 : 21.0,
        frequencyPeaks: '100.0 Hz (2X Harmonic)',
        severity: 'WARNING',
        description: 'Dual-peak axial vibration caused by angular offset at flex coupling.'
      },
      {
        id: 'FP-CAV-505',
        name: 'Fluid Cavitation & Impeller Micro-Bubbles',
        category: 'Hydraulic System',
        similarity: activeFault === 'CAVITATION' ? 95.2 : 12.4,
        frequencyPeaks: 'High Band (2.5 kHz - 5 kHz Broadband)',
        severity: 'MODERATE',
        description: 'Vapor bubble collapse impact shocks against pump volute casing.'
      }
    ];

    const timer = setTimeout(() => {
      const sorted = [...DATABASE_CATALOG].sort((a, b) => b.similarity - a.similarity);
      setFingerprints(sorted);
      setSelectedFingerprint(sorted[0]);
      setIsScanning(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [isOpen, activeFault]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-purple-500/30 rounded-xl max-w-4xl w-full p-6 shadow-2xl overflow-hidden relative text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <Fingerprint className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                SoundPrint ID Engine
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono border border-purple-500/30">
                  COSINE MATCHING
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                CROSS-FLEET ACOUSTIC SPECTRAL FINGERPRINT COMPARATOR
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
        {isScanning ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-sm font-mono text-purple-300 animate-pulse">
              Extracting 64-band MFCC acoustic fingerprint & querying global catalog...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Catalog List */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Matched Defect Fingerprints
              </span>
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {fingerprints.map((fp) => (
                  <div
                    key={fp.id}
                    onClick={() => setSelectedFingerprint(fp)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedFingerprint?.id === fp.id
                        ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-950/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-mono font-bold text-purple-300">{fp.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                        fp.similarity > 90
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {fp.similarity}% MATCH
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1">{fp.name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{fp.frequencyPeaks}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Fingerprint View */}
            {selectedFingerprint && (
              <div className="lg:col-span-7 bg-slate-950/80 p-5 rounded-lg border border-slate-800 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-xs font-mono text-purple-400">{selectedFingerprint.category}</span>
                      <h3 className="text-base font-bold text-white">{selectedFingerprint.name}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold font-mono text-emerald-400">{selectedFingerprint.similarity}%</span>
                      <span className="text-xs text-slate-400 block font-mono">Similarity Score</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Harmonic Signatures:</span>
                      <span className="text-slate-200">{selectedFingerprint.frequencyPeaks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Severity Index:</span>
                      <span className="text-amber-400 font-bold">{selectedFingerprint.severity}</span>
                    </div>
                  </div>

                  {/* Fingerprint Spectral Match Visualizer */}
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-slate-400 block">Spectral Profile Overlay Match</span>
                    <div className="h-28 bg-slate-900 rounded border border-slate-800 p-2 flex items-end justify-between space-x-1">
                      {Array.from({ length: 24 }).map((_, i) => {
                        const h1 = Math.sin(i * 0.4) * 40 + 50;
                        const h2 = selectedFingerprint.similarity > 90 ? h1 + (Math.random() * 8 - 4) : Math.random() * 60 + 10;
                        return (
                          <div key={i} className="flex-1 flex flex-col justify-end items-center h-full">
                            <div
                              className="w-full bg-purple-500/80 rounded-t transition-all duration-300"
                              style={{ height: `${h2}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>20 Hz</span>
                      <span>500 Hz</span>
                      <span>1000 Hz</span>
                    </div>
                  </div>

                  <p className="text-xs font-mono text-slate-400 leading-relaxed bg-slate-900/40 p-3 rounded border border-slate-800/60">
                    {selectedFingerprint.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
