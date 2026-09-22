import React, { useState } from 'react';
import { X, CheckCircle2, ArrowRight, ShieldCheck, Download, Camera, RefreshCw, Sparkles, FileCheck2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface TelemetrySnapshot {
  timestamp: string;
  rms: number;
  kurtosis: number;
  crest_factor: number;
  pk_pk: number;
  isoZone: string;
  activeFault: string;
  rpm: number;
  fft: { freq: number; amp: number }[];
}

interface PrePostRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTelemetry: {
    rms: number;
    kurtosis: number;
    crest_factor: number;
    pk_pk: number;
    isoZone: { zone: string; label: string; color: string };
    activeFault: string;
    rpm: number;
    fft: { freq: number; amp: number }[];
  };
  onTriggerRepair: () => void;
}

export const PrePostRepairModal: React.FC<PrePostRepairModalProps> = ({
  isOpen,
  onClose,
  currentTelemetry,
  onTriggerRepair,
}) => {
  const [preRepair, setPreRepair] = useState<TelemetrySnapshot | null>(null);
  const [postRepair, setPostRepair] = useState<TelemetrySnapshot | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Capture Pre-Repair Snapshot
  const capturePreRepair = () => {
    setPreRepair({
      timestamp: new Date().toLocaleTimeString(),
      rms: currentTelemetry.rms,
      kurtosis: currentTelemetry.kurtosis,
      crest_factor: currentTelemetry.crest_factor,
      pk_pk: currentTelemetry.pk_pk,
      isoZone: currentTelemetry.isoZone.zone,
      activeFault: currentTelemetry.activeFault,
      rpm: currentTelemetry.rpm,
      fft: [...currentTelemetry.fft],
    });
  };

  // Capture Post-Repair Snapshot
  const capturePostRepair = () => {
    setPostRepair({
      timestamp: new Date().toLocaleTimeString(),
      rms: currentTelemetry.rms,
      kurtosis: currentTelemetry.kurtosis,
      crest_factor: currentTelemetry.crest_factor,
      pk_pk: currentTelemetry.pk_pk,
      isoZone: currentTelemetry.isoZone.zone,
      activeFault: currentTelemetry.activeFault,
      rpm: currentTelemetry.rpm,
      fft: [...currentTelemetry.fft],
    });
  };

  // Combine FFT data for side-by-side overlay chart
  const combinedFFT = preRepair?.fft.map((item, idx) => {
    return {
      freq: item.freq,
      preAmp: item.amp,
      postAmp: postRepair?.fft[idx]?.amp || 0,
    };
  }) || [];

  // Metrics Deltas
  const rmsDelta = preRepair && postRepair ? ((postRepair.rms - preRepair.rms) / preRepair.rms) * 100 : 0;
  const kurtosisDelta = preRepair && postRepair ? ((postRepair.kurtosis - preRepair.kurtosis) / preRepair.kurtosis) * 100 : 0;
  const pkPkDelta = preRepair && postRepair ? ((postRepair.pk_pk - preRepair.pk_pk) / preRepair.pk_pk) * 100 : 0;
  const isVerifiedPass = postRepair && (postRepair.isoZone === 'A' || postRepair.isoZone === 'B');

  const handleExportCertificate = () => {
    setIsExporting(true);
    const certificateText = `
================================================================================
ISO 10816-3 POST-MAINTENANCE QUALITY VERIFICATION CERTIFICATE
================================================================================
Asset ID:         PUMP-MOT-4401B (Boiler Feedwater Centrifugal Pump)
Bearing Unit:     SKF 6205 Drive-End Deep Groove Ball Bearing
Verification ID:  ISO-VER-${Date.now().toString().slice(-6)}
Timestamp:        ${new Date().toUTCString()}

PRE-REPAIR BASELINE:
--------------------------------------------------------------------------------
Fault Mode:       ${preRepair?.activeFault || 'N/A'}
ISO 10816 Zone:   Zone ${preRepair?.isoZone || 'N/A'} (UNSATISFACTORY/CRITICAL)
RMS Velocity:     ${preRepair?.rms.toFixed(3) || 'N/A'} mm/s
Pearson Kurtosis: ${preRepair?.kurtosis.toFixed(2) || 'N/A'}
Peak-to-Peak:     ${preRepair?.pk_pk.toFixed(3) || 'N/A'} mm

POST-REPAIR VERIFICATION:
--------------------------------------------------------------------------------
Fault Mode:       ${postRepair?.activeFault || 'HEALTHY'}
ISO 10816 Zone:   Zone ${postRepair?.isoZone || 'A'} (ACCEPTABLE / OPTIMAL)
RMS Velocity:     ${postRepair?.rms.toFixed(3) || 'N/A'} mm/s (${rmsDelta.toFixed(1)}% reduction)
Pearson Kurtosis: ${postRepair?.kurtosis.toFixed(2) || 'N/A'} (${kurtosisDelta.toFixed(1)}% delta)
Peak-to-Peak:     ${postRepair?.pk_pk.toFixed(3) || 'N/A'} mm (${pkPkDelta.toFixed(1)}% delta)

AUDIT VERDICT:
--------------------------------------------------------------------------------
STATUS:           ${isVerifiedPass ? 'PASS - APPROVED FOR FULL COMMERCIAL SERVICE' : 'CONDITIONAL'}
Standard:         ISO 10816-3 & ISO 20816-3 Vibration Severity
Certified By:     NeuroSpec IIoT Autonomous QA Engine
Sign-off Code:    NS-CERT-${Math.random().toString(36).substring(2, 9).toUpperCase()}
================================================================================
    `;

    const blob = new Blob([certificateText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ISO-10816-Verification-Certificate-${Date.now().toString().slice(-6)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/30 text-cyan-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Pre- vs. Post-Repair Verification Studio
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  ISO 10816-3 AUDIT
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Capture baseline telemetry before maintenance, apply repair, and verify vibration suppression.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-200">
          {/* Step Action Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Step 1: Capture Pre-Repair */}
            <div className={`p-3 rounded-xl border transition-all ${preRepair ? 'bg-red-950/20 border-red-500/40' : 'bg-slate-800/40 border-slate-700'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-red-400">STEP 1: PRE-REPAIR</span>
                {preRepair && <CheckCircle2 className="w-4 h-4 text-red-400" />}
              </div>
              <p className="text-[11px] text-slate-400 font-mono mb-3">
                {preRepair ? `Captured @ ${preRepair.timestamp} (Zone ${preRepair.isoZone})` : 'Capture vibration signature while machine is faulty.'}
              </p>
              <button
                onClick={capturePreRepair}
                className="w-full py-2 px-3 rounded-lg font-mono text-xs font-bold bg-red-600/30 hover:bg-red-600/50 border border-red-500 text-red-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Camera className="w-3.5 h-3.5" />
                {preRepair ? 'RE-CAPTURE PRE-REPAIR' : 'CAPTURE PRE-REPAIR'}
              </button>
            </div>

            {/* Step 2: Execute Auto-Heal */}
            <div className="p-3 rounded-xl border bg-slate-800/40 border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-cyan-400">STEP 2: EXECUTE FIX</span>
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-[11px] text-slate-400 font-mono mb-3">
                Trigger autonomous stabilization or bearing replacement procedure.
              </p>
              <button
                onClick={onTriggerRepair}
                className="w-full py-2 px-3 rounded-lg font-mono text-xs font-bold bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500 text-cyan-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                EXECUTE STABILIZATION / REPAIR
              </button>
            </div>

            {/* Step 3: Capture Post-Repair */}
            <div className={`p-3 rounded-xl border transition-all ${postRepair ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-slate-800/40 border-slate-700'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-emerald-400">STEP 3: POST-REPAIR</span>
                {postRepair && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-[11px] text-slate-400 font-mono mb-3">
                {postRepair ? `Captured @ ${postRepair.timestamp} (Zone ${postRepair.isoZone})` : 'Capture vibration profile after repair to confirm fix.'}
              </p>
              <button
                onClick={capturePostRepair}
                disabled={!preRepair}
                className={`w-full py-2 px-3 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  preRepair
                    ? 'bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500 text-emerald-200 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                {postRepair ? 'RE-CAPTURE POST-REPAIR' : 'CAPTURE POST-REPAIR'}
              </button>
            </div>
          </div>

          {/* Comparative Metrics Delta Cards */}
          {preRepair && postRepair && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-mono text-slate-400">RMS VIBRATION</div>
                <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                  {rmsDelta.toFixed(1)}%
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {preRepair.rms.toFixed(2)} → {postRepair.rms.toFixed(2)} mm/s
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-mono text-slate-400">KURTOSIS (IMPACT)</div>
                <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                  {kurtosisDelta.toFixed(1)}%
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {preRepair.kurtosis.toFixed(2)} → {postRepair.kurtosis.toFixed(2)}
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-mono text-slate-400">PEAK-TO-PEAK</div>
                <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                  {pkPkDelta.toFixed(1)}%
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {preRepair.pk_pk.toFixed(2)} → {postRepair.pk_pk.toFixed(2)} mm
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-mono text-slate-400">ISO 10816 ZONE</div>
                <div className="text-base font-bold font-mono text-emerald-400 mt-1 flex items-center justify-center gap-1">
                  <span className="text-red-400">Zone {preRepair.isoZone}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-emerald-400">Zone {postRepair.isoZone}</span>
                </div>
                <div className="text-[10px] font-mono text-emerald-400 font-semibold">
                  {isVerifiedPass ? 'PASSED VERIFICATION' : 'CHECK NEEDED'}
                </div>
              </div>
            </div>
          )}

          {/* Side-by-Side Superimposed FFT Spectrum Chart */}
          {preRepair && (
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  Superimposed FFT Frequency Spectrum Comparison
                </h3>
                <div className="flex items-center gap-4 text-[10px] font-mono">
                  <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                    <span className="w-3 h-3 rounded bg-red-500/30 border border-red-500 inline-block"></span>
                    Pre-Repair Spectrum
                  </span>
                  {postRepair && (
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500 inline-block"></span>
                      Post-Repair Spectrum
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full" style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={combinedFFT}>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: 11 }}
                      formatter={(val: any, name: string) => [
                        val?.toFixed(3),
                        name === 'preAmp' ? 'Pre-Repair Amplitude' : 'Post-Repair Amplitude',
                      ]}
                      labelFormatter={(freq) => `${freq} Hz`}
                    />
                    <XAxis dataKey="freq" stroke="#475569" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                    <Area
                      type="monotone"
                      dataKey="preAmp"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.25}
                      strokeWidth={1.8}
                    />
                    {postRepair && (
                      <Area
                        type="monotone"
                        dataKey="postAmp"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.35}
                        strokeWidth={2}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ISO 10816 Quality Assurance Protocol</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCertificate}
              disabled={!preRepair || !postRepair}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all ${
                preRepair && postRepair
                  ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-950 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'EXPORTING...' : 'EXPORT ISO 10816 VERIFICATION CERTIFICATE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
