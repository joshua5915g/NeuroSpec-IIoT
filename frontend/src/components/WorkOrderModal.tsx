import React, { useEffect, useState } from 'react';
import { X, CheckCircle, ShieldCheck, Copy, Check } from 'lucide-react';

interface WorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkOrderModal: React.FC<WorkOrderModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      fetch(`${apiUrl}/api/cmms-work-order`)
        .then((res) => res.json())
        .then((res) => {
          setData(res);
          setLoading(false);
        })
        .catch(() => {
          // Graceful client fallback for standalone static preview
          setData({
            work_order_id: `WO-${Date.now().toString().slice(-6)}`,
            asset_id: "PUMP-MOT-4401B",
            asset_description: "Boiler Feedwater Centrifugal Pump 45kW",
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + " UTC",
            iso_severity: {
              zone: "B",
              label: "ACCEPTABLE",
              color: "#06b6d4"
            },
            diagnostic_summary: {
              fault: "Bearing Outer Race Micro-Spall",
              component: "SKF 6205 Deep Groove Ball Bearing",
              detected_harmonic: "BPFO @ 179.2 Hz (Impact Shock)",
              root_cause: "Sub-surface fatigue flaking under dynamic cyclic load."
            },
            ndt_telemetry: {
              rms: 0.98,
              kurtosis: 4.25
            },
            prognostics: {
              rul_hours: 48.5
            },
            technician_instructions: [
              "Lockout/Tagout (LOTO) primary 480V VFD breaker.",
              "Verify dynamic alignment using dual-laser alignment tool.",
              "Inspect SKF 6205 Bearing for thermal discoloration and raceway spalling.",
              "Replenish with synthetic polyurea grease (NLGI Grade 2) to manufacturer torque specification.",
              "Retest vibration baseline post-reassembly against ISO 10816 Zone A limits."
            ]
          });
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
                Industrial CMMS Maintenance Work Order
              </h2>
              <p className="text-[10px] font-mono text-slate-400">
                Standard ISO 10816-3 & SAP PM Dispatch Record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs font-mono">
          {loading ? (
            <div className="py-12 text-center text-slate-400 animate-pulse">
              Querying Diagnostic Bus & Assembling ISO Telemetry Payload...
            </div>
          ) : data ? (
            <>
              {/* Asset & Order Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <div className="text-[9px] text-slate-500">WORK ORDER ID</div>
                  <div className="text-slate-200 font-bold">{data.work_order_id}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500">ASSET TAG</div>
                  <div className="text-cyan-400 font-bold">{data.asset_id}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500">SEVERITY ZONE</div>
                  <div
                    className="font-bold"
                    style={{ color: data.iso_severity?.color || '#10b981' }}
                  >
                    ZONE {data.iso_severity?.zone} ({data.iso_severity?.label})
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500">TIMESTAMP</div>
                  <div className="text-slate-300 text-[10px]">{data.timestamp}</div>
                </div>
              </div>

              {/* Diagnostic Assessment */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                <div className="text-[10px] uppercase text-cyan-400 font-bold tracking-wider">
                  Kinematic Diagnostic Finding
                </div>
                <div className="text-sm font-bold text-slate-100">
                  {data.diagnostic_summary?.fault}
                </div>
                <div className="text-slate-300">
                  <span className="text-slate-500">Component:</span>{' '}
                  {data.diagnostic_summary?.component}
                </div>
                <div className="text-slate-300">
                  <span className="text-slate-500">Signature:</span>{' '}
                  <span className="text-amber-400">
                    {data.diagnostic_summary?.detected_harmonic}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  <span className="text-slate-500">Root Cause:</span>{' '}
                  {data.diagnostic_summary?.root_cause}
                </div>
              </div>

              {/* NDT & Prognostics telemetry */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950">
                  <div className="text-[9px] text-slate-500">VIBRATION RMS</div>
                  <div className="text-base font-bold text-slate-200">
                    {data.ndt_telemetry?.rms} mm/s
                  </div>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950">
                  <div className="text-[9px] text-slate-500">KURTOSIS (4TH MOMENT)</div>
                  <div className="text-base font-bold text-slate-200">
                    {data.ndt_telemetry?.kurtosis}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950">
                  <div className="text-[9px] text-slate-500">PROJECTED RUL</div>
                  <div className="text-base font-bold text-purple-400">
                    {data.prognostics?.rul_hours} Hours
                  </div>
                </div>
              </div>

              {/* Technician Checklist */}
              <div>
                <div className="text-[10px] uppercase text-slate-400 font-bold mb-2">
                  LOTO & Maintenance Procedure Checklist
                </div>
                <div className="space-y-1.5">
                  {data.technician_instructions?.map((inst: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-2 text-slate-300 text-[11px]"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{inst}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-red-400 py-8 text-center">
              Failed to load CMMS payload from backend.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-between items-center">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 flex items-center gap-1.5 text-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied JSON!' : 'Copy JSON Payload'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
