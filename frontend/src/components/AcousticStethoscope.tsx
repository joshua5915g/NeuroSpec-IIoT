import React, { useState, useEffect, useRef } from 'react';
import { Headphones, Volume2, VolumeX, Radio, Activity, Filter } from 'lucide-react';

interface AcousticStethoscopeProps {
  rpm: number;
  activeFault: string;
  isCritical: boolean;
  kinematics: { [key: string]: number };
}

export const AcousticStethoscope: React.FC<AcousticStethoscopeProps> = ({
  rpm,
  activeFault,
  isCritical,
  kinematics,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.5);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [heterodyneMode, setHeterodyneMode] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);
  const impactIntervalRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize Audio Context and synthesis graph
  const startAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(isMuted ? 0 : volume * 0.4, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // Filter (Low-pass or Band-pass for Heterodyne mode)
      const filter = ctx.createBiquadFilter();
      filter.type = heterodyneMode ? 'bandpass' : 'lowpass';
      filter.frequency.setValueAtTime(heterodyneMode ? 2400 : 1200, ctx.currentTime);
      filter.Q.setValueAtTime(heterodyneMode ? 5.0 : 1.0, ctx.currentTime);
      filter.connect(masterGain);
      filterNodeRef.current = filter;

      // Analyser for visualizer
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      filter.connect(analyser);
      analyserRef.current = analyser;

      // 1. Motor hum (1X fundamental)
      const fr = Math.max(10, rpm / 60.0);
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(fr, ctx.currentTime);
      const osc1Gain = ctx.createGain();
      osc1Gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc1.connect(osc1Gain);
      osc1Gain.connect(filter);
      osc1.start();
      osc1Ref.current = osc1;

      // 2. Harmonic overtone (2X / 3X)
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(fr * 2.0, ctx.currentTime);
      const osc2Gain = ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc2.connect(osc2Gain);
      osc2Gain.connect(filter);
      osc2.start();
      osc2Ref.current = osc2;

      // 3. Pink/White Noise Generator for bearing friction and cavitation
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.0555179;
        b1 = 0.96300 * b1 + white * 0.0750759;
        b2 = 0.57000 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.15;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(activeFault === 'CAVITATION' ? 0.35 : 0.03, ctx.currentTime);
      whiteNoise.connect(noiseGain);
      noiseGain.connect(filter);
      whiteNoise.start();
      noiseNodeRef.current = whiteNoise;

      setIsPlaying(true);
    } catch (e) {
      console.error('Audio init failed:', e);
    }
  };

  const stopAudio = () => {
    if (impactIntervalRef.current) {
      clearInterval(impactIntervalRef.current);
      impactIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  // Adjust volume & mute
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      const targetGain = isMuted ? 0 : volume * 0.4;
      masterGainRef.current.gain.setTargetAtTime(targetGain, audioCtxRef.current.currentTime, 0.05);
    }
  }, [volume, isMuted]);

  // Adjust filter mode (heterodyne vs standard listening)
  useEffect(() => {
    if (filterNodeRef.current && audioCtxRef.current) {
      const filter = filterNodeRef.current;
      const now = audioCtxRef.current.currentTime;
      if (heterodyneMode) {
        filter.type = 'bandpass';
        filter.frequency.setTargetAtTime(2200, now, 0.05);
        filter.Q.setTargetAtTime(6.0, now, 0.05);
      } else {
        filter.type = 'lowpass';
        filter.frequency.setTargetAtTime(activeFault === 'CAVITATION' ? 3500 : 1200, now, 0.05);
        filter.Q.setTargetAtTime(1.0, now, 0.05);
      }
    }
  }, [heterodyneMode, activeFault]);

  // Update sound synthesis when RPM or Fault mode changes
  useEffect(() => {
    if (!isPlaying || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const fr = Math.max(10, rpm / 60.0);

    if (osc1Ref.current) {
      osc1Ref.current.frequency.setTargetAtTime(fr, ctx.currentTime, 0.05);
    }
    if (osc2Ref.current) {
      const mult = activeFault === 'MISALIGNMENT' ? 2.0 : activeFault === 'UNBALANCE' ? 1.0 : 2.0;
      osc2Ref.current.frequency.setTargetAtTime(fr * mult, ctx.currentTime, 0.05);
    }

    // Clear any previous impact generator
    if (impactIntervalRef.current) {
      clearInterval(impactIntervalRef.current);
      impactIntervalRef.current = null;
    }

    // High frequency shock pulse generator for BPFO / BPFI bearing faults
    if (activeFault === 'BPFO' || activeFault === 'BPFI') {
      const defectFreq = kinematics[activeFault] || (activeFault === 'BPFO' ? fr * 3.58 : fr * 5.41);
      const intervalMs = Math.max(8, Math.min(200, 1000.0 / defectFreq));

      impactIntervalRef.current = setInterval(() => {
        if (!audioCtxRef.current || audioCtxRef.current.state !== 'running') return;
        try {
          const osc = audioCtxRef.current.createOscillator();
          const gain = audioCtxRef.current.createGain();
          const now = audioCtxRef.current.currentTime;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(activeFault === 'BPFO' ? 1850 : 2400, now);
          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

          osc.connect(gain);
          if (filterNodeRef.current) {
            gain.connect(filterNodeRef.current);
          }
          osc.start(now);
          osc.stop(now + 0.015);
        } catch {}
      }, intervalMs);
    }

    return () => {
      if (impactIntervalRef.current) {
        clearInterval(impactIntervalRef.current);
        impactIntervalRef.current = null;
      }
    };
  }, [rpm, activeFault, isPlaying, kinematics]);

  // Visualizer loop for live audio mini-oscilloscope
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (!isPlaying || !analyserRef.current) {
        // Flatline idle
        ctx.beginPath();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteTimeDomainData(dataArray);

      ctx.beginPath();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = isCritical ? '#f87171' : heterodyneMode ? '#c084fc' : '#34d399';

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isCritical, heterodyneMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-3 shadow-lg">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Headphones className={`w-4 h-4 ${isPlaying ? (isCritical ? 'text-red-400 animate-bounce' : 'text-emerald-400 animate-pulse') : 'text-slate-400'}`} />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCritical ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isCritical ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
              </span>
            )}
          </div>
          <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-200 flex items-center gap-1.5">
            Acoustic Stethoscope
            <span className="text-[9px] font-normal px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 border border-slate-700">
              WebAudio Synthesizer
            </span>
          </h3>
        </div>

        {/* Listen Toggle */}
        <button
          onClick={togglePlayback}
          className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            isPlaying
              ? 'bg-red-500/20 text-red-300 border border-red-500/50 hover:bg-red-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30 shadow-md shadow-emerald-950'
          }`}
        >
          <Radio className={`w-3 h-3 ${isPlaying ? 'animate-pulse text-red-400' : 'text-emerald-400'}`} />
          {isPlaying ? 'MUTE STETHOSCOPE' : 'LISTEN TO ASSET'}
        </button>
      </div>

      {/* Mini Visualizer Canvas & Sound Status */}
      <div className="mt-2 flex items-center gap-3">
        <div className="w-28 h-8 bg-black/60 rounded border border-slate-800 overflow-hidden flex-shrink-0">
          <canvas ref={canvasRef} width={112} height={32} className="w-full h-full block" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono text-slate-400 truncate flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <span className="font-semibold text-slate-200">
              {activeFault === 'HEALTHY'
                ? 'Nominal 1X Mechanical Hum'
                : activeFault === 'BPFO'
                ? 'BPFO Outer Raceway Shock Pulses'
                : activeFault === 'BPFI'
                ? 'BPFI Inner Raceway Modulated Whine'
                : activeFault === 'UNBALANCE'
                ? '1X Mass Eccentricity Heavy Thump'
                : activeFault === 'MISALIGNMENT'
                ? '2X Jaw Coupling Harmonic Buzz'
                : 'Broadband Cavitation Vapor Hiss'}
            </span>
          </div>
          <div className="text-[9px] font-mono text-slate-500">
            {heterodyneMode ? 'HET Heterodyne Demodulation Active (2.2 kHz Bandpass)' : 'Direct Acoustic Transducer Feed'}
          </div>
        </div>
      </div>

      {/* Controls: Volume, Heterodyne, Ultrasonic Mode */}
      <div className="mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setIsMuted(false);
              setVolume(parseFloat(e.target.value));
            }}
            className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <span className="text-slate-400 font-mono w-8">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
        </div>

        <button
          onClick={() => setHeterodyneMode(!heterodyneMode)}
          className={`px-2 py-0.5 rounded text-[9px] font-mono flex items-center gap-1 border transition-all ${
            heterodyneMode
              ? 'bg-purple-950/80 border-purple-500/60 text-purple-300'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title="Isolates high-frequency micro-impacts using ultrasonic bandpass demodulation"
        >
          <Filter className="w-3 h-3 text-purple-400" />
          {heterodyneMode ? 'HET FILTER: ON' : 'HET FILTER: OFF'}
        </button>
      </div>
    </div>
  );
};
