import { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { X, Play, Pause, Compass, AlertTriangle, ShieldCheck, Zap, Sliders } from 'lucide-react';
import * as THREE from 'three';

interface ODSMagnifierProps {
  isOpen: boolean;
  onClose: () => void;
  rpm: number;
  activeFault: string;
  isCritical: boolean;
  vibrationFactor: number;
}

// 3D Machine Train with Mathematical Modal Deflection Shapes
function ODSMachineTrain({
  rpm,
  activeMode,
  magnification,
  playbackSpeed,
  isPaused,
  showVectors,
}: {
  rpm: number;
  activeMode: 'UNBALANCE' | 'MISALIGNMENT' | 'SOFT_FOOT' | 'CAVITATION';
  magnification: number;
  playbackSpeed: number;
  isPaused: boolean;
  showVectors: boolean;
}) {
  const motorGroupRef = useRef<THREE.Group>(null);
  const pumpGroupRef = useRef<THREE.Group>(null);
  const couplingRef = useRef<THREE.Group>(null);
  const shaftMotorRef = useRef<THREE.Mesh>(null);
  const shaftPumpRef = useRef<THREE.Mesh>(null);
  const baseplateRef = useRef<THREE.Mesh>(null);

  const timeRef = useRef(0);

  // Nominal rotational frequency
  const f_rot = rpm / 60; // e.g. 50 Hz @ 3000 RPM

  useFrame((_, delta) => {
    if (isPaused) return;

    timeRef.current += delta * playbackSpeed;
    const t = timeRef.current;

    // Phase cycle for 1X (shaft speed) and 2X (harmonic)
    const omega1X = f_rot * Math.PI * 2 * 0.4; // Scaled for visual inspection
    const phase1X = t * omega1X;
    const phase2X = t * omega1X * 2.0;

    // Amplitude scale based on magnification factor (e.g. 10x to 100x)
    // Physical displacement is ~ 10-60 micrometers (0.01 - 0.06 mm)
    const baseAmp = 0.008 * magnification;

    if (motorGroupRef.current && pumpGroupRef.current && couplingRef.current) {
      if (activeMode === 'UNBALANCE') {
        // 1X Mode: Radial eccentric orbit of the motor rotor
        const dx = Math.cos(phase1X) * baseAmp;
        const dy = Math.sin(phase1X) * baseAmp;
        motorGroupRef.current.position.set(dx, dy, 0);
        motorGroupRef.current.rotation.z = Math.sin(phase1X) * 0.04 * (magnification / 40);

        // Coupling absorbs the eccentricity
        couplingRef.current.position.set(dx * 0.5, dy * 0.5, 0);
        couplingRef.current.rotation.y = Math.sin(phase1X) * 0.05 * (magnification / 40);
        pumpGroupRef.current.position.set(0, 0, 0);

      } else if (activeMode === 'MISALIGNMENT') {
        // 2X Mode: Angular yaw and axial pinch across jaw coupling
        const pinch = Math.sin(phase2X) * baseAmp * 0.8;
        const yaw = Math.cos(phase2X) * 0.08 * (magnification / 35);

        motorGroupRef.current.position.set(0, pinch * 0.5, 0);
        motorGroupRef.current.rotation.y = yaw;

        pumpGroupRef.current.position.set(0, -pinch * 0.5, 0);
        pumpGroupRef.current.rotation.y = -yaw;

        couplingRef.current.scale.set(1 + pinch * 0.5, 1, 1 - pinch * 0.5);

      } else if (activeMode === 'SOFT_FOOT') {
        // Baseplate structural looseness: Truncated rocking deflection
        const rock = Math.max(0, Math.sin(phase1X)) * baseAmp * 1.4;
        motorGroupRef.current.position.set(0, rock, 0);
        motorGroupRef.current.rotation.z = rock * 0.6;
        pumpGroupRef.current.position.set(0, 0, 0);

      } else if (activeMode === 'CAVITATION') {
        // High-frequency random micro-shock turbulence
        const randX = (Math.random() - 0.5) * baseAmp * 0.6;
        const randY = (Math.random() - 0.5) * baseAmp * 0.6;
        pumpGroupRef.current.position.set(randX, randY, 0);
        motorGroupRef.current.position.set(randX * 0.2, randY * 0.2, 0);
      }
    }

    // Shaft continuous spin
    if (shaftMotorRef.current) shaftMotorRef.current.rotation.x += delta * f_rot * 0.5;
    if (shaftPumpRef.current) shaftPumpRef.current.rotation.x += delta * f_rot * 0.5;
  });

  return (
    <group position={[0, -0.2, 0]} rotation={[Math.PI / 10, -Math.PI / 5, 0]}>

      {/* Heavy Steel Baseplate / Machine Bed */}
      <mesh ref={baseplateRef} position={[0, -1.2, 0]}>
        <boxGeometry args={[7.2, 0.35, 2.6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Foundation Mounting Anchor Bolts */}
      {[
        [-3.2, -1.0, 1.0], [3.2, -1.0, 1.0],
        [-3.2, -1.0, -1.0], [3.2, -1.0, -1.0],
        [-0.8, -1.0, 1.0], [0.8, -1.0, 1.0]
      ].map((pos, idx) => (
        <mesh key={idx} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* === MOTOR ASSEMBLY (LEFT TRAIN) === */}
      <group ref={motorGroupRef} position={[-1.8, 0, 0]}>
        {/* Motor Stator Body */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.95, 0.95, 2.2, 32]} />
          <meshStandardMaterial
            color={activeMode === 'UNBALANCE' ? '#0284c7' : '#334155'}
            metalness={0.75}
            roughness={0.25}
          />
        </mesh>

        {/* Cooling Fins */}
        {[-0.6, -0.3, 0, 0.3, 0.6].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[1.05, 1.05, 0.05, 32]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.5} />
          </mesh>
        ))}

        {/* Motor Shaft */}
        <mesh ref={shaftMotorRef} position={[1.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 1.0, 24]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>

        {/* Motor Pedestal Feet */}
        <mesh position={[0, -0.75, 0]}>
          <boxGeometry args={[1.8, 0.5, 1.4]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
        </mesh>

        {/* ODS Vector Arrow: Motor DE */}
        {showVectors && (
          <group position={[1.0, 1.2, 0]}>
            <mesh>
              <coneGeometry args={[0.12, 0.35, 16]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
            <mesh position={[0, -0.3, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.4, 16]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
          </group>
        )}
      </group>

      {/* === FLEXIBLE JAW COUPLING (CENTER) === */}
      <group ref={couplingRef} position={[0, 0, 0]}>
        {/* Left Hub */}
        <mesh position={[-0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.42, 0.42, 0.35, 24]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Elastomer Spider (Red Ring) */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.43, 0.43, 0.12, 24]} />
          <meshStandardMaterial
            color={activeMode === 'MISALIGNMENT' ? '#ef4444' : '#e11d48'}
            emissive={activeMode === 'MISALIGNMENT' ? '#b91c1c' : '#000000'}
            emissiveIntensity={0.6}
            roughness={0.4}
          />
        </mesh>
        {/* Right Hub */}
        <mesh position={[0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.42, 0.42, 0.35, 24]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* === CENTRIFUGAL PUMP ASSEMBLY (RIGHT TRAIN) === */}
      <group ref={pumpGroupRef} position={[1.8, 0, 0]}>
        {/* Pump Shaft */}
        <mesh ref={shaftPumpRef} position={[-0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.8, 24]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>

        {/* Pump Volute Casing (Spiral Torus) */}
        <mesh position={[0.5, 0, 0]}>
          <torusGeometry args={[0.9, 0.45, 24, 36]} />
          <meshStandardMaterial
            color={activeMode === 'CAVITATION' ? '#0ea5e9' : '#047857'}
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>

        {/* Pump Discharge Flange */}
        <mesh position={[0.5, 1.2, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.8, 24]} />
          <meshStandardMaterial color="#065f46" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Pump Pedestal Foot */}
        <mesh position={[0.5, -0.75, 0]}>
          <boxGeometry args={[1.4, 0.5, 1.2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
        </mesh>

        {/* ODS Vector Arrow: Pump Suction */}
        {showVectors && (
          <group position={[0.5, 1.7, 0]}>
            <mesh>
              <coneGeometry args={[0.12, 0.35, 16]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
            <mesh position={[0, -0.3, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.4, 16]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          </group>
        )}
      </group>

    </group>
  );
}

export function ODSMagnifier({
  isOpen,
  onClose,
  rpm,
  activeFault,
  isCritical,
  vibrationFactor,
}: ODSMagnifierProps) {
  // Map incoming active fault to ODS mode
  const initialMode = activeFault === 'MISALIGNMENT'
    ? 'MISALIGNMENT'
    : activeFault === 'CAVITATION'
    ? 'CAVITATION'
    : 'UNBALANCE';

  const [activeMode, setActiveMode] = useState<'UNBALANCE' | 'MISALIGNMENT' | 'SOFT_FOOT' | 'CAVITATION'>(initialMode);
  const [magnification, setMagnification] = useState(45);
  const [playbackSpeed, setPlaybackSpeed] = useState(0.35); // Slow motion default for modal clarity
  const [isPaused, setIsPaused] = useState(false);
  const [showVectors, setShowVectors] = useState(true);

  // Dynamic real vs magnified metrics
  const realDisplacementUm = isCritical ? 48.5 : 8.2;
  const magnifiedDisplacementMm = ((realDisplacementUm * magnification) / 1000).toFixed(2);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 md:p-8 animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-7xl h-[92vh] bg-slate-950/95 border border-emerald-500/40 rounded-2xl flex flex-col overflow-hidden shadow-2xl shadow-emerald-950/60">

        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  OPERATING DEFLECTION SHAPE (ODS) MAGNIFIER
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                    EULERIAN MOTION AMPLIFICATION
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Modal Deflection Simulation • Phase-Synchronous Motion Amplification • Speed: <span className="text-emerald-400 font-bold">{rpm} RPM</span> • Vib: <span className="text-amber-400 font-bold">{vibrationFactor.toFixed(2)}g</span>
              </p>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Mode Selector */}
            <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
              {(['UNBALANCE', 'MISALIGNMENT', 'SOFT_FOOT', 'CAVITATION'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setActiveMode(mode)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono uppercase transition-all ${
                    activeMode === mode
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Magnification Slider */}
            <div className="flex items-center bg-slate-900 rounded-lg px-3 py-1.5 border border-slate-800 text-xs gap-2">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-slate-500 font-mono uppercase">Scale</span>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={magnification}
                onChange={(e) => setMagnification(parseInt(e.target.value))}
                className="w-20 accent-emerald-400 cursor-pointer"
              />
              <span className="text-[11px] font-mono text-emerald-300 w-10">{magnification}x</span>
            </div>

            {/* Strobe Playback Speed */}
            <div className="flex items-center bg-slate-900 rounded-lg px-3 py-1.5 border border-slate-800 text-xs gap-2">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Strobe</span>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="bg-transparent text-emerald-300 font-mono text-xs cursor-pointer focus:outline-none"
              >
                <option value={0.1}>10% (Ultra-Slow)</option>
                <option value={0.35}>35% (Modal ODS)</option>
                <option value={0.75}>75% (Fast Strobe)</option>
                <option value={1.0}>100% (Real-Time)</option>
              </select>
            </div>

            {/* Vector toggle */}
            <button
              onClick={() => setShowVectors((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                showVectors
                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Laser Vectors
            </button>

            {/* Pause / Resume */}
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all ${
                isPaused
                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {isPaused ? 'Resume' : 'Freeze'}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

          {/* 3D WebGL Canvas */}
          <div className="flex-1 relative bg-gradient-to-b from-[#030a08] via-[#020504] to-[#010202]">
            <Canvas
              camera={{ position: [0, 4.5, 7.5], fov: 45 }}
              gl={{ antialias: true, alpha: false }}
            >
              <color attach="background" args={['#020604']} />
              <ambientLight intensity={0.8} />
              <directionalLight position={[10, 15, 10]} intensity={1.5} />
              <pointLight position={[0, 4, 0]} intensity={1.5} color="#10b981" distance={20} />

              <Grid
                position={[0, -1.4, 0]}
                args={[16, 16]}
                cellSize={1}
                cellThickness={0.6}
                cellColor="#1e293b"
                sectionSize={4}
                sectionThickness={1.2}
                sectionColor="#10b981"
                fadeDistance={25}
              />

              <ODSMachineTrain
                rpm={rpm}
                activeMode={activeMode}
                magnification={magnification}
                playbackSpeed={playbackSpeed}
                isPaused={isPaused}
                showVectors={showVectors}
              />

              <OrbitControls
                enableDamping
                dampingFactor={0.06}
                minDistance={3}
                maxDistance={18}
              />
            </Canvas>

            {/* In-Canvas Magnification Scale Badge */}
            <div className="absolute top-6 left-6 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-3 flex flex-col gap-1.5 font-mono text-[11px] shadow-xl pointer-events-none">
              <span className="text-slate-500 uppercase text-[9px] font-bold tracking-wider">MOTION AMPLIFICATION</span>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Physical Deflection:</span>
                <span className="text-emerald-400 font-bold">{realDisplacementUm} µm pk-pk</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Amplified Visual:</span>
                <span className="text-cyan-300 font-bold">~{magnifiedDisplacementMm} mm ({magnification}x)</span>
              </div>
            </div>

            {/* Modal Shape Explanation Tag */}
            <div className="absolute bottom-4 left-6 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-3 font-mono text-xs shadow-lg">
              <span className="text-slate-400">MODAL DIAGNOSIS:</span>
              <span className="text-emerald-400 font-bold">
                {activeMode === 'UNBALANCE' && '1X Synchronous Rotor Whirl (Center-Of-Mass Eccentricity)'}
                {activeMode === 'MISALIGNMENT' && '2X Axial/Angular Jaw Coupling Pinch (Opposing Moments)'}
                {activeMode === 'SOFT_FOOT' && '1X Truncated Foundation Rocking (Loose Anchor Bolt)'}
                {activeMode === 'CAVITATION' && 'Broadband Acoustic Turbulence (Impeller Micro-Implosions)'}
              </span>
            </div>
          </div>

          {/* Right Sidebar: Modal Telemetry & Vibration Diagnostics */}
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-5 overflow-y-auto">
            <div>
              <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">Operating Modal Analysis</span>
              <h3 className="text-base font-bold text-white mt-1">Deflection Shape Vectors</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Machine Train: 45kW Induction Motor + Jaw Coupling + Feed Pump</p>
            </div>

            {/* Key Vibration Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 font-mono">1X ROTOR HARMONIC</span>
                <div className="text-lg font-mono font-bold text-cyan-400 mt-1">
                  {(rpm / 60).toFixed(1)} <span className="text-xs text-slate-500 font-normal">Hz</span>
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-1">Fundamental Speed</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 font-mono">2X COUPLING HARMONIC</span>
                <div className="text-lg font-mono font-bold text-purple-400 mt-1">
                  {(rpm / 30).toFixed(1)} <span className="text-xs text-slate-500 font-normal">Hz</span>
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-1">Misalignment Peak</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 font-mono">PHASE ANGLE (Δθ)</span>
                <div className="text-lg font-mono font-bold text-amber-400 mt-1">
                  {activeMode === 'MISALIGNMENT' ? '178.4°' : '24.1°'}
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-1">{activeMode === 'MISALIGNMENT' ? '180° Out of Phase' : 'In-Phase Whirl'}</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 font-mono">VIBRATION SEVERITY</span>
                <div className={`text-lg font-mono font-bold mt-1 ${isCritical ? 'text-red-400' : 'text-emerald-400'}`}>
                  {isCritical ? 'Zone C/D' : 'Zone A'}
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-1">ISO 10816-3</div>
              </div>
            </div>

            {/* Mechanical Correction Action Box */}
            <div className={`p-4 rounded-xl border flex flex-col gap-2 font-mono text-xs ${
              isCritical
                ? 'bg-red-950/30 border-red-500/50 text-red-200'
                : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {isCritical ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                {isCritical ? 'CORRECTION PROTOCOL REQUIRED' : 'ALIGNMENT OPTIMAL'}
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                {activeMode === 'UNBALANCE' && 'Add single-plane correction balance mass (14.2 g @ 218°) to motor drive-end fan disk.'}
                {activeMode === 'MISALIGNMENT' && 'Perform dual-laser alignment: Shim non-drive motor feet by +0.35 mm to cancel angular offset.'}
                {activeMode === 'SOFT_FOOT' && 'Loosen anchor bolt #3; clean baseplate rust and re-torque to 180 Nm with feeler gauge verification.'}
                {activeMode === 'CAVITATION' && 'Throttle pump discharge valve to restore Net Positive Suction Head (NPSH) margin above 3.2m.'}
              </p>
            </div>

            {/* Quick Balance Launch Action */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-2 font-mono text-xs">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Integrated Field Solution
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Connect directly with the KineticBalancer module to calculate trial weight vectors and verify ISO 1940 balancing grades (G2.5).
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default ODSMagnifier;
