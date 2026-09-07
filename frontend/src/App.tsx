import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Activity, AlertTriangle, Zap, Server, Terminal, Box, Gauge, Cpu, Globe2, FlaskConical } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TurbineModel } from './components/TurbineModel';
import { VoiceCommander } from './components/VoiceCommander';
import { ReportGenerator } from './components/ReportGenerator';
import { EcoPanel } from './components/EcoPanel';
import { CortexChat } from './components/CortexChat';
import { WorkOrderModal } from './components/WorkOrderModal';
import { MonitorView } from './views/MonitorView';
import { GlobalView } from './views/GlobalView';
import { GenerativeLab } from './views/GenerativeLab';
import { calculateImpact, type ImpactMetrics } from './utils/metrics';
import './App.css';

type ViewMode = 'MONITOR' | 'GLOBAL' | 'GEN_LAB';

interface DiagnosisData {
  code: string;
  fault: string;
  error?: string;
  confidence: number;
  action: string;
  severity: string;
  component: string;
  detected_harmonic?: string;
  root_cause?: string;
}

function App() {
  // --- Core Telemetry State ---
  const [waveData, setWaveData] = useState<{ idx: number; val: number }[]>([]);
  const [fftSpectrum, setFftSpectrum] = useState<{ freq: number; amp: number }[]>([]);
  const [kinematicMarkers, setKinematicMarkers] = useState<{ [key: string]: number }>({
    '1X': 50.0,
    '2X': 100.0,
    'BPFO': 179.2,
    'BPFI': 270.8,
    'BSF': 117.8
  });
  const [ndtMetrics, setNdtMetrics] = useState({
    rms: 0.28,
    kurtosis: 2.8,
    crest_factor: 2.1,
    pk_pk: 1.0,
    skewness: 0.0
  });
  const [isoZone, setIsoZone] = useState({
    zone: 'A',
    label: 'GOOD',
    description: 'Optimal newly commissioned machinery',
    color: '#10b981',
    urgency: 'NORMAL'
  });
  const [prognostics, setPrognostics] = useState({
    health_index: 0.98,
    health_percent: 98.0,
    rul_hours: 8500.0,
    degradation_rate_pct_hr: 0.01,
    projection_status: 'STABLE',
    urgency: 'OPTIMAL'
  });
  const [activeFault, setActiveFault] = useState<string>('HEALTHY');
  const [isWorkOrderOpen, setIsWorkOrderOpen] = useState(false);

  const [isCritical, setIsCritical] = useState(false);
  const [currentMetric, setCurrentMetric] = useState({ amp: 0, score: 0 });
  const [rpm, setRpm] = useState(3000);
  const [isHealing, setIsHealing] = useState(false);
  const [vibrationFactor, setVibrationFactor] = useState(0);
  const [currentView, setCurrentView] = useState<ViewMode>('MONITOR');
  const [totalFinancialLoss, setTotalFinancialLoss] = useState(0);
  const [impactMetrics, setImpactMetrics] = useState<ImpactMetrics>({
    powerKW: 50,
    carbonKg: 20,
    euroLossPerSecond: 0,
    efficiency: 95
  });
  const ws = useRef<WebSocket | null>(null);

  // --- Diagnostic Terminal State ---
  const [diagnosisText, setDiagnosisText] = useState<string>(">> INDUSTRIAL CONDITION MONITORING ONLINE\n>> ISO 10816-3 ENGINE READY\n>> ALL HARMONICS NOMINAL");
  const [isScanning, setIsScanning] = useState(false);
  const hasScannedRef = useRef(false);

  // --- Typewriter Effect ---
  const typeText = useCallback((text: string, delay: number = 20) => {
    let i = 0;
    setDiagnosisText("");
    const interval = setInterval(() => {
      if (i < text.length) {
        setDiagnosisText(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, delay);
    return () => clearInterval(interval);
  }, []);

  // --- Append Log ---
  const appendLog = useCallback((message: string) => {
    setDiagnosisText(prev => prev + '\n' + message);
  }, []);

  // --- Calculate Impact Metrics ---
  useEffect(() => {
    const status = isCritical ? 'CRITICAL FAILURE' : 'OPTIMAL';
    const metrics = calculateImpact(status, rpm);
    setImpactMetrics(metrics);
  }, [isCritical, rpm]);

  // --- Financial Loss Ticker ---
  useEffect(() => {
    if (!isCritical) return;

    const interval = setInterval(() => {
      setTotalFinancialLoss(prev => prev + 1.4); // €14/s = €1.4 per 100ms
    }, 100);

    return () => clearInterval(interval);
  }, [isCritical]);

  // --- View-based Diagnostic Updates ---
  useEffect(() => {
    if (currentView === 'GLOBAL') {
      setDiagnosisText(">> GLOBAL FLEET VIEW\n>> FEDERATED MODEL: ACTIVE\n>> NODES ONLINE: 3\n>> LATENCY: 12ms");
    } else if (currentView === 'GEN_LAB') {
      setDiagnosisText(">> DARWIN PROTOCOL\n>> TOPOLOGY ENGINE: STANDBY\n>> AWAITING STRESS INPUT...");
    } else {
      hasScannedRef.current = false;
    }
  }, [currentView]);

  // --- API & WebSocket Dynamic Configuration ---
  const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const WS_BASE = import.meta.env.VITE_WS_URL || (API_BASE.replace(/^http/, 'ws') + '/ws/live');

  // --- Diagnostic Trigger for Monitor View ---
  useEffect(() => {
    if (currentView !== 'MONITOR') return;

    if (isCritical && !hasScannedRef.current) {
      hasScannedRef.current = true;
      setIsScanning(true);
      setDiagnosisText(">> ANOMALY DETECTED ON ACOUSTIC SENSOR BUS\n>> INITIATING FFT KINEMATIC MATCHING...");

      setTimeout(async () => {
        try {
          const response = await fetch(`${API_BASE}/api/diagnose`);
          const data = await response.json();
          if (data.status === "FAULT_DETECTED" && data.diagnosis) {
            const d: DiagnosisData = data.diagnosis;
            const iso = data.iso_zone;
            typeText(
              `>> CODE: ${d.code}\n>> FAULT: ${d.fault.toUpperCase()}\n>> COMPONENT: ${d.component}\n>> HARMONIC: ${d.detected_harmonic || 'N/A'}\n>> ISO ZONE: ${iso?.zone} (${iso?.label})\n>> ROOT CAUSE: ${d.root_cause || 'Fatigue'}\n>> ACTION: ${d.action}`,
              15
            );
            return;
          }
        } catch {
          // Client-side fallback diagnosis for Vercel demo
          const faultMap: { [key: string]: any } = {
            BPFO: {
              code: "FAULT-BPFO",
              fault: "Bearing Outer Race Micro-Spall",
              component: "SKF 6205 Deep Groove Ball Bearing",
              harmonic: "BPFO @ 179.2 Hz (Impact Shock)",
              action: "Immediate bearing replacement required; inspect outer race seating."
            },
            BPFI: {
              code: "FAULT-BPFI",
              fault: "Bearing Inner Race Flaking",
              component: "SKF 6205 Drive-End Bearing",
              harmonic: "BPFI @ 270.8 Hz with 1X Sidebands",
              action: "Replace bearing assembly; inspect shaft interference fit."
            },
            UNBALANCE: {
              code: "FAULT-1X",
              fault: "Rotor Dynamic Mass Unbalance",
              component: "Drive Motor Rotor Assembly",
              harmonic: "1X Fundamental Harmonic @ 50.0 Hz",
              action: "Perform single-plane dynamic field balancing."
            },
            MISALIGNMENT: {
              code: "FAULT-2X",
              fault: "Shaft Coupling Misalignment",
              component: "Flexible Jaw Coupling Assembly",
              harmonic: "2X Rotational Harmonic @ 100.0 Hz",
              action: "Perform precision dual-laser shaft alignment."
            },
            CAVITATION: {
              code: "FAULT-CAV",
              fault: "Fluid Cavitation & Turbulence",
              component: "Pump Impeller & Housing",
              harmonic: "High-Frequency Acoustic Emission (>2.5 kHz)",
              action: "Check suction pressure and inspect inlet strainers."
            }
          };
          const f = faultMap[activeFault] || faultMap.BPFO;
          typeText(
            `>> CODE: ${f.code}\n>> FAULT: ${f.fault.toUpperCase()}\n>> COMPONENT: ${f.component}\n>> HARMONIC: ${f.harmonic}\n>> ISO ZONE: C (UNSATISFACTORY)\n>> ROOT CAUSE: Sub-surface fatigue under cyclic load\n>> ACTION: ${f.action}`,
            15
          );
        } finally {
          setIsScanning(false);
        }
      }, 800);
    } else if (!isCritical && !isHealing) {
      hasScannedRef.current = false;
      setDiagnosisText(
        `>> STATUS: NOMINAL (ISO ZONE A)\n>> RPM: ${rpm} (1X = ${(rpm/60).toFixed(1)} Hz)\n>> ACOUSTIC KURTOSIS: ${ndtMetrics.kurtosis.toFixed(2)} (GAUSSIAN)\n>> ALL BEARINGS OPTIMAL`
      );
      setIsScanning(false);
    }
  }, [isCritical, isHealing, typeText, currentView, rpm, ndtMetrics.kurtosis, activeFault, API_BASE]);

  // --- Auto-heal Updates ---
  useEffect(() => {
    if (isHealing) {
      setDiagnosisText(">> VFD HARMONIC AVOIDANCE ACTIVE\n>> DAMPING CRITICAL RESONANCE...\n>> RESTORING ISO ZONE A BASELINE...");
    }
  }, [isHealing]);

  // --- WebSocket Connection with Automatic Edge Simulation Fallback ---
  useEffect(() => {
    let socket: WebSocket | null = null;
    let fallbackInterval: any = null;
    let isConnected = false;

    // Client-side simulation loop (activated if WebSocket fails or backend offline)
    const runClientSimulation = () => {
      if (fallbackInterval) return;
      let phase = 0;

      fallbackInterval = setInterval(() => {
        phase += 0.2;
        const fr = rpm / 60.0;
        const isFault = activeFault !== 'HEALTHY';
        
        // Generate simulated waveform
        const points = 128;
        const wave = [];
        for (let i = 0; i < points; i++) {
          const t = i / points;
          let val = 0.4 * Math.sin(2 * Math.PI * (fr / 25) * t + phase) + (Math.random() - 0.5) * 0.1;
          if (activeFault === 'BPFO') {
            if (i % 16 === 0) val += (Math.random() > 0.3 ? 1.8 : -1.8) * (vibrationFactor || 0.65);
          } else if (activeFault === 'BPFI') {
            if (i % 12 === 0) val += (Math.random() > 0.4 ? 1.6 : -1.6) * (vibrationFactor || 0.65);
          } else if (activeFault === 'UNBALANCE') {
            val += 1.5 * Math.sin(2 * Math.PI * (fr / 25) * t + phase) * (vibrationFactor || 0.65);
          } else if (activeFault === 'MISALIGNMENT') {
            val += 1.2 * Math.sin(4 * Math.PI * (fr / 25) * t + phase) * (vibrationFactor || 0.65);
          } else if (activeFault === 'CAVITATION') {
            val += (Math.random() - 0.5) * 1.5 * (vibrationFactor || 0.65);
          }
          wave.push({ idx: i, val });
        }
        setWaveData(wave);

        // Generate simulated FFT spectrum (0-1000 Hz)
        const bins = 128;
        const spec = [];
        const bpfo = fr * 3.585;
        const bpfi = fr * 5.415;
        const bsf = fr * 2.356;

        for (let b = 0; b < bins; b++) {
          const freq = (b / bins) * 1000;
          let amp = 0.02 + Math.random() * 0.03;
          // 1X & 2X harmonics
          if (Math.abs(freq - fr) < 8) amp += 0.35;
          if (Math.abs(freq - 2 * fr) < 8) amp += 0.12;

          // Fault harmonic spikes
          if (activeFault === 'BPFO' && Math.abs(freq - bpfo) < 12) amp += 1.6;
          if (activeFault === 'BPFI' && Math.abs(freq - bpfi) < 12) amp += 1.4;
          if (activeFault === 'UNBALANCE' && Math.abs(freq - fr) < 10) amp += 1.8;
          if (activeFault === 'MISALIGNMENT' && Math.abs(freq - 2 * fr) < 10) amp += 1.5;
          if (activeFault === 'CAVITATION' && freq > 400 && freq < 900) amp += 0.5 + Math.random() * 0.4;

          spec.push({ freq: Math.round(freq), amp });
        }
        setFftSpectrum(spec);

        // Kinematic defect targets
        setKinematicMarkers({
          '1X': Math.round(fr * 10) / 10,
          '2X': Math.round(2 * fr * 10) / 10,
          'BPFO': Math.round(bpfo * 10) / 10,
          'BPFI': Math.round(bpfi * 10) / 10,
          'BSF': Math.round(bsf * 10) / 10
        });

        // NDT indicators
        const rmsVal = isFault ? 0.98 : 0.28;
        const kurtVal = activeFault === 'BPFO' || activeFault === 'BPFI' ? 4.25 : isFault ? 3.4 : 1.65;
        setNdtMetrics({
          rms: rmsVal,
          kurtosis: kurtVal,
          crest_factor: isFault ? 3.75 : 1.85,
          pk_pk: isFault ? 5.2 : 1.0,
          skewness: isFault ? 0.12 : 0.01
        });

        // ISO Zone
        setIsoZone({
          zone: isFault ? 'C' : 'A',
          label: isFault ? 'UNSATISFACTORY' : 'GOOD',
          description: isFault ? 'Restricted continuous operation; maintenance required' : 'Newly commissioned machinery in optimal condition',
          color: isFault ? '#f59e0b' : '#10b981',
          urgency: isFault ? 'ACTION_REQUIRED' : 'NORMAL'
        });

        // Prognostics
        setPrognostics({
          health_index: isFault ? 0.45 : 0.98,
          health_percent: isFault ? 45.0 : 98.0,
          rul_hours: isFault ? 16.5 : 8500.0,
          degradation_rate_pct_hr: isFault ? 4.3 : 0.01,
          projection_status: isFault ? 'RAPID_ACCELERATION' : 'STABLE',
          urgency: isFault ? 'CRITICAL_SHUTDOWN' : 'OPTIMAL'
        });

        setIsCritical(isFault);
        setCurrentMetric({
          amp: isFault ? 1.8 : 0.4,
          score: isFault ? 11.06 : 0.104
        });
      }, 50);
    };

    try {
      socket = new WebSocket(WS_BASE);
      ws.current = socket;

      socket.onopen = () => {
        isConnected = true;
        if (fallbackInterval) {
          clearInterval(fallbackInterval);
          fallbackInterval = null;
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const waveform = data.waveform || [];
          const amplitude = waveform.length > 0 ? Math.max(...waveform.map((v: number) => Math.abs(v))) : 0;

          if (waveform.length > 0) {
            setWaveData(waveform.map((val: number, i: number) => ({ idx: i, val })));
          }

          if (data.fft_spectrum) setFftSpectrum(data.fft_spectrum);
          if (data.kinematic_markers) setKinematicMarkers(data.kinematic_markers);
          if (data.ndt_metrics) setNdtMetrics(data.ndt_metrics);
          if (data.iso_zone) setIsoZone(data.iso_zone);
          if (data.prognostics) setPrognostics(data.prognostics);
          if (data.fault_mode) setActiveFault(data.fault_mode);

          setIsCritical(data.status === "CRITICAL FAILURE");
          setCurrentMetric({ amp: amplitude, score: data.anomaly_score });
          setRpm(data.rpm);
          setIsHealing(data.is_healing);
          setVibrationFactor(data.vibration_factor);
        } catch (err) {
          console.error("WebSocket error:", err);
        }
      };

      socket.onerror = () => {
        if (!isConnected) runClientSimulation();
      };

      socket.onclose = () => {
        runClientSimulation();
      };
    } catch {
      runClientSimulation();
    }

    // Safety timeout: if no message in 1.8 seconds, activate simulation
    const timeout = setTimeout(() => {
      if (!isConnected) runClientSimulation();
    }, 1800);

    return () => {
      clearTimeout(timeout);
      if (fallbackInterval) clearInterval(fallbackInterval);
      socket?.close();
    };
  }, [WS_BASE, rpm, activeFault, vibrationFactor]);

  // --- Control Handlers ---
  const injectFailure = async () => {
    try {
      await fetch(`${API_BASE}/api/toggle-break`, { method: 'POST' });
    } catch {
      // Local toggle if offline
      handleSelectFault(activeFault === 'HEALTHY' ? 'BPFO' : 'HEALTHY');
    }
  };

  const handleSelectFault = async (fault: string) => {
    setActiveFault(fault);
    hasScannedRef.current = false;
    setVibrationFactor(fault === 'HEALTHY' ? 0.0 : 0.65);
    try {
      await fetch(`${API_BASE}/api/set-fault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fault })
      });
    } catch {
      // Handled locally by fallback
    }
  };

  const handleRpmChange = async (newRpm: number) => {
    setRpm(newRpm);
    try {
      await fetch(`${API_BASE}/api/set-rpm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rpm: newRpm })
      });
    } catch {
      // Handled locally by fallback
    }
  };

  const triggerAutoHeal = async () => {
    setIsHealing(true);
    try {
      await fetch(`${API_BASE}/api/auto-heal`, { method: 'POST' });
    } catch {
      // Local auto-heal animation
      let step = 0;
      const interval = setInterval(() => {
        step++;
        setRpm(prev => (prev < 3000 ? Math.min(3000, prev + 50) : Math.max(3000, prev - 50)));
        setVibrationFactor(prev => Math.max(0, prev - 0.05));
        if (step >= 15) {
          clearInterval(interval);
          setActiveFault('HEALTHY');
          setIsHealing(false);
          setIsCritical(false);
          setVibrationFactor(0);
          setRpm(3000);
        }
      }, 200);
    }
  };

  // --- RPM Styling ---
  const isOptimalRpm = rpm >= 2900 && rpm <= 3100;
  const rpmColor = isOptimalRpm ? 'text-emerald-400' : rpm < 2000 || rpm > 4000 ? 'text-red-400' : 'text-orange-400';

  // --- Navigation Items ---
  const navItems = [
    { id: 'MONITOR' as ViewMode, icon: Activity, label: 'Monitor', color: 'emerald' },
    { id: 'GLOBAL' as ViewMode, icon: Globe2, label: 'Global', color: 'cyan' },
    { id: 'GEN_LAB' as ViewMode, icon: FlaskConical, label: 'Lab', color: 'orange' },
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 font-sans flex">

      {/* === SIDEBAR === */}
      <aside className="w-20 bg-slate-900/50 border-r border-slate-800 flex flex-col items-center py-4 gap-2">
        {/* Logo */}
        <div className="p-3 mb-4">
          <Server className="w-8 h-8 text-emerald-500" />
        </div>

        {/* Navigation */}
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${currentView === item.id
              ? `bg-${item.color}-500/20 border border-${item.color}-500/50 text-${item.color}-400 shadow-lg shadow-${item.color}-500/20`
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase">{item.label}</span>
          </button>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Inject Failure Button */}
        <button
          onClick={injectFailure}
          className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${isCritical
            ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400'
            : 'bg-red-900/30 border-red-500/50 text-red-400 hover:bg-red-900/50'
            }`}
        >
          <Zap className="w-5 h-5" />
          <span className="text-[7px] font-bold uppercase">{isCritical ? 'RESTORE' : 'BPFO FAULT'}</span>
        </button>
      </aside>

      {/* === MAIN CONTENT === */}
      <div className="flex-1 flex flex-col">

        {/* Header */}
        <header className="flex justify-between items-center px-6 py-3 border-b border-slate-800 bg-slate-900/30">
          <div>
            <h1 className="text-xl font-bold text-emerald-500 tracking-wider flex items-center gap-2">
              NEUROSPEC IIoT
              <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                ENTERPRISE EDITION
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest">
              {currentView === 'MONITOR' && 'ACOUSTIC EMISSION & KINEMATIC SPECTRUM CORE'}
              {currentView === 'GLOBAL' && 'GLOBAL FLEET COMMAND'}
              {currentView === 'GEN_LAB' && 'GENERATIVE HARDWARE LAB'}
            </p>
          </div>

          {/* Bankruptcy Ticker - Financial Loss */}
          <div className={`flex flex-col items-center transition-all ${totalFinancialLoss > 0 ? 'animate-pulse' : ''}`}>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Total Financial Impact</div>
            <div className={`px-4 py-1 rounded font-mono text-xl font-bold tracking-wider transition-all ${isCritical && totalFinancialLoss > 0
              ? 'bg-red-600 text-white shadow-lg shadow-red-500/50'
              : 'text-slate-400'
              }`}>
              €{totalFinancialLoss.toFixed(2)}
            </div>
          </div>

          {/* Report Generator */}
          <ReportGenerator
            isCritical={isCritical}
            currentMetric={currentMetric}
            rpm={rpm}
          />

          {/* Status Badge - Clickable */}
          <button
            onClick={injectFailure}
            className={`px-4 py-2 rounded-full font-bold text-sm tracking-widest flex items-center gap-2 border transition-all cursor-pointer hover:scale-105 active:scale-95 ${isCritical
              ? 'bg-red-900/80 text-red-200 border-red-700 animate-pulse hover:bg-red-900'
              : 'bg-emerald-900/50 text-emerald-200 border-emerald-800 hover:bg-emerald-900/70'
              }`}
          >
            {isCritical ? <AlertTriangle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            {isCritical ? 'CRITICAL FAULT' : 'ISO ZONE A (OPTIMAL)'}
          </button>
        </header>

        {/* Content Grid */}
        <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-auto">

          {/* Left Panel: Digital Twin & Controls */}
          <div className="lg:col-span-3 space-y-4">
            {/* Digital Twin */}
            <div className={`bg-slate-900/50 rounded-xl border p-3 ${isCritical ? 'border-red-500/50' : 'border-slate-800'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Box className="w-4 h-4 text-cyan-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Digital Twin (SKF 6205)</span>
              </div>
              <div className="w-full h-32 bg-black rounded-lg overflow-hidden border border-slate-800">
                <Canvas camera={{ position: [3, 2, 4], fov: 45 }}>
                  <ambientLight intensity={0.4} />
                  <pointLight position={[5, 5, 5]} intensity={1} />
                  <Suspense fallback={null}>
                    <TurbineModel isCritical={isCritical} />
                  </Suspense>
                  <OrbitControls enableZoom={false} autoRotate={!isCritical} autoRotateSpeed={1} />
                </Canvas>
              </div>
            </div>

            {/* RPM Control */}
            <div className={`bg-slate-900/50 rounded-xl border p-3 ${isOptimalRpm ? 'border-emerald-500/30' : 'border-orange-500/30'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-4 h-4 text-cyan-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">VFD Drive Speed</span>
              </div>
              <div className="text-center mb-2">
                <div className={`text-3xl font-mono font-bold ${rpmColor}`}>{rpm}</div>
                <div className="text-[10px] font-mono text-slate-500">
                  Fundamental 1X: {(rpm / 60.0).toFixed(1)} Hz
                </div>
              </div>
              <input
                type="range" min="0" max="6000" value={rpm}
                onChange={(e) => handleRpmChange(parseInt(e.target.value))}
                disabled={isHealing}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-50"
              />
              <div className="mt-2 flex justify-between text-[9px] text-slate-500">
                <span>Vibration Factor: {(vibrationFactor * 100).toFixed(0)}%</span>
                <span className={vibrationFactor > 0.2 ? 'text-red-400' : 'text-emerald-400'}>
                  {vibrationFactor > 0.2 ? 'SEVERE' : 'OPTIMAL'}
                </span>
              </div>
            </div>

            {/* Auto-Heal Button */}
            <button
              onClick={triggerAutoHeal}
              disabled={isHealing || !isCritical}
              className={`w-full p-3 rounded-xl border-2 font-bold text-xs tracking-widest transition-all ${isHealing
                ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-400 animate-pulse'
                : isCritical
                  ? 'bg-cyan-900/20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-900/40'
                  : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                }`}
            >
              <Cpu className="w-4 h-4 inline mr-2" />
              {isHealing ? 'AVOIDING RESONANCE...' : 'ENGAGE AUTO-HEAL'}
            </button>

            {/* EcoPanel - Sustainability Metrics */}
            <EcoPanel metrics={impactMetrics} isCritical={isCritical} />
          </div>

          {/* Center: Active View */}
          <div className="lg:col-span-6">
            {currentView === 'MONITOR' && (
              <MonitorView
                waveData={waveData}
                fftSpectrum={fftSpectrum}
                kinematicMarkers={kinematicMarkers}
                ndtMetrics={ndtMetrics}
                isoZone={isoZone}
                prognostics={prognostics}
                isCritical={isCritical}
                currentMetric={currentMetric}
                rpm={rpm}
                activeFault={activeFault}
                isHealing={isHealing}
                onSelectFault={handleSelectFault}
                onAutoHeal={triggerAutoHeal}
                onOpenWorkOrder={() => setIsWorkOrderOpen(true)}
              />
            )}
            {currentView === 'GLOBAL' && (
              <GlobalView isCritical={isCritical} />
            )}
            {currentView === 'GEN_LAB' && (
              <GenerativeLab isCritical={isCritical} onLog={appendLog} />
            )}
          </div>

          {/* Right: Diagnostic Terminal */}
          <div className="lg:col-span-3">
            <div className={`bg-slate-900/80 p-3 rounded-xl border h-full ${isCritical ? 'border-orange-500/50' :
              currentView === 'GLOBAL' ? 'border-cyan-500/50' :
                currentView === 'GEN_LAB' ? 'border-orange-500/50' : 'border-slate-800'
              }`}>
              <div className="flex items-center gap-2 mb-2">
                <Terminal className={`w-4 h-4 ${isCritical ? 'text-orange-500' :
                  currentView === 'GLOBAL' ? 'text-cyan-500' :
                    currentView === 'GEN_LAB' ? 'text-orange-500' : 'text-slate-500'
                  }`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Kinematic Diagnostic Agent
                </span>
                {(isScanning || isHealing) && (
                  <span className="text-[8px] font-mono text-orange-400 animate-pulse ml-auto">MATCHING FFT</span>
                )}
              </div>
              <div className="bg-black rounded-lg p-3 h-80 overflow-y-auto font-mono text-[11px] leading-relaxed border border-slate-800">
                <pre className={`whitespace-pre-wrap ${isCritical || isHealing ? 'text-orange-400' :
                  currentView === 'GLOBAL' ? 'text-cyan-400' :
                    currentView === 'GEN_LAB' ? 'text-orange-400' : 'text-emerald-500'
                  }`}>
                  {diagnosisText}
                  <span className="animate-pulse">_</span>
                </pre>
              </div>
            </div>
          </div>

        </main>
      </div>

      {/* Voice Commander - Global */}
      <VoiceCommander
        onViewChange={setCurrentView}
        onToggleBreak={injectFailure}
        onAutoHeal={triggerAutoHeal}
      />

      {/* Cortex Chat - Cognitive Repair Assistant */}
      <CortexChat isCritical={isCritical} />

      {/* CMMS Maintenance Work Order Modal */}
      <WorkOrderModal
        isOpen={isWorkOrderOpen}
        onClose={() => setIsWorkOrderOpen(false)}
      />
    </div>
  );
}

export default App;