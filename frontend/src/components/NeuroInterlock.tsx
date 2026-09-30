import React, { useState, useEffect } from 'react';
import { Cpu, ShieldAlert, RefreshCw, X } from 'lucide-react';

interface NeuroInterlockProps {
  isOpen: boolean;
  onClose: () => void;
  rpm: number;
  setRpm: React.Dispatch<React.SetStateAction<number>>;
  isCritical: boolean;
}

export const NeuroInterlock: React.FC<NeuroInterlockProps> = ({
  isOpen,
  onClose,
  rpm,
  setRpm,
  isCritical
}) => {
  const [opcServerUrl, setOpcServerUrl] = useState('opc.tcp://192.168.10.45:4840/NeuroSpec/PLC');
  const [nodeId, setNodeId] = useState('ns=2;s=MainDrive.SpeedReference');
  const [autoDerateEnabled, setAutoDerateEnabled] = useState(true);
  const [targetDerateRpm] = useState(1800);
  const [isInterlockActive, setIsInterlockActive] = useState(false);
  const [plcStatus, setPlcStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'DERATING'>('CONNECTED');
  const [derateProgress, setDerateProgress] = useState(0);

  // Trigger interlock if auto-derate enabled and isCritical
  useEffect(() => {
    if (isCritical && autoDerateEnabled && !isInterlockActive) {
      setIsInterlockActive(true);
      setPlcStatus('DERATING');
    }
  }, [isCritical, autoDerateEnabled, isInterlockActive]);

  // Execute RPM de-rate loop
  useEffect(() => {
    if (!isInterlockActive) return;

    const startRpm = rpm;
    const endRpm = targetDerateRpm;
    if (startRpm <= endRpm) {
      setPlcStatus('CONNECTED');
      return;
    }

    const interval = setInterval(() => {
      setRpm((prevRpm: number) => {
        const nextRpm = Math.max(endRpm, prevRpm - 40);
        const progress = Math.min(100, ((startRpm - nextRpm) / (startRpm - endRpm)) * 100);
        setDerateProgress(parseFloat(progress.toFixed(0)));
        if (nextRpm <= endRpm) {
          clearInterval(interval);
          setPlcStatus('CONNECTED');
        }
        return nextRpm;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isInterlockActive, targetDerateRpm, setRpm]);

  const handleManualOverride = () => {
    setIsInterlockActive(false);
    setPlcStatus('CONNECTED');
    setDerateProgress(0);
    setRpm(3000); // Reset to rated speed
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/30 rounded-xl max-w-3xl w-full p-6 shadow-2xl overflow-hidden relative text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <Cpu className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                NeuroInterlock SCADA/PLC
                <span className={`text-xs px-2 py-0.5 rounded font-mono border ${
                  plcStatus === 'DERATING'
                    ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  OPC-UA: {plcStatus}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                CLOSED-LOOP AUTONOMOUS PLC DE-RATING & SAFETY INTERLOCK
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

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SCADA Configuration */}
          <div className="space-y-4">
            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-3">
              <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                <span>OPC-UA Gateway Settings</span>
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              </h3>
              <div>
                <label className="text-xs text-slate-400 font-mono">Server Endpoint</label>
                <input
                  type="text"
                  value={opcServerUrl}
                  onChange={(e) => setOpcServerUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-amber-300 font-mono mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-mono">Drive Speed Tag (NodeID)</label>
                <input
                  type="text"
                  value={nodeId}
                  onChange={(e) => setNodeId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-300 font-mono mt-1"
                />
              </div>
            </div>

            {/* Threshold Rules */}
            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-3">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Automated Trigger Criteria
              </h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400">ISO 10816 Severity</span>
                  <span className="text-red-400 font-bold">Zone C / Zone D</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400">Acoustic Kurtosis</span>
                  <span className="text-amber-400 font-bold">&gt; 4.0 (Impulse Shock)</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400">Autoencoder Anomaly MSE</span>
                  <span className="text-amber-400 font-bold">&gt; 10.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interlock Status & De-rate Controls */}
          <div className="space-y-4">
            <div className="bg-slate-950/80 p-5 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                    Closed-Loop Controller Mode
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoDerateEnabled}
                      onChange={(e) => setAutoDerateEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Current Motor Speed:</span>
                    <span className="text-lg font-bold text-white">{rpm} RPM</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">De-Rate Target Speed:</span>
                    <span className="text-lg font-bold text-amber-400">{targetDerateRpm} RPM</span>
                  </div>
                </div>

                {/* De-rate Progress Bar */}
                {isInterlockActive && (
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-xs font-mono text-red-400">
                      <span>AUTOMATED RAMP-DOWN ACTIVE</span>
                      <span>{derateProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full transition-all duration-300"
                        style={{ width: `${derateProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Safety Interlock Reset */}
              <button
                onClick={handleManualOverride}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center space-x-2"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>OVERRIDE & RESET TO RATED 3000 RPM</span>
              </button>
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-500/20 rounded-lg text-xs font-mono text-amber-300/80 leading-relaxed">
              <strong>SAFETY NOTICE:</strong> De-rating motor speed by 40% reduces stress forces on damaged bearing raceways by ~64%, enabling safe operation until shift handover.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
