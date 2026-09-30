import React, { useState, useEffect, useRef } from 'react';
import { Crosshair, RotateCw, Layers, X } from 'lucide-react';

interface KineticBalancerProps {
  isOpen: boolean;
  onClose: () => void;
  rpm: number;
}

export const KineticBalancer: React.FC<KineticBalancerProps> = ({ isOpen, onClose, rpm }) => {
  const [activeTab, setActiveTab] = useState<'BALANCING' | 'ALIGNMENT'>('BALANCING');

  // --- 1-Plane Balancing State ---
  const [v1Amp, setV1Amp] = useState<number>(4.2); // mm/s RMS
  const [v1Phase, setV1Phase] = useState<number>(45); // deg
  const [trialMass, setTrialMass] = useState<number>(15.0); // grams
  const [trialAngle, setTrialAngle] = useState<number>(90); // deg
  const [vTrialAmp, setVTrialAmp] = useState<number>(2.8); // mm/s RMS
  const [vTrialPhase, setVTrialPhase] = useState<number>(120); // deg

  // Calculated Results
  const [correctionMass, setCorrectionMass] = useState<number>(0);
  const [correctionAngle, setCorrectionAngle] = useState<number>(0);
  const [residualVib, setResidualVib] = useState<number>(0);
  const [isoGrade, setIsoGrade] = useState<string>('G 2.5');

  // --- Laser Alignment State ---
  const [couplingDia, setCouplingDia] = useState<number>(120); // mm
  const [distFront, setDistFront] = useState<number>(250); // mm
  const [distRear, setDistRear] = useState<number>(550); // mm
  const [vertOffset, setVertOffset] = useState<number>(0.35); // mm
  const [vertGap, setVertGap] = useState<number>(0.12); // mm gap over dia
  const [horizOffset, setHorizOffset] = useState<number>(-0.18); // mm
  const [horizGap, setHorizGap] = useState<number>(-0.08); // mm gap over dia

  // Alignment Results
  const [frontVertShim, setFrontVertShim] = useState<number>(0);
  const [rearVertShim, setRearVertShim] = useState<number>(0);
  const [frontHorizMove, setFrontHorizMove] = useState<number>(0);
  const [rearHorizMove, setRearHorizMove] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- Calculate Dynamic Balancing ---
  useEffect(() => {
    const rad1 = (v1Phase * Math.PI) / 180;
    const v1x = v1Amp * Math.cos(rad1);
    const v1y = v1Amp * Math.sin(rad1);

    const radT = (vTrialPhase * Math.PI) / 180;
    const vTx = vTrialAmp * Math.cos(radT);
    const vTy = vTrialAmp * Math.sin(radT);

    const dX = vTx - v1x;
    const dY = vTy - v1y;
    const effectAmp = Math.sqrt(dX * dX + dY * dY);

    if (effectAmp === 0) return;

    const sensitivity = effectAmp / trialMass;
    const calcMass = v1Amp / sensitivity;

    let effectAngleDeg = (Math.atan2(dY, dX) * 180) / Math.PI;
    if (effectAngleDeg < 0) effectAngleDeg += 360;

    const alpha = trialAngle - effectAngleDeg;
    let calcAngle = v1Phase - alpha + 180;
    calcAngle = ((calcAngle % 360) + 360) % 360;

    setCorrectionMass(parseFloat(calcMass.toFixed(2)));
    setCorrectionAngle(parseFloat(calcAngle.toFixed(1)));

    const residual = Math.max(0.15, v1Amp * 0.08);
    setResidualVib(parseFloat(residual.toFixed(2)));

    if (residual < 0.5) setIsoGrade('G 1.0 (Precision)');
    else if (residual < 1.4) setIsoGrade('G 2.5 (Optimal)');
    else if (residual < 2.8) setIsoGrade('G 6.3 (Acceptable)');
    else setIsoGrade('G 16 (Unbalanced)');
  }, [v1Amp, v1Phase, trialMass, trialAngle, vTrialAmp, vTrialPhase]);

  // --- Render Polar Canvas ---
  useEffect(() => {
    if (!isOpen || activeTab !== 'BALANCING' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 30;

    ctx.clearRect(0, 0, width, height);

    // Draw background concentric circles
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    for (let r = radius / 4; r <= radius; r += radius / 4) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw crosshair axes
    ctx.beginPath();
    ctx.moveTo(centerX - radius - 10, centerY);
    ctx.lineTo(centerX + radius + 10, centerY);
    ctx.moveTo(centerX, centerY - radius - 10);
    ctx.lineTo(centerX, centerY + radius + 10);
    ctx.stroke();

    // Degree labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px monospace';
    ctx.fillText('0°', centerX + radius + 12, centerY + 3);
    ctx.fillText('90°', centerX - 8, centerY - radius - 12);
    ctx.fillText('180°', centerX - radius - 28, centerY + 3);
    ctx.fillText('270°', centerX - 10, centerY + radius + 18);

    const maxAmp = Math.max(v1Amp, vTrialAmp, 6.0);
    const scale = radius / maxAmp;

    // Draw V1 Vector (Red)
    const rad1 = (-v1Phase * Math.PI) / 180;
    const v1X = centerX + v1Amp * scale * Math.cos(rad1);
    const v1Y = centerY + v1Amp * scale * Math.sin(rad1);

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(v1X, v1Y);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(v1X, v1Y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`V1 (${v1Amp} mm/s @ ${v1Phase}°)`, v1X + 8, v1Y - 4);

    // Draw Correction Vector (Emerald)
    const radC = (-correctionAngle * Math.PI) / 180;
    const cX = centerX + (v1Amp * 0.9) * scale * Math.cos(radC);
    const cY = centerY + (v1Amp * 0.9) * scale * Math.sin(radC);

    ctx.strokeStyle = '#10b981';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(cX, cY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(cX, cY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`ADD: ${correctionMass}g @ ${correctionAngle}°`, cX + 8, cY + 12);
  }, [isOpen, activeTab, v1Amp, v1Phase, vTrialAmp, vTrialPhase, correctionMass, correctionAngle]);

  // --- Calculate Laser Alignment ---
  useEffect(() => {
    if (couplingDia === 0) return;
    const vertAngleRad = vertGap / couplingDia;
    const horizAngleRad = horizGap / couplingDia;

    const fVert = vertOffset + vertAngleRad * distFront;
    const rVert = vertOffset + vertAngleRad * (distFront + distRear);

    const fHoriz = horizOffset + horizAngleRad * distFront;
    const rHoriz = horizOffset + horizAngleRad * (distFront + distRear);

    setFrontVertShim(parseFloat(fVert.toFixed(2)));
    setRearVertShim(parseFloat(rVert.toFixed(2)));
    setFrontHorizMove(parseFloat(fHoriz.toFixed(2)));
    setRearHorizMove(parseFloat(rHoriz.toFixed(2)));
  }, [couplingDia, distFront, distRear, vertOffset, vertGap, horizOffset, horizGap]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-xl max-w-4xl w-full p-6 shadow-2xl overflow-hidden relative text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <Crosshair className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                KineticBalancer Pro
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                  ISO 1940
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                ROTOR DYNAMIC BALANCING & PRECISION DUAL-LASER ALIGNMENT CALCULATOR
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

        {/* Tab Switcher */}
        <div className="flex space-x-2 border-b border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab('BALANCING')}
            className={`px-4 py-2 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'BALANCING'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className="w-4 h-4" />
            <span>1-Plane Polar Rotor Balancing</span>
          </button>
          <button
            onClick={() => setActiveTab('ALIGNMENT')}
            className={`px-4 py-2 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'ALIGNMENT'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Dual-Laser Shaft Alignment</span>
          </button>
        </div>

        {/* --- TAB 1: 1-PLANE ROTOR BALANCING --- */}
        {activeTab === 'BALANCING' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Controls */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800">
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>1. Initial Run Telemetry (V1)</span>
                  <span className="text-red-400 font-normal">Unbalance Peak</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-mono">1X Amp (mm/s RMS)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={v1Amp}
                      onChange={(e) => setV1Amp(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-mono">Phase Angle (°)</label>
                    <input
                      type="number"
                      value={v1Phase}
                      onChange={(e) => setV1Phase(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800">
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
                  2. Trial Weight Mass Run
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-400 font-mono">Trial Mass (g)</label>
                    <input
                      type="number"
                      value={trialMass}
                      onChange={(e) => setTrialMass(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-mono">Trial Angle (°)</label>
                    <input
                      type="number"
                      value={trialAngle}
                      onChange={(e) => setTrialAngle(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-mono">V_Trial Amp (mm/s)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={vTrialAmp}
                      onChange={(e) => setVTrialAmp(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-mono">V_Trial Phase (°)</label>
                    <input
                      type="number"
                      value={vTrialPhase}
                      onChange={(e) => setVTrialPhase(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Solution Output Box */}
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wide">
                    CORRECTION MASS SOLUTION
                  </span>
                  <span className="text-xs font-mono text-emerald-300 bg-emerald-900/50 px-2 py-0.5 rounded border border-emerald-600/30">
                    {isoGrade}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 my-2">
                  <div>
                    <span className="text-xs text-slate-400 block font-mono">Add Mass</span>
                    <span className="text-2xl font-bold font-mono text-white">{correctionMass} <span className="text-sm font-normal text-emerald-400">grams</span></span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-mono">Polar Location</span>
                    <span className="text-2xl font-bold font-mono text-white">{correctionAngle}° <span className="text-sm font-normal text-emerald-400">CW</span></span>
                  </div>
                </div>
                <div className="text-xs font-mono text-slate-400 border-t border-emerald-900/60 pt-2 flex justify-between">
                  <span>Target Residual Vib: <strong className="text-white">{residualVib} mm/s</strong></span>
                  <span>Operational Speed: <strong className="text-white">{rpm} RPM</strong></span>
                </div>
              </div>
            </div>

            {/* Canvas Vector Plot */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center bg-slate-950/80 rounded-lg border border-slate-800 p-4">
              <span className="text-xs font-mono text-slate-400 mb-2">POLAR VECTOR DISK DIAGRAM</span>
              <canvas ref={canvasRef} width={340} height={340} className="rounded" />
              <div className="flex items-center justify-center space-x-6 mt-4 text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-slate-300">Initial Unbalance V1</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <span className="text-slate-300">Correction Mass</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: DUAL LASER SHAFT ALIGNMENT --- */}
        {activeTab === 'ALIGNMENT' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800">
                <label className="text-xs text-slate-400 font-mono">Coupling Diameter D (mm)</label>
                <input
                  type="number"
                  value={couplingDia}
                  onChange={(e) => setCouplingDia(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white font-mono mt-1"
                />
              </div>
              <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800">
                <label className="text-xs text-slate-400 font-mono">Distance to Front Feet L1 (mm)</label>
                <input
                  type="number"
                  value={distFront}
                  onChange={(e) => setDistFront(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white font-mono mt-1"
                />
              </div>
              <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800">
                <label className="text-xs text-slate-400 font-mono">Distance to Rear Feet L2 (mm)</label>
                <input
                  type="number"
                  value={distRear}
                  onChange={(e) => setDistRear(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white font-mono mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vertical Misalignment */}
              <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-3">
                <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Vertical Plane (Shimming Corrections)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-mono">Vertical Offset (mm)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={vertOffset}
                      onChange={(e) => setVertOffset(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-mono">Vertical Gap (mm)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={vertGap}
                      onChange={(e) => setVertGap(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white font-mono"
                    />
                  </div>
                </div>

                <div className="bg-cyan-950/30 border border-cyan-500/30 rounded p-3 space-y-2 mt-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Front Feet Shim:</span>
                    <strong className="text-cyan-300 font-bold">
                      {frontVertShim >= 0 ? `ADD ${frontVertShim} mm` : `REMOVE ${Math.abs(frontVertShim)} mm`}
                    </strong>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Rear Feet Shim:</span>
                    <strong className="text-cyan-300 font-bold">
                      {rearVertShim >= 0 ? `ADD ${rearVertShim} mm` : `REMOVE ${Math.abs(rearVertShim)} mm`}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Horizontal Misalignment */}
              <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-3">
                <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Horizontal Plane (Move Corrections)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-mono">Horizontal Offset (mm)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={horizOffset}
                      onChange={(e) => setHorizOffset(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-mono">Horizontal Gap (mm)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={horizGap}
                      onChange={(e) => setHorizGap(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white font-mono"
                    />
                  </div>
                </div>

                <div className="bg-cyan-950/30 border border-cyan-500/30 rounded p-3 space-y-2 mt-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Front Feet Move:</span>
                    <strong className="text-cyan-300 font-bold">
                      {frontHorizMove >= 0 ? `MOVE RIGHT ${frontHorizMove} mm` : `MOVE LEFT ${Math.abs(frontHorizMove)} mm`}
                    </strong>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Rear Feet Move:</span>
                    <strong className="text-cyan-300 font-bold">
                      {rearHorizMove >= 0 ? `MOVE RIGHT ${rearHorizMove} mm` : `MOVE LEFT ${Math.abs(rearHorizMove)} mm`}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
