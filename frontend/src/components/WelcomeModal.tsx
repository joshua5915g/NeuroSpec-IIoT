import { useState } from 'react';
import {
  Activity,
  Zap,
  Shield,
  HelpCircle,
  X,
  Play,
  CheckCircle2,
  Cpu,
  TrendingDown,
  Volume2
} from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: 'HEALTHY' | 'FAULT' | 'AUTO_HEAL') => void;
  onStartTour: () => void;
}

export function WelcomeModal({ isOpen, onClose, onSelectScenario, onStartTour }: WelcomeModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem('neurospec_onboarding_dismissed', 'true');
    }
    onClose();
  };

  const handleScenarioClick = (scenario: 'HEALTHY' | 'FAULT' | 'AUTO_HEAL') => {
    if (dontShowAgain) {
      localStorage.setItem('neurospec_onboarding_dismissed', 'true');
    }
    onSelectScenario(scenario);
    onClose();
  };

  const handleStartTourClick = () => {
    if (dontShowAgain) {
      localStorage.setItem('neurospec_onboarding_dismissed', 'true');
    }
    onClose();
    onStartTour();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-3xl w-full p-6 shadow-2xl shadow-emerald-950/50 overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  Welcome to <span className="text-emerald-400">NEUROSPEC IIoT</span>
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                  PLATFORM GUIDE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Enterprise Acoustic Condition Monitoring & Predictive Maintenance System
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto pr-1 space-y-5 flex-1">
          {/* Quick Value Statement */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              What is this platform?
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              NeuroSpec IIoT continuously listens to rotating industrial machinery (turbines, generators, motors, SKF 6205 bearings) using 
              <strong className="text-emerald-400"> high-speed acoustic emission (10 kHz)</strong> and 
              <strong className="text-cyan-400"> Fast Fourier Transform (FFT) analysis</strong>. It detects micro-cracks and bearing spalls 
              <span className="text-amber-300 font-semibold"> hundreds of hours before catastrophic breakdown</span>, preventing costly downtime and ISO 10816-3 violations.
            </p>
          </div>

          {/* Core Feature Pillars */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Core Capabilities in This Dashboard
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Acoustic & Kinematic FFT</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Zero-padded FFT matches harmonics to outer race (BPFO), inner race (BPFI), and ball spin (BSF) equations.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">ISO 10816-3 Severity Zones</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Classifies machinery health across Zones A (Optimal) to D (Critical Shutdown) based on true RMS vibration.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">AI Resonance Auto-Healing</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Autonomous closed-loop VFD modulation shifts machinery frequency away from destructive resonance peaks.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Prognostics & Financial Loss</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Tracks Remaining Useful Life (RUL) and live downtime losses (€14/s) with SAP/IBM Maximo dispatch integration.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Quick-Start Scenarios */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
              <span>Quick-Start Interactive Scenarios</span>
              <span className="text-[10px] text-emerald-400 font-mono">Click to test live</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <button
                onClick={() => handleScenarioClick('HEALTHY')}
                className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-600/40 hover:border-emerald-400 hover:bg-emerald-950/60 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-400">1. Baseline Normal</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Turbine at 3000 RPM in ISO Zone A with nominal acoustic harmonics.
                </p>
              </button>

              <button
                onClick={() => handleScenarioClick('FAULT')}
                className="p-3 rounded-xl bg-red-950/30 border border-red-600/40 hover:border-red-400 hover:bg-red-950/60 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-red-400">2. Bearing Fault</span>
                  <Zap className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Injects BPFO outer-race spall, triggers €/s loss ticker and Zone D alert.
                </p>
              </button>

              <button
                onClick={() => handleScenarioClick('AUTO_HEAL')}
                className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-600/40 hover:border-cyan-400 hover:bg-cyan-950/60 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-cyan-400">3. AI Auto-Heal</span>
                  <Cpu className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Simulates a fault and demonstrates real-time closed-loop resonance avoidance.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-4 mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
            />
            <span>Don't show this guide on startup</span>
          </label>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleDismiss}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors w-full sm:w-auto cursor-pointer"
            >
              Explore Freely
            </button>
            <button
              onClick={handleStartTourClick}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all w-full sm:w-auto hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start 4-Step Demo Tour</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
