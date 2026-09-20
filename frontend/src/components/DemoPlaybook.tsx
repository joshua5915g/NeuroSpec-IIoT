import { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Zap,
  Gauge,
  Cpu,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  X
} from 'lucide-react';

interface DemoPlaybookProps {
  isOpen: boolean;
  onClose: () => void;
  rpm: number;
  isCritical: boolean;
  isHealing: boolean;
  isWorkOrderOpen: boolean;
  onSetRpm: (rpm: number) => void;
  onInjectFailure: () => void;
  onAutoHeal: () => void;
  onOpenWorkOrder: () => void;
  onResetAll: () => void;
}

export function DemoPlaybook({
  isOpen,
  onClose,
  rpm,
  isCritical,
  isHealing,
  isWorkOrderOpen,
  onSetRpm,
  onInjectFailure,
  onAutoHeal,
  onOpenWorkOrder,
  onResetAll,
}: DemoPlaybookProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<{ [key: number]: boolean }>({});

  if (!isOpen) return null;

  // Dynamically evaluate step completion
  const step1Done = completedSteps[1] || rpm !== 3000;
  const step2Done = completedSteps[2] || isCritical;
  const step3Done = completedSteps[3] || isHealing;
  const step4Done = completedSteps[4] || isWorkOrderOpen;

  const totalCompleted = [step1Done, step2Done, step3Done, step4Done].filter(Boolean).length;
  const allCompleted = totalCompleted === 4;

  const markStepDone = (stepNumber: number) => {
    setCompletedSteps(prev => ({ ...prev, [stepNumber]: true }));
  };

  const handleStep1 = () => {
    onSetRpm(rpm === 3000 ? 3600 : 3000);
    markStepDone(1);
  };

  const handleStep2 = () => {
    if (!isCritical) {
      onInjectFailure();
    }
    markStepDone(2);
  };

  const handleStep3 = () => {
    if (!isCritical) {
      onInjectFailure();
    }
    setTimeout(() => {
      onAutoHeal();
      markStepDone(3);
    }, 200);
  };

  const handleStep4 = () => {
    onOpenWorkOrder();
    markStepDone(4);
  };

  const handleReset = () => {
    setCompletedSteps({});
    onResetAll();
  };

  return (
    <aside aria-label="Interactive Demo Playbook" className="fixed bottom-4 right-4 z-40 max-w-sm w-[calc(100vw-2rem)] sm:w-96 transition-all duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl shadow-2xl shadow-emerald-950/60 overflow-hidden">
        {/* Header */}
        <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-wider flex items-center gap-1.5">
                DEMO PLAYBOOK
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  {totalCompleted}/4
                </span>
              </div>
              <div className="text-[10px] text-slate-400">Interactive 60-Second Walkthrough</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${(totalCompleted / 4) * 100}%` }}
          />
        </div>

        {/* Body Content */}
        {!isMinimized && (
          <div className="p-3.5 space-y-2.5">
            {/* Step 1: VFD Speed */}
            <div
              className={`p-2.5 rounded-xl border transition-all ${
                step1Done ? 'bg-slate-950/40 border-slate-800/80 opacity-80' : 'bg-slate-950/80 border-emerald-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  {step1Done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-xs font-semibold text-slate-200">1. Adjust Drive Speed (VFD)</div>
                    <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      Change RPM to watch fundamental 1X frequency shift dynamically.
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleStep1}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 shrink-0 flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Gauge className="w-3 h-3" />
                  <span>{rpm === 3000 ? 'Set 3600' : 'Reset'}</span>
                </button>
              </div>
            </div>

            {/* Step 2: Fault Injection */}
            <div
              className={`p-2.5 rounded-xl border transition-all ${
                step2Done ? 'bg-slate-950/40 border-slate-800/80 opacity-80' : 'bg-slate-950/80 border-red-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  {step2Done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-xs font-semibold text-slate-200">2. Simulate Bearing Spall (BPFO)</div>
                    <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      Inject outer race damage; observe 179.2 Hz FFT peak and €/s loss ticker.
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleStep2}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 flex items-center gap-1 transition-all cursor-pointer ${
                    isCritical
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/50'
                      : 'bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-700/50'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>{isCritical ? 'Injected' : 'Inject'}</span>
                </button>
              </div>
            </div>

            {/* Step 3: AI Auto-Heal */}
            <div
              className={`p-2.5 rounded-xl border transition-all ${
                step3Done ? 'bg-slate-950/40 border-slate-800/80 opacity-80' : 'bg-slate-950/80 border-cyan-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  {step3Done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-xs font-semibold text-slate-200">3. Engage AI Auto-Heal</div>
                    <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      AI modulates VFD drive frequency away from critical resonance harmonics.
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleStep3}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/50 shrink-0 flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Cpu className="w-3 h-3" />
                  <span>Auto-Heal</span>
                </button>
              </div>
            </div>

            {/* Step 4: CMMS Work Order */}
            <div
              className={`p-2.5 rounded-xl border transition-all ${
                step4Done ? 'bg-slate-950/40 border-slate-800/80 opacity-80' : 'bg-slate-950/80 border-purple-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  {step4Done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-xs font-semibold text-slate-200">4. Dispatch CMMS Work Order</div>
                    <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      Auto-generate SAP PM / IBM Maximo maintenance work order.
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleStep4}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-700/50 shrink-0 flex items-center gap-1 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  <span>Work Order</span>
                </button>
              </div>
            </div>

            {/* Completion Banner */}
            {allCompleted && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-center animate-fadeIn">
                <div className="text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Tour Complete: Certified IIoT Operator!
                </div>
                <p className="text-[10px] text-slate-300 mt-1">
                  You have explored real-time FFT kinematics, ISO zones, auto-healing, and CMMS dispatching.
                </p>
                <button
                  onClick={handleReset}
                  className="mt-2 text-[10px] text-emerald-400 hover:text-emerald-300 font-mono flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Demo Steps</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
