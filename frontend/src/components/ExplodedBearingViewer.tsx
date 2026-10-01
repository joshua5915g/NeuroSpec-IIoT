import { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { X, Play, Pause, Disc, Split, AlertOctagon, CheckCircle2 } from 'lucide-react';
import * as THREE from 'three';

interface ExplodedBearingViewerProps {
  isOpen: boolean;
  onClose: () => void;
  rpm: number;
  activeFault: string;
  isCritical: boolean;
  kinematicMarkers: { [key: string]: number };
}

// 3D Exploded Bearing Assembly
function BearingAssembly({
  rpm,
  activeFault,
  isCritical,
  explodeFactor,
  cutaway,
  isSpinning,
}: {
  rpm: number;
  activeFault: string;
  isCritical: boolean;
  explodeFactor: number;
  cutaway: boolean;
  isSpinning: boolean;
}) {
  const shaftRef = useRef<THREE.Group>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const cageRef = useRef<THREE.Group>(null);
  const ballsGroupRef = useRef<THREE.Group>(null);
  const spallFlashRef = useRef<THREE.Mesh>(null);

  // Bearing Physical Dimensions (SKF 6205 normalized to WebGL units)
  const Dp = 2.4; // Pitch circle diameter
  const d_ball = 0.5; // Ball diameter
  const numBalls = 9; // Number of rolling elements
  const r_pitch = Dp / 2; // 1.2

  // Kinematic speed multipliers relative to fr
  // fr = rpm / 60
  // FTF mult ~ 0.398, BSF mult ~ 2.356, BPFO ~ 3.585
  const fr = rpm / 60;
  const ftf = fr * 0.398;

  // Pre-calculate ball angles
  const ballPositions = useMemo(() => {
    return Array.from({ length: numBalls }).map((_, i) => {
      const angle = (i / numBalls) * Math.PI * 2;
      return {
        angle,
        x: Math.cos(angle) * r_pitch,
        y: Math.sin(angle) * r_pitch,
      };
    });
  }, [numBalls, r_pitch]);

  useFrame((_, delta) => {
    if (!isSpinning) return;

    const dt = delta;
    // Shaft & Inner ring rotate at 1X (shaft speed)
    const shaftDelta = fr * Math.PI * 2 * dt * 0.25; // scaled for pleasing visual rate
    if (shaftRef.current) shaftRef.current.rotation.z += shaftDelta;
    if (innerRingRef.current) innerRingRef.current.rotation.z += shaftDelta;

    // Cage & Balls orbit at FTF
    const cageDelta = ftf * Math.PI * 2 * dt * 0.25;
    if (cageRef.current) cageRef.current.rotation.z += cageDelta;
    if (ballsGroupRef.current) ballsGroupRef.current.rotation.z += cageDelta;

    // Outer race spall impact flash pulse
    if (spallFlashRef.current && (activeFault === 'BPFO' || isCritical)) {
      const pulse = Math.abs(Math.sin(Date.now() * 0.015));
      (spallFlashRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + pulse * 1.6;
    }
  });

  // Axial separation offsets calculated from explodeFactor (0 to 1)
  const zShaft = -2.2 * explodeFactor;
  const zInner = -1.2 * explodeFactor;
  const zCage1 = -0.4 * explodeFactor;
  const zBalls = 0;
  const zCage2 = 0.4 * explodeFactor;
  const zOuter = 1.4 * explodeFactor;

  // Arc length for cutaway (Math.PI * 1.5 for 270 deg section, or Math.PI * 2 for full 360 deg)
  const arcLength = cutaway ? Math.PI * 1.5 : Math.PI * 2;

  return (
    <group rotation={[Math.PI / 6, Math.PI / 4, 0]}>

      {/* 1. Drive Shaft Journal with keyway */}
      <group ref={shaftRef} position={[0, 0, zShaft]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.7, 0.7, 3.2, 32]} />
          <meshStandardMaterial
            color="#475569"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
        {/* Keyway Bar */}
        <mesh position={[0.7, 0, 0]}>
          <boxGeometry args={[0.12, 0.12, 1.8]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>

      {/* 2. Inner Ring with Precision Ground Raceway */}
      <mesh ref={innerRingRef} position={[0, 0, zInner]}>
        <cylinderGeometry args={[0.95, 0.95, 0.9, 48, 1, false, 0, arcLength]} />
        <meshStandardMaterial
          color="#94a3b8"
          metalness={0.95}
          roughness={0.15}
          side={THREE.DoubleSide}
        />
        {/* Inner Ring BPFI Defect lesion if active */}
        {activeFault === 'BPFI' && (
          <mesh position={[0.96, 0, 0]}>
            <boxGeometry args={[0.08, 0.25, 0.35]} />
            <meshStandardMaterial color="#ef4444" emissive="#ff0000" emissiveIntensity={1.2} />
          </mesh>
        )}
      </mesh>

      {/* 3. Retainer / Ball Cage Front Halve */}
      <group ref={cageRef} position={[0, 0, zCage1]}>
        <mesh>
          <ringGeometry args={[0.98, 1.42, 36]} />
          <meshStandardMaterial
            color="#d97706" // Brass / Bronze retainer
            metalness={0.7}
            roughness={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 4. Precision Rolling Elements (9 Balls) */}
      <group ref={ballsGroupRef} position={[0, 0, zBalls]}>
        {ballPositions.map((ball, i) => (
          <mesh key={i} position={[ball.x, ball.y, 0]}>
            <sphereGeometry args={[d_ball / 2, 24, 24]} />
            <meshStandardMaterial
              color="#e2e8f0"
              metalness={0.98}
              roughness={0.08}
            />
          </mesh>
        ))}
      </group>

      {/* 5. Retainer / Ball Cage Rear Halve */}
      <group position={[0, 0, zCage2]}>
        <mesh>
          <ringGeometry args={[0.98, 1.42, 36]} />
          <meshStandardMaterial
            color="#d97706"
            metalness={0.7}
            roughness={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 6. Outer Ring with Outer Raceway */}
      <group position={[0, 0, zOuter]}>
        <mesh>
          <cylinderGeometry args={[1.7, 1.7, 0.95, 48, 1, false, 0, arcLength]} />
          <meshStandardMaterial
            color="#64748b"
            metalness={0.9}
            roughness={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Outer Ring Micro-Spall Pit (BPFO defect) */}
        {(activeFault === 'BPFO' || isCritical) && (
          <mesh ref={spallFlashRef} position={[1.44, 0, 0]}>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshStandardMaterial
              color="#ef4444"
              emissive="#ff0000"
              emissiveIntensity={1.5}
            />
          </mesh>
        )}
      </group>

      {/* Exploded Leader Alignment Lines (when exploded) */}
      {explodeFactor > 0.1 && (
        <group>
          {[-1.2, 1.2].map((x, i) => (
            <mesh key={i} position={[x, 0, (zShaft + zOuter) / 2]}>
              <boxGeometry args={[0.02, 0.02, Math.abs(zOuter - zShaft) + 1]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} />
            </mesh>
          ))}
        </group>
      )}

    </group>
  );
}

export function ExplodedBearingViewer({
  isOpen,
  onClose,
  rpm,
  activeFault,
  isCritical,
  kinematicMarkers,
}: ExplodedBearingViewerProps) {
  const [explodeFactor, setExplodeFactor] = useState(0.45);
  const [cutaway, setCutaway] = useState(true);
  const [isSpinning, setIsSpinning] = useState(true);

  // Theoretical Kinematics
  const bpfo = kinematicMarkers['BPFO'] || (3.585 * rpm / 60);
  const bpfi = kinematicMarkers['BPFI'] || (5.415 * rpm / 60);
  const bsf = kinematicMarkers['BSF'] || (2.356 * rpm / 60);
  const ftf = (rpm / 60) * 0.398;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 md:p-8 animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-7xl h-[92vh] bg-slate-950/95 border border-amber-500/40 rounded-2xl flex flex-col overflow-hidden shadow-2xl shadow-amber-950/60">

        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-400 shadow-lg shadow-amber-500/20">
              <Disc className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  MICRO-KINETIC EXPLODED BEARING RIG
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-amber-300">
                    SKF 6205 DEEP GROOVE BALL BEARING
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                CAD Geometric Decomposition • Dynamic Kinematic Speed Ratios • Real-Time Ball Pass Defect Flashing
              </p>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Explode Slider */}
            <div className="flex items-center bg-slate-900 rounded-lg px-3 py-1.5 border border-slate-800 text-xs gap-2">
              <Split className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] text-slate-500 font-mono uppercase">Explode</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={explodeFactor}
                onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
                className="w-20 accent-amber-400 cursor-pointer"
              />
              <span className="text-[11px] font-mono text-amber-300 w-8">
                {Math.round(explodeFactor * 100)}%
              </span>
            </div>

            {/* Cutaway Toggle */}
            <button
              onClick={() => setCutaway((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                cutaway
                  ? 'bg-amber-950/60 border-amber-500/60 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              270° Cutaway: {cutaway ? 'ON' : 'OFF'}
            </button>

            {/* Spin / Freeze */}
            <button
              onClick={() => setIsSpinning((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all ${
                isSpinning
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  : 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
              }`}
            >
              {isSpinning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isSpinning ? 'Freeze Spin' : 'Resume Spin'}
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

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

          {/* 3D WebGL Canvas */}
          <div className="flex-1 relative bg-gradient-to-b from-[#0c0904] via-[#060402] to-[#020202]">
            <Canvas
              camera={{ position: [0, 3.5, 6.5], fov: 46 }}
              gl={{ antialias: true, alpha: false }}
            >
              <color attach="background" args={['#040302']} />
              <ambientLight intensity={0.9} />
              <directionalLight position={[10, 15, 10]} intensity={1.8} />
              <pointLight position={[-5, 5, 5]} intensity={1.2} color="#fbbf24" distance={20} />

              <BearingAssembly
                rpm={rpm}
                activeFault={activeFault}
                isCritical={isCritical}
                explodeFactor={explodeFactor}
                cutaway={cutaway}
                isSpinning={isSpinning}
              />

              <OrbitControls
                enableDamping
                dampingFactor={0.06}
                minDistance={3}
                maxDistance={16}
              />
            </Canvas>

            {/* In-Canvas Component Identification Badges */}
            <div className="absolute top-6 left-6 flex flex-col gap-2 font-mono text-[11px] pointer-events-none">
              <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-xl flex flex-col gap-1.5">
                <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">ASSEMBLY ANATOMY</span>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  <span>Outer Ring (Cr Steel)</span>
                </div>
                <div className="flex items-center gap-2 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Brass Retainer Cage</span>
                </div>
                <div className="flex items-center gap-2 text-cyan-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <span>9x Precision Steel Balls</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span>Inner Ring & Ground Raceway</span>
                </div>
              </div>
            </div>

            {/* Defect Status Tag */}
            <div className="absolute bottom-4 left-6 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-3 font-mono text-xs shadow-lg">
              <span className="text-slate-400">INSPECTED FAULT:</span>
              <span className={`px-2.5 py-0.5 rounded font-bold ${
                activeFault === 'HEALTHY'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-red-950 text-red-400 border border-red-800 animate-pulse'
              }`}>
                {activeFault}
              </span>
              {activeFault === 'BPFO' && (
                <span className="text-red-400 text-[11px]">→ Flashing micro-spall on outer raceway</span>
              )}
              {activeFault === 'BPFI' && (
                <span className="text-orange-400 text-[11px]">→ Inner raceway flaking surface</span>
              )}
            </div>
          </div>

          {/* Right Sidebar: Kinematic Math & Specs */}
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-5 overflow-y-auto">
            <div>
              <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">Kinematic Defect Equations</span>
              <h3 className="text-base font-bold text-white mt-1">Theoretical Defect Frequencies</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Calculated at live operational speed of {rpm} RPM</p>
            </div>

            {/* Frequency Cards */}
            <div className="space-y-2.5">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-red-400 font-mono">BPFO (Outer Race)</div>
                  <div className="text-[10px] text-slate-500 font-mono">N/2 · fr · (1 - d/Dp·cos α)</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-mono font-bold text-white">{bpfo.toFixed(1)} <span className="text-xs text-slate-500">Hz</span></div>
                  <div className="text-[10px] text-red-400 font-mono">{activeFault === 'BPFO' ? '★ MATCH ACTIVE' : 'NOMINAL'}</div>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-orange-400 font-mono">BPFI (Inner Race)</div>
                  <div className="text-[10px] text-slate-500 font-mono">N/2 · fr · (1 + d/Dp·cos α)</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-mono font-bold text-white">{bpfi.toFixed(1)} <span className="text-xs text-slate-500">Hz</span></div>
                  <div className="text-[10px] text-orange-400 font-mono">{activeFault === 'BPFI' ? '★ MATCH ACTIVE' : 'NOMINAL'}</div>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-yellow-400 font-mono">BSF (Ball Spin)</div>
                  <div className="text-[10px] text-slate-500 font-mono">Dp/(2d) · fr · (1 - (d/Dp·cos α)²)</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-mono font-bold text-white">{bsf.toFixed(1)} <span className="text-xs text-slate-500">Hz</span></div>
                  <div className="text-[10px] text-slate-500 font-mono">Ball Rotation</div>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-cyan-400 font-mono">FTF (Cage Frequency)</div>
                  <div className="text-[10px] text-slate-500 font-mono">1/2 · fr · (1 - d/Dp·cos α)</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-mono font-bold text-white">{ftf.toFixed(1)} <span className="text-xs text-slate-500">Hz</span></div>
                  <div className="text-[10px] text-slate-500 font-mono">Cage Orbit</div>
                </div>
              </div>
            </div>

            {/* Geometric Constants Sheet */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Bearing Constants (SKF 6205)</span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500">Pitch Dia (Dp):</span>
                  <div className="text-slate-200 font-bold">39.04 mm</div>
                </div>
                <div>
                  <span className="text-slate-500">Ball Dia (d):</span>
                  <div className="text-slate-200 font-bold">7.94 mm</div>
                </div>
                <div>
                  <span className="text-slate-500">Ball Count (N):</span>
                  <div className="text-slate-200 font-bold">9 elements</div>
                </div>
                <div>
                  <span className="text-slate-500">Contact Angle (α):</span>
                  <div className="text-slate-200 font-bold">0.0° (Radial)</div>
                </div>
              </div>
            </div>

            {/* Maintenance Guidance */}
            <div className={`p-4 rounded-xl border flex flex-col gap-2 font-mono text-xs ${
              isCritical
                ? 'bg-red-950/30 border-red-500/50 text-red-200'
                : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {isCritical ? <AlertOctagon className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {isCritical ? 'REPAIR PROTOCOL LOADED' : 'CLEARANCE OPTIMAL'}
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                {isCritical
                  ? 'Bearing raceway micro-spall detected. Do not attempt in-situ grinding. Order SKF 6205-2RSH replacement kit with polyurea synthetic grease.'
                  : 'Bearing clearances, cage orbital velocity, and ball roundness within OEM ISO Class 6 tolerances.'}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default ExplodedBearingViewer;
