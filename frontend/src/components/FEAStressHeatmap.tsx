import { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { X, Flame, ShieldAlert, Cpu, AlertTriangle } from 'lucide-react';
import * as THREE from 'three';

interface FEAStressHeatmapProps {
  isOpen: boolean;
  onClose: () => void;
  rpm: number;
  activeFault: string;
  isCritical: boolean;
  vibrationFactor: number;
}

// Custom 3D Mesh with Dynamic Vertex Coloring to emulate FEA Stress Tensor
function FEAMachineHousing({
  colorMap,
  isCritical,
  activeFault,
  pulseIntensity,
  selectedNode,
  onSelectNode,
}: {
  colorMap: 'rainbow' | 'thermal' | 'magma';
  isCritical: boolean;
  activeFault: string;
  pulseIntensity: number;
  selectedNode: number | null;
  onSelectNode: (nodeId: number, data: any) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  // High-poly cylinder with rounded caps representing heavy industrial motor & bearing casing
  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(1.6, 1.6, 5.2, 48, 36, true);
    const count = geo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  // Pre-defined structural inspection nodes
  const inspectionNodes = useMemo(() => [
    { id: 1, name: 'Drive-End Bearing Race (DE)', pos: [-1.65, 1.7, 0], component: 'Outer Raceway' },
    { id: 2, name: 'Motor Shaft Stator Center', pos: [0, 0, 1.65], component: 'Rotor Assembly' },
    { id: 3, name: 'Non-Drive End Bearing (NDE)', pos: [1.65, -1.7, 0], component: 'Retainer Mount' },
    { id: 4, name: 'Jaw Coupling Hub Interface', pos: [-1.4, 2.4, 0.9], component: 'Flexible Coupling' },
    { id: 5, name: 'Foundation Anchor Baseplate', pos: [0, -1.8, -1.5], component: 'Rigid Mount' },
  ], []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    timeRef.current = time;

    const pos = meshRef.current.geometry.attributes.position;
    const cols = meshRef.current.geometry.attributes.color;
    const count = pos.count;

    // Stress excitation parameters based on active fault
    const baseFaultStress = isCritical ? 240.0 : 65.0;
    const faultMultiplier = activeFault === 'BPFO' ? 1.8 : activeFault === 'UNBALANCE' ? 1.4 : activeFault === 'MISALIGNMENT' ? 1.6 : 1.0;
    const dynamicStress = baseFaultStress * faultMultiplier;

    for (let i = 0; i < count; i++) {
      const y = pos.getY(i);
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Local stress concentration equation
      // Concentrated stress at bearing seats (|y| > 1.4)
      const bearingProximity = Math.abs(y) / 2.6;
      const angle = Math.atan2(z, x);

      // Dynamic harmonic wave moving with shaft rotation
      const harmonicPulse = Math.sin(angle * 3 + time * 6) * 0.25 + 0.75;
      const localizedImpact = isCritical && y > 1.2 ? Math.abs(Math.sin(time * 12)) * 0.5 : 0;

      let normalizedVal = (bearingProximity * 0.7 + localizedImpact) * (dynamicStress / 350.0);
      normalizedVal = Math.min(1.0, Math.max(0.05, normalizedVal * (1.0 + pulseIntensity * harmonicPulse)));

      // Map normalized value to Color Schemes
      let r = 0, g = 0, b = 0;

      if (colorMap === 'rainbow') {
        // Classic FEA colormap: Blue -> Cyan -> Green -> Yellow -> Red
        if (normalizedVal < 0.25) {
          const t = normalizedVal / 0.25;
          r = 0; g = t; b = 1;
        } else if (normalizedVal < 0.5) {
          const t = (normalizedVal - 0.25) / 0.25;
          r = 0; g = 1; b = 1 - t;
        } else if (normalizedVal < 0.75) {
          const t = (normalizedVal - 0.5) / 0.25;
          r = t; g = 1; b = 0;
        } else {
          const t = (normalizedVal - 0.75) / 0.25;
          r = 1; g = 1 - t * 0.8; b = 0;
        }
      } else if (colorMap === 'thermal') {
        // Infrared Thermal: Dark purple -> Red -> Bright orange -> White
        r = Math.min(1.0, normalizedVal * 1.5);
        g = Math.min(1.0, Math.pow(normalizedVal, 2.2) * 1.2);
        b = Math.min(1.0, Math.pow(normalizedVal, 4.0) + (1.0 - normalizedVal) * 0.2);
      } else {
        // Magma
        r = Math.min(1.0, normalizedVal * 1.3);
        g = Math.min(1.0, Math.pow(normalizedVal, 1.8) * 0.8);
        b = (1.0 - normalizedVal) * 0.35 + Math.pow(normalizedVal, 3.0) * 0.5;
      }

      cols.setXYZ(i, r, g, b);
    }

    cols.needsUpdate = true;
  });

  return (
    <group rotation={[Math.PI / 4, Math.PI / 5, 0]}>
      {/* Main Casing FEA Cylinder */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          roughness={0.3}
          metalness={0.7}
          wireframe={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe Iso-Grid Overlay */}
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.08} />
      </mesh>

      {/* Drive-End Bearing Flange Ring */}
      <mesh position={[0, 2.3, 0]}>
        <torusGeometry args={[1.7, 0.25, 24, 48]} />
        <meshStandardMaterial
          color={isCritical ? '#ff2200' : '#0ea5e9'}
          emissive={isCritical ? '#ff0000' : '#002244'}
          emissiveIntensity={isCritical ? 0.7 : 0.2}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Non-Drive End Bearing Flange Ring */}
      <mesh position={[0, -2.3, 0]}>
        <torusGeometry args={[1.7, 0.25, 24, 48]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Internal Rotating Rotor Core */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 6.2, 32]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Interactive 3D Inspection Node Pins */}
      {inspectionNodes.map((node) => {
        const isSelected = selectedNode === node.id;
        return (
          <group
            key={node.id}
            position={node.pos as [number, number, number]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectNode(node.id, node);
            }}
          >
            {/* Pulsing Pin Sphere */}
            <mesh>
              <sphereGeometry args={[isSelected ? 0.22 : 0.14, 16, 16]} />
              <meshStandardMaterial
                color={isSelected ? '#38bdf8' : isCritical && node.id === 1 ? '#ef4444' : '#10b981'}
                emissive={isSelected ? '#0284c7' : isCritical && node.id === 1 ? '#b91c1c' : '#059669'}
                emissiveIntensity={0.8}
              />
            </mesh>
            {/* Node ID label */}
            <Html distanceFactor={12}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(node.id, node);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer whitespace-nowrap shadow-lg select-none transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-black font-bold scale-110 border border-white'
                    : 'bg-slate-900/90 text-cyan-300 border border-slate-700 hover:border-cyan-400'
                }`}
              >
                #{node.id} {node.component}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export function FEAStressHeatmap({
  isOpen,
  onClose,
  rpm,
  activeFault,
  isCritical,
  vibrationFactor,
}: FEAStressHeatmapProps) {
  const [viewMode, setViewMode] = useState<'stress' | 'thermal' | 'strain'>('stress');
  const [colorMap, setColorMap] = useState<'rainbow' | 'thermal' | 'magma'>('rainbow');
  const [pulseIntensity, setPulseIntensity] = useState(0.4);
  const [selectedNode, setSelectedNode] = useState<number | null>(1);
  const [selectedNodeData, setSelectedNodeData] = useState<any>({
    id: 1,
    name: 'Drive-End Bearing Race (DE)',
    component: 'Outer Raceway',
  });

  // Calculate simulated FEA values based on active state
  const baseVonMises = isCritical ? (activeFault === 'BPFO' ? 342.8 : 288.4) : 84.2;
  const yieldStrength = 420.0; // AISI 4340 Steel Yield Strength in MPa
  const safetyFactor = Math.max(0.8, +(yieldStrength / baseVonMises).toFixed(2));
  const temperature = isCritical ? 94.6 : 38.2;
  const principalStress1 = (baseVonMises * 1.15).toFixed(1);
  const principalStress2 = (baseVonMises * 0.42).toFixed(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 md:p-8 animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-7xl h-[92vh] bg-slate-950/95 border border-purple-500/40 rounded-2xl flex flex-col overflow-hidden shadow-2xl shadow-purple-950/60">

        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-400 shadow-lg shadow-purple-500/20">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  FEA STRESS TENSOR & THERMAL HEATMAP
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 border border-purple-500/40 text-purple-300">
                    VON MISES SIMULATION
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Finite Element Formulation • Dynamic Cyclic Stress Tensor • Speed: <span className="text-purple-400 font-bold">{rpm} RPM</span> • Vib: <span className="text-amber-400 font-bold">{vibrationFactor.toFixed(2)}g</span> • Material: AISI 4340 Steel
              </p>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View Mode */}
            <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-500 font-mono px-2">MODE</span>
              {(['stress', 'thermal', 'strain'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono uppercase transition-all ${
                    viewMode === m
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Color Map */}
            <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-500 font-mono px-2">GRADIENT</span>
              {(['rainbow', 'thermal', 'magma'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setColorMap(g)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono uppercase transition-all ${
                    colorMap === g
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Pulse Wave Slider */}
            <div className="flex items-center bg-slate-900 rounded-lg px-3 py-1 border border-slate-800 text-xs gap-2">
              <span className="text-[10px] text-slate-500 font-mono">CYCLE WAVE</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={pulseIntensity}
                onChange={(e) => setPulseIntensity(parseFloat(e.target.value))}
                className="w-16 accent-purple-400 cursor-pointer"
              />
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

          {/* 3D WebGL Canvas */}
          <div className="flex-1 relative bg-gradient-to-b from-[#090614] via-[#050309] to-[#020104]">
            <Canvas
              camera={{ position: [0, 4, 8], fov: 45 }}
              gl={{ antialias: true, alpha: false }}
            >
              <color attach="background" args={['#05030a']} />
              <ambientLight intensity={0.8} />
              <directionalLight position={[10, 15, 10]} intensity={1.5} />
              <pointLight position={[0, 2, 4]} intensity={2} color="#a855f7" distance={20} />

              <FEAMachineHousing
                colorMap={colorMap}
                isCritical={isCritical}
                activeFault={activeFault}
                pulseIntensity={pulseIntensity}
                selectedNode={selectedNode}
                onSelectNode={(id, data) => {
                  setSelectedNode(id);
                  setSelectedNodeData(data);
                }}
              />

              <OrbitControls
                enableDamping
                dampingFactor={0.06}
                minDistance={3}
                maxDistance={18}
              />
            </Canvas>

            {/* In-Canvas Color Bar Scale */}
            <div className="absolute top-6 left-6 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-3 flex flex-col gap-2 font-mono text-[11px] shadow-xl pointer-events-none">
              <div className="text-slate-400 font-bold flex items-center justify-between gap-4">
                <span>{viewMode === 'stress' ? 'VON MISES (MPa)' : viewMode === 'thermal' ? 'TEMP (°C)' : 'MICRO-STRAIN (με)'}</span>
                <span className={isCritical ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                  MAX: {viewMode === 'stress' ? '400 MPa' : viewMode === 'thermal' ? '120°C' : '1500 με'}
                </span>
              </div>
              <div className="w-48 h-3 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 via-cyan-400 via-green-400 via-yellow-400 to-red-500" />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>0.0</span>
                <span>100</span>
                <span>200</span>
                <span>300</span>
                <span>400+</span>
              </div>
            </div>

            {/* Instruction tooltip */}
            <div className="absolute bottom-4 left-6 text-slate-500 font-mono text-[10px]">
              Tip: Click on numbered node pins to inspect localized stress & shear vectors.
            </div>
          </div>

          {/* Telemetry & FEA Diagnostics Sidebar */}
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-5 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">Localized Node Inspector</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-950 border border-purple-500/40 text-purple-300">
                  NODE #{selectedNode || 1}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{selectedNodeData?.name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedNodeData?.component}</p>
            </div>

            {/* Key FEA Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 font-mono">VON MISES STRESS</span>
                <div className={`text-xl font-mono font-bold mt-1 ${isCritical ? 'text-red-400' : 'text-emerald-400'}`}>
                  {baseVonMises.toFixed(1)} <span className="text-xs font-normal text-slate-500">MPa</span>
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-1">Yield Limit: 420.0 MPa</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 font-mono">SAFETY FACTOR (SF)</span>
                <div className={`text-xl font-mono font-bold mt-1 ${safetyFactor < 1.5 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {safetyFactor}
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-1">{safetyFactor < 1.5 ? 'Risk of Fatigue Micro-Crack' : 'Within Elastic Margin'}</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 font-mono">THERMAL DISSIPATION</span>
                <div className="text-xl font-mono font-bold text-amber-400 mt-1">
                  {temperature.toFixed(1)} <span className="text-xs font-normal text-slate-500">°C</span>
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-1">ΔT: +{(temperature - 22).toFixed(1)}°C rise</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 font-mono">PRINCIPAL TENSORS</span>
                <div className="text-sm font-mono text-cyan-300 mt-1">
                  σ₁: {principalStress1} MPa
                </div>
                <div className="text-sm font-mono text-cyan-500 mt-0.5">
                  σ₂: {principalStress2} MPa
                </div>
              </div>
            </div>

            {/* Fatigue Life Prediction Box */}
            <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
              isCritical
                ? 'bg-red-950/30 border-red-500/50 text-red-200'
                : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
            }`}>
              <div className="flex items-center gap-2 text-xs font-bold font-mono">
                {isCritical ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <ShieldAlert className="w-4 h-4 text-emerald-400" />}
                {isCritical ? 'STRUCTURAL FATIGUE DETECTED' : 'ELASTIC REGIME STABLE'}
              </div>
              <p className="text-xs font-mono leading-relaxed opacity-90">
                {isCritical
                  ? `Peak cyclic shear stress (${baseVonMises.toFixed(1)} MPa) is exceeding endurance threshold under ${activeFault} dynamic loading. Recommended: Reduce rotational speed by 25% or inspect raceway for pitting.`
                  : 'All structural tensor nodes operating well below the material endurance limit (420 MPa). Predicted component fatigue life exceeds 12,000 continuous hours.'}
              </p>
            </div>

            {/* Export FEA Data Action */}
            <button
              onClick={() => alert(`FEA Stress Tensor Export: Node #${selectedNode || 1} Von Mises = ${baseVonMises} MPa. Data exported to CMMS.`)}
              className="w-full py-2.5 rounded-xl font-mono text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              Export Node Stress Matrix (.CSV)
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default FEAStressHeatmap;
