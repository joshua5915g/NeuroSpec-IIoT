import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Mesh, Color } from 'three';

interface GenerativeDesignProps {
    isCritical: boolean;
    onLog?: (message: string) => void;
}

// The morphing TorusKnot component
function MorphingBearing({ isCritical }: { isCritical: boolean }) {
    const meshRef = useRef<Mesh>(null);
    const wireframeRef = useRef<Mesh>(null);
    const [tubeRadius, setTubeRadius] = useState(0.3);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();

        if (meshRef.current) {
            // Base rotation
            meshRef.current.rotation.x += 0.005;
            meshRef.current.rotation.y += 0.008;

            if (isCritical) {
                // "Breathing" effect - expand and contract
                const breathingFactor = Math.sin(time * 3) * 0.1 + 1;
                meshRef.current.scale.set(breathingFactor, breathingFactor * 1.1, breathingFactor);

                // Calculate stress-based tube expansion
                const targetRadius = 0.3 + Math.sin(time * 2) * 0.05 + 0.08;
                setTubeRadius(prev => prev + (targetRadius - prev) * 0.1);

                // Wobble effect
                meshRef.current.position.y = Math.sin(time * 5) * 0.05;
            } else {
                // Calm spinning
                meshRef.current.scale.set(1, 1, 1);
                meshRef.current.position.y = 0;
                setTubeRadius(prev => prev + (0.3 - prev) * 0.05);
            }
        }

        if (wireframeRef.current) {
            wireframeRef.current.rotation.x = meshRef.current?.rotation.x || 0;
            wireframeRef.current.rotation.y = meshRef.current?.rotation.y || 0;
            wireframeRef.current.scale.copy(meshRef.current?.scale || { x: 1, y: 1, z: 1 } as any);
        }
    });

    // Color transitions
    const mainColor = isCritical ? new Color('#c0c0c0') : new Color('#a8a8a8');
    const wireColor = isCritical ? '#ff8c00' : '#00ffff';

    return (
        <group>
            {/* Main Solid Mesh */}
            <mesh ref={meshRef}>
                <torusKnotGeometry args={[1, tubeRadius, 128, 32, 2, 3]} />
                <meshPhysicalMaterial
                    color={mainColor}
                    metalness={1}
                    roughness={0.2}
                    clearcoat={0.5}
                    clearcoatRoughness={0.1}
                    emissive={isCritical ? '#ff4400' : '#000000'}
                    emissiveIntensity={isCritical ? 0.15 : 0}
                />
            </mesh>

            {/* Wireframe Overlay */}
            <mesh ref={wireframeRef}>
                <torusKnotGeometry args={[1.01, tubeRadius + 0.01, 64, 16, 2, 3]} />
                <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.6} />
            </mesh>
        </group>
    );
}

export function GenerativeDesign({ isCritical, onLog }: GenerativeDesignProps) {
    const [iteration, setIteration] = useState(442);
    const [stressLoad, setStressLoad] = useState(85);
    const [materialAdded, setMaterialAdded] = useState(0);
    const [showDownload, setShowDownload] = useState(false);
    const criticalStartRef = useRef<number | null>(null);

    // Simulation logic when critical
    useEffect(() => {
        if (isCritical) {
            if (!criticalStartRef.current) {
                criticalStartRef.current = Date.now();
                onLog?.(">> DETECTED SHEAR STRESS AT VECTOR [0, 1, 0]");
                setTimeout(() => onLog?.(">> INITIATING BIOMIMETIC REINFORCEMENT..."), 1000);
                setTimeout(() => onLog?.(">> LATTICE STRUCTURE GENERATED."), 2500);
            }

            const interval = setInterval(() => {
                setIteration(prev => prev + 1);
                setStressLoad(prev => Math.min(200, prev + Math.random() * 5));
                setMaterialAdded(prev => Math.min(25, prev + 0.3));
            }, 200);

            // Show download button after 5 seconds
            const downloadTimer = setTimeout(() => {
                setShowDownload(true);
                onLog?.(">> OPTIMIZATION COMPLETE. STL READY.");
            }, 5000);

            return () => {
                clearInterval(interval);
                clearTimeout(downloadTimer);
            };
        } else {
            criticalStartRef.current = null;
            setShowDownload(false);
            setStressLoad(85);
            setMaterialAdded(0);
            setIteration(442);
        }
    }, [isCritical, onLog]);

    return (
        <div className="relative w-full h-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
            {/* 3D Canvas */}
            <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                <ambientLight intensity={0.3} />
                <pointLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
                <pointLight position={[-5, -5, -5]} intensity={0.5} color="#4ade80" />
                <pointLight position={[0, 5, 0]} intensity={0.8} color={isCritical ? "#ff6b6b" : "#00ffff"} />

                <MorphingBearing isCritical={isCritical} />

                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>

            {/* HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Top Left - Engine Status */}
                <div className="absolute top-3 left-3 bg-slate-900/80 border border-slate-700 rounded-lg p-3">
                    <div className={`text-[10px] font-mono uppercase tracking-wider ${isCritical ? 'text-orange-400' : 'text-cyan-400'}`}>
                        {isCritical ? '◉ GENERATIVE TOPOLOGY ENGINE: ACTIVE' : '○ ENGINE: STANDBY'}
                    </div>
                </div>

                {/* Right Side - Metrics */}
                <div className="absolute top-3 right-3 bg-slate-900/80 border border-slate-700 rounded-lg p-3 text-right">
                    <div className="space-y-1 font-mono text-[10px]">
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-500">STRESS LOAD:</span>
                            <span className={stressLoad > 150 ? 'text-red-400' : 'text-slate-300'}>
                                {stressLoad.toFixed(0)} MPa
                            </span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-500">MATERIAL ADDED:</span>
                            <span className="text-emerald-400">+{materialAdded.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-500">ITERATION:</span>
                            <span className="text-cyan-400">Gen-{iteration}</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Center - Component Label */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-2">
                    <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest text-center">
                        TOPOLOGY: INDUSTRIAL BEARING | ALLOY: TI-6AL-4V
                    </div>
                </div>

                {/* Download Button */}
                {showDownload && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-auto">
                        <button className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/30">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            DOWNLOAD OPTIMIZED .STL
                        </button>
                    </div>
                )}

                {/* Scanlines Effect */}
                <div
                    className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.1) 2px, rgba(0,255,255,0.1) 4px)'
                    }}
                />
            </div>
        </div>
    );
}

export default GenerativeDesign;
