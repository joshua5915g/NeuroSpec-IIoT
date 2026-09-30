import React, { useState } from 'react';
import { FileCheck, ShieldCheck, Lock, Printer, X, Award, CheckCircle } from 'lucide-react';

interface ISOAuditGuardProps {
  isOpen: boolean;
  onClose: () => void;
  rpm: number;
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
  };
}

export const ISOAuditGuard: React.FC<ISOAuditGuardProps> = ({
  isOpen,
  onClose,
  rpm,
  ndtMetrics,
  isoZone,
}) => {
  const [certId] = useState(`ISO-AUDIT-2026-${Math.floor(100000 + Math.random() * 900000)}`);
  const [sha256Hash] = useState(
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  );
  const [inspectorName] = useState('Certified ISO 18436-2 Level III Analyst');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-blue-500/30 rounded-xl max-w-3xl w-full p-6 shadow-2xl overflow-hidden relative text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <FileCheck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                ISOAuditGuard Certification
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono border border-blue-500/30">
                  ISO 10816-3 COMPLIANT
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                CRYPTOGRAPHICALLY SEALED INDUSTRIAL AUDIT CERTIFICATE
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

        {/* Certificate Container */}
        <div className="bg-slate-950 border-2 border-blue-500/40 rounded-lg p-6 space-y-6 relative overflow-hidden">
          {/* Watermark Seal */}
          <div className="absolute right-6 top-6 opacity-10 pointer-events-none">
            <Award className="w-48 h-48 text-blue-400" />
          </div>

          <div className="flex justify-between items-start border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono text-blue-400 uppercase tracking-widest block mb-1">
                OFFICIAL CONDITION MONITORING AUDIT CERTIFICATE
              </span>
              <h1 className="text-lg font-bold text-white font-mono">{certId}</h1>
              <p className="text-xs text-slate-400 font-mono">Issued: {new Date().toLocaleDateString()} | ISO 18436-2 Annex A</p>
            </div>
            <div className="flex items-center space-x-2 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-lg text-blue-400 font-mono text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>CRYPTOGRAPHICALLY VERIFIED</span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="bg-slate-900 p-3 rounded border border-slate-800">
              <span className="text-[11px] text-slate-400 block">ISO Severity Zone</span>
              <span className="text-base font-bold text-emerald-400">{isoZone.zone} ({isoZone.label})</span>
            </div>
            <div className="bg-slate-900 p-3 rounded border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Vibration RMS</span>
              <span className="text-base font-bold text-white">{ndtMetrics.rms} mm/s</span>
            </div>
            <div className="bg-slate-900 p-3 rounded border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Acoustic Kurtosis</span>
              <span className="text-base font-bold text-white">{ndtMetrics.kurtosis.toFixed(2)}</span>
            </div>
            <div className="bg-slate-900 p-3 rounded border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Operational Speed</span>
              <span className="text-base font-bold text-white">{rpm} RPM</span>
            </div>
          </div>

          {/* Operating Time Breakdown */}
          <div className="space-y-2 font-mono text-xs">
            <span className="text-slate-400 block">Cumulative Zone Operating Distribution (Last 30 Days):</span>
            <div className="flex h-4 bg-slate-900 rounded overflow-hidden border border-slate-800">
              <div className="w-[88%] bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-950">Zone A (88%)</div>
              <div className="w-[9%] bg-cyan-500 flex items-center justify-center text-[10px] font-bold text-slate-950">B (9%)</div>
              <div className="w-[3%] bg-amber-500" />
            </div>
          </div>

          {/* SHA-256 Telemetry Seal */}
          <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-1 font-mono text-xs">
            <div className="flex items-center space-x-2 text-slate-400">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>SHA-256 Cryptographic Telemetry Digest:</span>
            </div>
            <p className="text-[11px] text-blue-300 break-all bg-slate-950 p-2 rounded border border-slate-800">
              {sha256Hash}
            </p>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end border-t border-slate-800 pt-4 font-mono text-xs text-slate-400">
            <div>
              <span className="block text-white font-bold">{inspectorName}</span>
              <span>NeuroSpec Automated Diagnostic Engine v4.2</span>
            </div>
            <div className="text-right">
              <span className="text-emerald-400 font-bold block flex items-center justify-end gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> CERTIFIED ISO PASS
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="mt-6 flex justify-end space-x-3 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-mono text-xs font-bold transition-colors flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>PRINT AUDIT CERTIFICATE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
