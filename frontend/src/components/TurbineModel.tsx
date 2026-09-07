import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group } from 'three';

interface TurbineModelProps {
    isCritical: boolean;
}

export function TurbineModel({ isCritical }: TurbineModelProps) {
    const rotorRef = useRef<Mesh>(null);
    const groupRef = useRef<Group>(null);
    const bearingLeftRef = useRef<Mesh>(null);
    const bearingRightRef = useRef<Mesh>(null);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();

        // --- Rotor Rotation ---
        if (rotorRef.current) {
            if (isCritical) {
                // Wobble effect for failure
                rotorRef.current.rotation.x += 0.15 + Math.sin(time * 10) * 0.1;
            } else {
                // Smooth rotation
                rotorRef.current.rotation.x += 0.08;
            }
        }

        // --- Shake Effect on Critical ---
        if (groupRef.current) {
            if (isCritical) {
                groupRef.current.position.x = (Math.random() - 0.5) * 0.05;
                groupRef.current.position.y = (Math.random() - 0.5) * 0.03;
                groupRef.current.position.z = (Math.random() - 0.5) * 0.02;
            } else {
                groupRef.current.position.set(0, 0, 0);
            }
        }
    });

    // Colors
    const rotorColor = isCritical ? '#ff6b6b' : '#64748b';
    const bearingColor = isCritical ? '#ff0000' : '#4ade80';
    const baseColor = '#1e293b';

    return (
        <group ref={groupRef}>
            {/* Base Platform */}
            <mesh position={[0, -0.8, 0]}>
                <boxGeometry args={[3, 0.2, 1.5]} />
                <meshStandardMaterial color={baseColor} metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Motor Housing */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1.5, 0.8, 0.8]} />
                <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
            </mesh>

            {/* Rotor (Spinning Cylinder) - Horizontal */}
            <mesh ref={rotorRef} position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.25, 0.25, 2.5, 32]} />
                <meshStandardMaterial
                    color={rotorColor}
                    metalness={0.8}
                    roughness={0.2}
                    emissive={isCritical ? '#ff4444' : '#000000'}
                    emissiveIntensity={isCritical ? 0.3 : 0}
                />
            </mesh>

            {/* Left Bearing */}
            <mesh ref={bearingLeftRef} position={[-1.4, 0.1, 0]}>
                <boxGeometry args={[0.3, 0.5, 0.5]} />
                <meshStandardMaterial
                    color={bearingColor}
                    metalness={0.5}
                    roughness={0.3}
                    emissive={isCritical ? '#ff0000' : '#00ff00'}
                    emissiveIntensity={isCritical ? 0.8 : 0.2}
                />
            </mesh>

            {/* Right Bearing */}
            <mesh ref={bearingRightRef} position={[1.4, 0.1, 0]}>
                <boxGeometry args={[0.3, 0.5, 0.5]} />
                <meshStandardMaterial
                    color={bearingColor}
                    metalness={0.5}
                    roughness={0.3}
                    emissive={isCritical ? '#ff0000' : '#00ff00'}
                    emissiveIntensity={isCritical ? 0.8 : 0.2}
                />
            </mesh>

            {/* Support Legs */}
            <mesh position={[-1, -0.5, 0.5]}>
                <boxGeometry args={[0.15, 0.4, 0.15]} />
                <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[1, -0.5, 0.5]}>
                <boxGeometry args={[0.15, 0.4, 0.15]} />
                <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[-1, -0.5, -0.5]}>
                <boxGeometry args={[0.15, 0.4, 0.15]} />
                <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[1, -0.5, -0.5]}>
                <boxGeometry args={[0.15, 0.4, 0.15]} />
                <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Cooling Fins on Motor */}
            {[-0.4, -0.2, 0, 0.2, 0.4].map((x, i) => (
                <mesh key={i} position={[x, 0.45, 0]}>
                    <boxGeometry args={[0.05, 0.1, 0.9]} />
                    <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
                </mesh>
            ))}
        </group>
    );
}

export default TurbineModel;
