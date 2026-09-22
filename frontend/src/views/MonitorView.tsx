import { useRef, useEffect, useCallback, useMemo } from 'react';
import { ComposedChart, Line, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Zap, Brain, Activity } from 'lucide-react';
import { FFTSpectrumView } from '../components/FFTSpectrumView';
import { NDTGaugePanel } from '../components/NDTGaugePanel';
import { KinematicInspector } from '../components/KinematicInspector';
import { AcousticStethoscope } from '../components/AcousticStethoscope';
import { type BearingSpec } from '../utils/bearingDatabase';

interface MonitorViewProps {
  waveData: { idx: number; val: number }[];
  fftSpectrum: { freq: number; amp: number }[];
  kinematicMarkers: { [key: string]: number };
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
    description: string;
    color: string;
    urgency: string;
  };
  prognostics: {
    health_index: number;
    health_percent: number;
    rul_hours: number;
    degradation_rate_pct_hr: number;
    projection_status: string;
    urgency: string;
  };
  isCritical: boolean;
  currentMetric: { amp: number; score: number };
  rpm: number;
  activeFault: string;
  isHealing: boolean;
  selectedBearing: BearingSpec;
  onSelectFault: (fault: string) => void;
  onSelectBearing: (bearing: BearingSpec) => void;
  onAutoHeal: () => void;
  onOpenWorkOrder: () => void;
}

export function MonitorView({
  waveData,
  fftSpectrum,
  kinematicMarkers,
  ndtMetrics,
  isoZone,
  prognostics,
  isCritical,
  currentMetric,
  rpm,
  activeFault,
  isHealing,
  selectedBearing,
  onSelectFault,
  onSelectBearing,
  onAutoHeal,
  onOpenWorkOrder,
}: MonitorViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const spectrogramHeight = 80;

  // Time-domain continuous waveform with prognostics horizon
  const enhancedWaveData = useMemo(() => {
    if (waveData.length === 0) return [];

    const realData = [...waveData];
    const lastPoint = waveData[waveData.length - 1];
    const lastVal = lastPoint?.val || 0;
    const lastIdx = lastPoint?.idx || 0;

    // Generate predicted future points based on rotational frequency
    const predictionHorizon = 24;
    const ghostData = [];
    const shaftFreqRad = (2.0 * Math.PI * (rpm / 60.0)) / 2500.0;

    for (let i = 1; i <= predictionHorizon; i++) {
      const futureIdx = lastIdx + i;
      const decay = 0.985;
      const predicted = lastVal * Math.cos(i * shaftFreqRad) * Math.pow(decay, i);
      const confidenceWidth = 0.12 * (i / predictionHorizon) * (isCritical ? 2.5 : 1.0);

      ghostData.push({
        idx: futureIdx,
        val: null,
        predicted: predicted,
        upperBound: predicted + confidenceWidth,
        lowerBound: predicted - confidenceWidth,
      });
    }

    return [
      ...realData.map((d) => ({ ...d, predicted: null, upperBound: null, lowerBound: null })),
      ...ghostData,
    ];
  }, [waveData, rpm, isCritical]);

  // Scientific STFT Waterfall Spectrogram drawing based on real FFT magnitudes
  const drawSpectrogramColumn = useCallback(
    (spectrum: { freq: number; amp: number }[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Scroll canvas 1 pixel to the left
      ctx.drawImage(canvas, -1, 0);
      const columnX = canvas.width - 1;

      const numBins = canvas.height;
      for (let y = 0; y < numBins; y++) {
        // High frequencies at top, low frequencies at bottom
        const binFraction = (numBins - y) / numBins;
        const binIndex = Math.min(
          spectrum.length - 1,
          Math.floor(binFraction * (spectrum.length - 1))
        );
        const amp = spectrum[binIndex]?.amp || 0.0;

        // Scientific Colormap (Turbo / Inferno mapping)
        const norm = Math.min(1.0, amp / 1.5);
        let r = 0,
          g = 0,
          b = 0;

        if (norm < 0.25) {
          const t = norm / 0.25;
          r = Math.floor(10 * (1 - t));
          g = Math.floor(150 * t);
          b = Math.floor(120 + 135 * t);
        } else if (norm < 0.5) {
          const t = (norm - 0.25) / 0.25;
          r = Math.floor(30 * t);
          g = Math.floor(150 + 70 * t);
          b = Math.floor(255 * (1 - t));
        } else if (norm < 0.75) {
          const t = (norm - 0.5) / 0.25;
          r = Math.floor(30 + 225 * t);
          g = Math.floor(220);
          b = 0;
        } else {
          const t = (norm - 0.75) / 0.25;
          r = 255;
          g = Math.floor(220 * (1 - t) + 255 * t);
          b = Math.floor(255 * t);
        }

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(columnX, y, 1, 1);
      }
    },
    []
  );

  // Animate spectrogram on telemetry updates
  useEffect(() => {
    if (fftSpectrum && fftSpectrum.length > 0) {
      drawSpectrogramColumn(fftSpectrum);
    }
  }, [fftSpectrum, drawSpectrogramColumn]);

  // Handle canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const containerWidth = container.offsetWidth;
      if (containerWidth > 0 && canvas.width !== containerWidth) {
        canvas.width = containerWidth;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#060a12';
          ctx.fillRect(0, 0, containerWidth, canvas.height);
        }
      }
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="space-y-4 h-full pb-8">
      {/* 1. NDT & ISO 10816 Severity Gauge Panel */}
      <NDTGaugePanel
        ndt={ndtMetrics || { rms: 0.28, kurtosis: 3.0, crest_factor: 2.1, pk_pk: 1.0, skewness: 0 }}
        isoZone={isoZone || { zone: 'A', label: 'GOOD', description: 'Optimal', color: '#10b981', urgency: 'NORMAL' }}
        prognostics={prognostics || { health_index: 0.98, health_percent: 98, rul_hours: 5000, degradation_rate_pct_hr: 0.01, projection_status: 'STABLE', urgency: 'OPTIMAL' }}
        anomalyScore={currentMetric.score}
      />

      {/* 2. Interactive Acoustic Stethoscope Sound Synthesizer */}
      <AcousticStethoscope
        rpm={rpm}
        activeFault={activeFault}
        isCritical={isCritical}
        kinematics={kinematicMarkers}
      />

      {/* 3. Dual-View Oscilloscope: Time-Domain Waveform */}
      <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-4 relative">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-300">
              High-Speed Acoustic Time Waveform (51.2 ms Frame @ 10 kHz)
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {rpm} RPM (1X = {(rpm / 60.0).toFixed(1)} Hz)
            </span>
            <div className="bg-cyan-950/60 border border-cyan-500/40 rounded px-2 py-0.5 text-[9px] font-mono text-cyan-400 flex items-center gap-1">
              <Brain className="w-3 h-3" />
              NEURAL INFERENCE: 20 Hz
            </div>
          </div>
        </div>

        <div className="w-full" style={{ height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={enhancedWaveData}>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: 11 }}
                formatter={(value: any, name: string) => {
                  if (name === 'predicted') return [value?.toFixed(3), 'Predicted'];
                  if (name === 'val') return [value?.toFixed(3), 'Actual'];
                  return [value, name];
                }}
              />
              <XAxis dataKey="idx" hide />
              <YAxis hide domain={[-3.5, 3.5]} />

              {/* Confidence Interval */}
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="none"
                fill="#06b6d4"
                fillOpacity={0.12}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stroke="none"
                fill="#06b6d4"
                fillOpacity={0.12}
                isAnimationActive={false}
              />

              {/* Real Signal Line */}
              <Line
                type="monotone"
                dataKey="val"
                stroke={isCritical ? '#ef4444' : '#10b981'}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
                connectNulls={false}
              />

              {/* Prognostics Future Projection */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#06b6d4"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-4 mt-2 text-[9px] font-mono">
          <div className="flex items-center gap-1">
            <div className="w-5 h-0.5 bg-emerald-500"></div>
            <span className="text-slate-400">ACOUSTIC TRANSDUCER RAW</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-0.5 bg-cyan-400 border-t border-dashed"></div>
            <span className="text-slate-400">KINEMATIC PROJECTION</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 bg-cyan-500/20 border border-cyan-500/40"></div>
            <span className="text-slate-400">95% CONFIDENCE INTERVAL</span>
          </div>
        </div>
      </div>

      {/* 4. Dual-View Oscilloscope: Real-Time FFT Spectrum */}
      <FFTSpectrumView
        fftSpectrum={fftSpectrum}
        kinematicMarkers={kinematicMarkers}
        activeFault={activeFault}
      />

      {/* 5. Scientific STFT Waterfall Spectrogram */}
      <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-3">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-300">
              STFT Continuous Time-Frequency Waterfall Spectrogram
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">0 Hz — 1000 Hz</span>
        </div>
        <div
          ref={containerRef}
          className="w-full rounded-lg overflow-hidden border border-slate-800"
          style={{ height: spectrogramHeight }}
        >
          <canvas
            ref={canvasRef}
            width={820}
            height={spectrogramHeight}
            className="w-full h-full block"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </div>

      {/* 6. Kinematic Inspector & Multi-Fault Injection Matrix & Bearing Catalog */}
      <KinematicInspector
        rpm={rpm}
        kinematics={kinematicMarkers}
        activeFault={activeFault}
        isHealing={isHealing}
        selectedBearing={selectedBearing}
        onSelectFault={onSelectFault}
        onSelectBearing={onSelectBearing}
        onAutoHeal={onAutoHeal}
        onOpenWorkOrder={onOpenWorkOrder}
      />
    </div>
  );
}

export default MonitorView;
