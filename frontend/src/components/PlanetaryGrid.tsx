import { useEffect, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';

interface PlanetaryGridProps {
    isCritical: boolean;
    isUnderAttack?: boolean;
    isNodeIsolated?: boolean;
}

interface GlobalNode {
    id: string;
    name?: string;
    lat: number;
    lng: number;
    type: 'core' | 'edge';
    size?: number;
    color?: string;
}

interface DataArc {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    color: string;
}

export function PlanetaryGrid({ isCritical, isUnderAttack = false, isNodeIsolated = false }: PlanetaryGridProps) {
    const globeRef = useRef<any>(null);

    // === PROCEDURAL GENERATION ===

    // CORE HUBS (The "Generals")
    const mainHubs: GlobalNode[] = useMemo(() => [
        { id: 'vienna', lat: 48.20, lng: 16.37, name: "VIENNA HQ", type: "core" },
        { id: 'ny', lat: 40.71, lng: -74.00, name: "NEW YORK", type: "core" },
        { id: 'tokyo', lat: 35.67, lng: 139.65, name: "TOKYO", type: "core" },
        { id: 'london', lat: 51.50, lng: -0.12, name: "LONDON", type: "core" },
        { id: 'singapore', lat: 1.35, lng: 103.82, name: "SINGAPORE", type: "core" },
    ], []);

    // GENERATE SWARM (The "Soldiers")
    const generateSwarm = useMemo(() => {
        const count = 450;
        const swarm: GlobalNode[] = [];

        for (let i = 0; i < count; i++) {
            const region = Math.random();
            let lat, lng;

            if (region < 0.25) {
                // North America
                lat = 25 + Math.random() * 30;
                lng = -130 + Math.random() * 60;
            } else if (region < 0.5) {
                // Europe
                lat = 35 + Math.random() * 25;
                lng = -10 + Math.random() * 40;
            } else if (region < 0.75) {
                // Asia
                lat = 10 + Math.random() * 40;
                lng = 70 + Math.random() * 80;
            } else {
                // South America / Australia
                lat = -35 + Math.random() * 30;
                lng = Math.random() > 0.5 ? -70 + Math.random() * 40 : 110 + Math.random() * 40;
            }

            swarm.push({
                id: `edge-${i}`,
                lat: lat,
                lng: lng,
                size: 0.15,
                type: "edge",
                color: "#10b981"
            });
        }
        return swarm;
    }, []);

    // Combine for rendering
    const allNodes = useMemo(() => [...mainHubs, ...generateSwarm], [mainHubs, generateSwarm]);

    // Auto-rotate to show full planetary view
    useEffect(() => {
        if (globeRef.current) {
            globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 3.5 }, 2000);
            globeRef.current.controls().autoRotate = true;
            globeRef.current.controls().autoRotateSpeed = 0.5;
        }
    }, []);

    // Generate arcs from edge nodes to nearest core hub
    const arcsData: DataArc[] = useMemo(() => {
        // If node is isolated, no arcs
        if (isNodeIsolated) return [];

        // Color based on state: Attack (white), Critical (red), Normal (green)
        const arcColor = isUnderAttack
            ? ['#ffffff', '#e0e0e0', '#f0f0f0']
            : isCritical
                ? ['#ff6b6b', '#ff4444', '#ff8c00']
                : ['#4ade80', '#22c55e', '#10b981'];
        const arcs: DataArc[] = [];

        // Sample 100 random edge nodes for arcs (performance optimization)
        const sampleSize = Math.min(100, generateSwarm.length);
        const sampledNodes = generateSwarm
            .sort(() => Math.random() - 0.5)
            .slice(0, sampleSize);

        sampledNodes.forEach(node => {
            // Find nearest hub
            let nearestHub = mainHubs[0];
            let minDist = Infinity;

            mainHubs.forEach(hub => {
                const dist = Math.sqrt(
                    Math.pow(hub.lat - node.lat, 2) + Math.pow(hub.lng - node.lng, 2)
                );
                if (dist < minDist) {
                    minDist = dist;
                    nearestHub = hub;
                }
            });

            arcs.push({
                startLat: node.lat,
                startLng: node.lng,
                endLat: nearestHub.lat,
                endLng: nearestHub.lng,
                color: arcColor[Math.floor(Math.random() * arcColor.length)],
            });
        });

        return arcs;
    }, [isCritical, isUnderAttack, isNodeIsolated, mainHubs, generateSwarm]);

    // Generate rings from core hubs
    const ringsData = useMemo(() => {
        return mainHubs.map(hub => ({
            lat: hub.lat,
            lng: hub.lng,
            maxR: isCritical ? 6 : 3,
            propagationSpeed: isCritical ? 3 : 1.5,
            repeatPeriod: isCritical ? 600 : 2000,
            color: isCritical ? '#ff4444' : '#4ade80',
        }));
    }, [isCritical, mainHubs]);

    // Generate spikes from core hubs when critical
    const barsData = useMemo(() => {
        if (!isCritical) return [];
        return mainHubs.map(hub => ({
            lat: hub.lat,
            lng: hub.lng,
            altitude: 0.4,
            color: '#ff4444',
        }));
    }, [isCritical, mainHubs]);

    return (
        <div className="relative w-full h-full bg-[#050508] overflow-hidden">
            <Globe
                ref={globeRef}
                width={window.innerWidth * 0.5}
                height={window.innerHeight * 0.9}
                globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
                backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
                atmosphereColor={isUnderAttack ? '#a855f7' : isCritical ? '#ff6b6b' : '#4ade80'}
                atmosphereAltitude={0.2}
                animateIn={true}
                enablePointerInteraction={true}

                // Camera Controls
                onGlobeReady={() => {
                    if (globeRef.current) {
                        const controls = globeRef.current.controls();
                        controls.enableZoom = true;
                        controls.minDistance = 250;
                        controls.maxDistance = 600;
                        controls.autoRotate = true;
                        controls.autoRotateSpeed = 0.5;
                    }
                }}

                // Points (All Nodes)
                pointsData={allNodes}
                pointLat={(d: any) => d.lat}
                pointLng={(d: any) => d.lng}
                pointColor={(d: any) => {
                    if (d.type === 'core' && isCritical) return '#ff4444';
                    if (d.type === 'core') return '#00ffff';
                    return d.color || '#10b981';
                }}
                pointAltitude={(d: any) => d.type === 'core' ? 0.03 : 0.01}
                pointRadius={(d: any) => d.type === 'core' ? 0.6 : 0.2}
                pointLabel={(d: any) => d.name ? `<div style="background: rgba(0,0,0,0.9); padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; border: 1px solid #00ffff;">${d.name}<br/><span style="color: #00ffff; font-size: 10px;">CORE HUB</span></div>` : ''}

                // Arcs (Data Flow)
                arcsData={arcsData}
                arcStartLat={(d: any) => d.startLat}
                arcStartLng={(d: any) => d.startLng}
                arcEndLat={(d: any) => d.endLat}
                arcEndLng={(d: any) => d.endLng}
                arcColor={(d: any) => d.color}
                arcDashLength={0.4}
                arcDashGap={0.2}
                arcDashAnimateTime={1500}
                arcStroke={0.3}

                // Rings (Ripples)
                ringsData={ringsData}
                ringLat={(d: any) => d.lat}
                ringLng={(d: any) => d.lng}
                ringMaxRadius={(d: any) => d.maxR}
                ringPropagationSpeed={(d: any) => d.propagationSpeed}
                ringRepeatPeriod={(d: any) => d.repeatPeriod}
                ringColor={(d: any) => d.color}

                // Height Bars (Spikes) for Critical
                hexBinPointsData={barsData}
                hexBinPointLat={(d: any) => d.lat}
                hexBinPointLng={(d: any) => d.lng}
                hexAltitude={(d: any) => d.altitude}
                hexBinResolution={4}
                hexTopColor={() => '#ff4444'}
                hexSideColor={() => '#ff6b6b'}
            />

            {/* Overlay Labels */}
            {isCritical && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-500 rounded-lg px-5 py-2 animate-pulse z-20 shadow-lg shadow-red-500/30">
                    <div className="text-red-200 font-mono text-sm tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                        GLOBAL NETWORK ALERT: REROUTING TRAFFIC
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-700 rounded-lg p-3 text-[10px] font-mono z-20">
                <div className="text-slate-400 uppercase tracking-wider mb-2 font-bold">Global Network</div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                        <span className="text-slate-300">Core Hub ({mainHubs.length})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="text-slate-300">Edge Node ({generateSwarm.length})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-400"></span>
                        <span className="text-slate-300">Alert</span>
                    </div>
                </div>
            </div>

            {/* Node Count */}
            <div className="absolute top-4 right-4 bg-slate-900/90 border border-slate-700 rounded-lg p-3 text-center z-20">
                <div className="text-3xl font-mono font-bold text-emerald-400">{allNodes.length}</div>
                <div className="text-[9px] font-mono text-slate-500 uppercase">Active Nodes</div>
            </div>

            {/* Network Stats */}
            <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-700 rounded-lg p-3 text-[10px] font-mono z-20">
                <div className="text-slate-400 uppercase tracking-wider mb-2 font-bold">Network Stats</div>
                <div className="space-y-1">
                    <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Arcs:</span>
                        <span className="text-emerald-400">{arcsData.length}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Rings:</span>
                        <span className="text-cyan-400">{ringsData.length}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Latency:</span>
                        <span className={isCritical ? 'text-red-400' : 'text-emerald-400'}>
                            {isCritical ? '145ms' : '12ms'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PlanetaryGrid;
