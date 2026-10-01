import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Grid } from '@react-three/drei';
import { X, Play, Pause, Layers } from 'lucide-react';
import * as THREE from 'three';

interface HolographicWaterfallProps {
  isOpen: boolean;
  onClose: () => void;
  fftSpectrum: { freq: number; amp: number }[];
  kinematicMarkers: { [key: string]: number };
  rpm: number;
  activeFault: string;
}

// 3D Waterfall Mesh Component
function WaterfallMesh({
  history,
  colorTheme,
  verticalScale,
  wireframe,
}: {
  history: number[][];
  colorTheme: 'turbo' | 'plasma' | 'matrix' | 'cyan';
  verticalScale: number;
  wireframe: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const numTimeSlices = history.length;
  const numFreqBins = history[0]?.length || 64;

  // Geometry dimensions
  const width = 12; // X axis (Frequency)
  const depth = 14; // Z axis (Time History)

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      width,
      depth,
      Math.max(1, numFreqBins - 1),
      Math.max(1, numTimeSlices - 1)
    );
    geo.rotateX(-Math.PI / 2); // Lay flat on XZ plane

    const count = geo.attributes.position.count;
    const colorArray = new Float32Array(count * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    return geo;
  }, [width, depth, numFreqBins, numTimeSlices]);

  useFrame(() => {
    if (!meshRef.current || history.length === 0) return;

    const pos = meshRef.current.geometry.attributes.position;
    const cols = meshRef.current.geometry.attributes.color;

    // Update heights and vertex colors based on spectral amplitude
    let idx = 0;
    for (let t = 0; t < numTimeSlices; t++) {
      const slice = history[t] || [];
      const zNorm = t / (numTimeSlices - 1 || 1); // 0 (now) to 1 (past)

      for (let f = 0; f < numFreqBins; f++) {
        const amp = slice[f] || 0;
        const elev = Math.min(4.5, amp * verticalScale);

        // Update Y position (index * 3 + 1 is Y)
        pos.setY(idx, elev);

        // Color gradient calculation
        const normElev = Math.min(1.0, elev / 3.0);
        let r = 0, g = 0, b = 0;

        if (colorTheme === 'turbo') {
          // Blue -> Cyan -> Green -> Yellow -> Red
          r = Math.sin(normElev * Math.PI - Math.PI / 4) * 0.5 + 0.5;
          g = Math.sin(normElev * Math.PI) * 0.8;
          b = Math.cos(normElev * Math.PI * 0.8) * 0.9;
        } else if (colorTheme === 'plasma') {
          // Purple -> Red -> Orange -> Yellow
          r = 0.3 + normElev * 0.7;
          g = Math.pow(normElev, 2) * 0.8;
          b = Math.sin(normElev * Math.PI) * 0.6 + (1 - normElev) * 0.4;
        } else if (colorTheme === 'matrix') {
          // Dark green to blinding neon emerald
          r = normElev * 0.4;
          g = 0.2 + normElev * 0.8;
          b = normElev * 0.3;
        } else {
          // Cyan Cyberpunk: Deep navy -> Electric cyan -> White hot
          r = Math.pow(normElev, 3);
          g = 0.4 + normElev * 0.6;
          b = 0.7 + normElev * 0.3;
        }

        // Fade out slightly towards distant past
        const fade = 1.0 - zNorm * 0.35;
        cols.setXYZ(idx, r * fade, g * fade, b * fade);
        idx++;
      }
    }

    pos.needsUpdate = true;
    cols.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        roughness={0.25}
        metalness={0.8}
        wireframe={wireframe}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Marker 3D ribbons for Kinematic Frequencies (1X, 2X, BPFO, BPFI)
function KinematicRibbon({
  freq,
  label,
  color,
  maxFreq = 1000,
}: {
  freq: number;
  label: string;
  color: string;
  maxFreq?: number;
}) {
  const normX = (freq / maxFreq) * 12 - 6; // map to geometry width (-6 to +6)

  if (freq > maxFreq || freq < 0) return null;

  return (
    <group position={[normX, 0, 0]}>
      {/* Vertical Laser Plane / Line */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[0.04, 3, 14]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>
      {/* Top 3D Tag */}
      <group position={[0, 3.2, -6.5]}>
        <Text
          fontSize={0.35}
          color={color}
          anchorX="center"
          anchorY="middle"
        >
          {`${label}\n${freq.toFixed(1)}Hz`}
        </Text>
      </group>
    </group>
  );
}

export function HolographicWaterfall({
  isOpen,
  onClose,
  fftSpectrum,
  kinematicMarkers,
  rpm,
  activeFault,
}: HolographicWaterfallProps) {
  const [history, setHistory] = useState<number[][]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [colorTheme, setColorTheme] = useState<'turbo' | 'plasma' | 'matrix' | 'cyan'>('turbo');
  const [verticalScale, setVerticalScale] = useState(2.8);
  const [wireframe, setWireframe] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const maxHistorySlices = 40;

  // Buffer incoming FFT into rolling history
  useEffect(() => {
    if (isPaused || !fftSpectrum || fftSpectrum.length === 0) return;

    // Resample to 64 uniform frequency points
    const numBins = 64;
    const step = Math.max(1, Math.floor(fftSpectrum.length / numBins));
    const currentSlice: number[] = [];

    for (let i = 0; i < numBins; i++) {
      const idx = Math.min(fftSpectrum.length - 1, i * step);
      currentSlice.push(fftSpectrum[idx]?.amp || 0);
    }

    setHistory((prev) => {
      const next = [currentSlice, ...prev];
      if (next.length > maxHistorySlices) {
        next.pop();
      }
      return next;
    });
  }, [fftSpectrum, isPaused]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 md:p-8 animate-in fade-in duration-200">
      <div className="w-full max-w-7xl h-[92vh] bg-slate-950/95 border border-cyan-500/40 rounded-2xl flex flex-col overflow-hidden shadow-2xl shadow-cyan-950/60 font-sans">
        
        {/* Top Control Bar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  HOLOGRAPHIC 3D STFT WATERFALL
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                    REAL-TIME SPECTRAL TERRAIN
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Continuous Time-Frequency-Elevation Topography • RPM: <span className="text-emerald-400 font-bold">{rpm}</span> • Mode: <span className="text-cyan-400 font-bold">{activeFault}</span>
              </p>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Color Theme Selector */}
            <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-500 font-mono px-2">PALETTE</span>
              {(['turbo', 'plasma', 'cyan', 'matrix'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => setColorTheme(theme)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono uppercase transition-all ${
                    colorTheme === theme
                      ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>

            {/* Height Scale */}
            <div className="flex items-center bg-slate-900 rounded-lg px-3 py-1 border border-slate-800 text-xs gap-2">
              <span className="text-[10px] text-slate-500 font-mono">ELEVATION</span>
              <input
                type="range"
                min="0.5"
                max="6"
                step="0.2"
                value={verticalScale}
                onChange={(e) => setVerticalScale(parseFloat(e.target.value))}
                className="w-16 accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-cyan-300 w-6">{verticalScale.toFixed(1)}x</span>
            </div>

            {/* Wireframe toggle */}
            <button
              onClick={() => setWireframe((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                wireframe
                  ? 'bg-purple-950/60 border-purple-500/60 text-purple-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Wireframe
            </button>

            {/* Markers toggle */}
            <button
              onClick={() => setShowMarkers((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                showMarkers
                  ? 'bg-amber-950/60 border-amber-500/60 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Kinematic Rays
            </button>

            {/* Pause / Play */}
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all ${
                isPaused
                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                  : 'bg-amber-950/60 border-amber-500/60 text-amber-300'
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

        {/* 3D WebGL Canvas */}
        <div className="flex-1 relative bg-gradient-to-b from-[#060814] via-[#030409] to-[#020204]">
          <Canvas
            camera={{ position: [0, 9, 13], fov: 48 }}
            gl={{ antialias: true, alpha: false }}
          >
            <color attach="background" args={['#03050c']} />
            <ambientLight intensity={0.65} />
            <directionalLight position={[10, 20, 10]} intensity={1.2} />
            <pointLight position={[0, 5, 0]} intensity={1.5} color="#00ffff" distance={25} />

            {/* 3D Grid on floor */}
            <Grid
              position={[0, -0.05, 0]}
              args={[16, 18]}
              cellSize={1}
              cellThickness={0.7}
              cellColor="#1e293b"
              sectionSize={4}
              sectionThickness={1.2}
              sectionColor="#0ea5e9"
              fadeDistance={25}
            />

            {/* Waterfall Spectral Mesh */}
            {history.length > 0 && (
              <WaterfallMesh
                history={history}
                colorTheme={colorTheme}
                verticalScale={verticalScale}
                wireframe={wireframe}
              />
            )}

            {/* Theoretical Kinematic Markers */}
            {showMarkers && (
              <>
                <KinematicRibbon freq={kinematicMarkers['1X'] || (rpm / 60)} label="1X Rotor" color="#38bdf8" />
                <KinematicRibbon freq={kinematicMarkers['2X'] || (rpm / 30)} label="2X Align" color="#a855f7" />
                <KinematicRibbon freq={kinematicMarkers['BPFO'] || (3.58 * rpm / 60)} label="BPFO" color="#ef4444" />
                <KinematicRibbon freq={kinematicMarkers['BPFI'] || (5.41 * rpm / 60)} label="BPFI" color="#f97316" />
                <KinematicRibbon freq={kinematicMarkers['BSF'] || (2.35 * rpm / 60)} label="BSF" color="#eab308" />
              </>
            )}

            {/* Axis Labels in 3D */}
            <group position={[-6.2, 0.2, 7.2]}>
              <Text fontSize={0.35} color="#64748b" anchorX="left">
                0 Hz (DC)
              </Text>
            </group>
            <group position={[5.2, 0.2, 7.2]}>
              <Text fontSize={0.35} color="#64748b" anchorX="right">
                1000 Hz
              </Text>
            </group>
            <group position={[-6.2, 0.2, -6.8]}>
              <Text fontSize={0.32} color="#475569" anchorX="left">
                ← Past History (40 Frames)
              </Text>
            </group>
            <group position={[-6.2, 0.2, 6.2]}>
              <Text fontSize={0.32} color="#06b6d4" anchorX="left">
                ★ Live Frontier (T = 0s)
              </Text>
            </group>

            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              maxPolarAngle={Math.PI / 2.05}
              minDistance={4}
              maxDistance={30}
            />
          </Canvas>

          {/* Bottom HUD Legend */}
          <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-center justify-between pointer-events-none gap-2">
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-4 text-xs font-mono pointer-events-auto">
              <span className="text-slate-400">AXES:</span>
              <span className="text-cyan-400 font-semibold">X: Frequency [0-1000 Hz]</span>
              <span className="text-emerald-400 font-semibold">Y: Amplitude [g RMS]</span>
              <span className="text-purple-400 font-semibold">Z: Time Buffer [T-0 to T-40]</span>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-3 text-xs font-mono pointer-events-auto">
              <span className="text-slate-400">ACTIVE DEFECT:</span>
              <span className={`px-2 py-0.5 rounded font-bold ${
                activeFault === 'HEALTHY'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-red-950 text-red-400 border border-red-800 animate-pulse'
              }`}>
                {activeFault}
              </span>
              <span className="text-slate-500 text-[10px]">Rotate: Left Click • Pan: Right Click • Zoom: Scroll</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default HolographicWaterfall;
