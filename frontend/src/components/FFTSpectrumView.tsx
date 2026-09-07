import React, { useRef, useEffect } from 'react';
import { Radio } from 'lucide-react';

interface FFTSpectrumViewProps {
  fftSpectrum: { freq: number; amp: number }[];
  kinematicMarkers: { [key: string]: number };
  activeFault: string;
}

export const FFTSpectrumView: React.FC<FFTSpectrumViewProps> = ({
  fftSpectrum,
  kinematicMarkers,
  activeFault,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const maxFreq = 1000.0; // 0 to 1000 Hz
    const maxAmp = 2.5;     // Max amplitude scale

    // Background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, width, height);

    // Subtle Frequency Grid
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    for (let f = 100; f <= maxFreq; f += 100) {
      const x = (f / maxFreq) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height - 20);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${f}Hz`, x, height - 6);
    }

    // Horizontal amplitude lines
    for (let a = 0.5; a <= maxAmp; a += 0.5) {
      const y = (1.0 - a / maxAmp) * (height - 24);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw Kinematic Marker Overlays
    const markerColors: { [key: string]: string } = {
      '1X': '#10b981',   // Emerald
      '2X': '#06b6d4',   // Cyan
      'BPFO': '#ef4444', // Red (Outer Race)
      'BPFI': '#f59e0b', // Amber (Inner Race)
      'BSF': '#a855f7',  // Purple (Ball Spin)
    };

    if (kinematicMarkers) {
      Object.entries(kinematicMarkers).forEach(([label, freq]) => {
        if (freq > 0 && freq <= maxFreq && markerColors[label]) {
          const x = (freq / maxFreq) * width;
          const color = markerColors[label];
          const isTargetFault =
            (label === 'BPFO' && activeFault === 'BPFO') ||
            (label === 'BPFI' && activeFault === 'BPFI') ||
            (label === '1X' && activeFault === 'UNBALANCE') ||
            (label === '2X' && activeFault === 'MISALIGNMENT');

          // Vertical line
          ctx.strokeStyle = color;
          ctx.lineWidth = isTargetFault ? 2 : 1;
          ctx.setLineDash(isTargetFault ? [] : [4, 4]);
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height - 22);
          ctx.stroke();
          ctx.setLineDash([]);

          // Marker Flag Badge
          ctx.fillStyle = isTargetFault ? color : 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          const badgeWidth = 46;
          const badgeHeight = 16;
          const badgeX = Math.max(2, Math.min(width - badgeWidth - 2, x - badgeWidth / 2));
          const badgeY = 6;

          ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
          ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);

          ctx.fillStyle = isTargetFault ? '#ffffff' : color;
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${label}`, badgeX + badgeWidth / 2, badgeY + 11);
        }
      });
    }

    // Draw Real FFT Spectrum Line & Glow
    if (fftSpectrum && fftSpectrum.length > 1) {
      // Create Gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
      gradient.addColorStop(0.6, 'rgba(16, 185, 129, 0.2)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

      ctx.beginPath();
      ctx.moveTo(0, height - 22);

      fftSpectrum.forEach((pt, i) => {
        const x = (pt.freq / maxFreq) * width;
        const normalizedAmp = Math.min(maxAmp, pt.amp);
        const y = (1.0 - normalizedAmp / maxAmp) * (height - 24);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      // Close path for area fill
      const lastPt = fftSpectrum[fftSpectrum.length - 1];
      const lastX = (lastPt.freq / maxFreq) * width;
      ctx.lineTo(lastX, height - 22);
      ctx.lineTo(0, height - 22);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Stroke glowing line
      ctx.beginPath();
      fftSpectrum.forEach((pt, i) => {
        const x = (pt.freq / maxFreq) * width;
        const normalizedAmp = Math.min(maxAmp, pt.amp);
        const y = (1.0 - normalizedAmp / maxAmp) * (height - 24);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.strokeStyle = activeFault !== 'HEALTHY' ? '#06b6d4' : '#10b981';
      ctx.lineWidth = 2;
      ctx.shadowColor = activeFault !== 'HEALTHY' ? '#06b6d4' : '#10b981';
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset
    }
  }, [fftSpectrum, kinematicMarkers, activeFault]);

  return (
    <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-3 relative overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-300">
            Real-Time FFT Spectrum + Kinematic Harmonics
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> 1X/2X
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400"></span> BPFO Outer
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> BPFI Inner
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span> BSF Ball
          </span>
          <span className="text-slate-500">BW: 0-1000 Hz</span>
        </div>
      </div>

      <div className="w-full relative h-[140px] rounded-lg overflow-hidden border border-slate-800/80">
        <canvas
          ref={canvasRef}
          width={820}
          height={140}
          className="w-full h-full block"
        />
      </div>
    </div>
  );
};
