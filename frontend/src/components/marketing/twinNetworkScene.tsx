import { useMemo, useRef } from "react";

import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const BLUE = "#3b6bf0";
const GREEN = "#22c55e";
const MUTED = "#94a3b8";

function Network() {
  const group = useRef<THREE.Group>(null);
  const packetsRef = useRef<THREE.Mesh[]>([]);

  const productionPos = useMemo(() => new THREE.Vector3(-2.1, 0.9, 0), []);
  const twinPos = useMemo(() => new THREE.Vector3(-2.1, -0.9, 0), []);
  const comparatorPos = useMemo(() => new THREE.Vector3(1.6, 0, 0), []);

  const packetCount = 5;
  const packetSeeds = useMemo(
    () =>
      Array.from({ length: packetCount }, (_, i) => ({
        offset: i / packetCount,
        fromTwin: i % 2 === 0,
      })),
    [],
  );

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.25;
      group.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.12) * 0.08;
    }

    const t = state.clock.elapsedTime * 0.35;
    packetsRef.current.forEach((mesh, i) => {
      if (!mesh) return;
      const seed = packetSeeds[i];
      const progress = (t + seed.offset) % 1;
      const start = seed.fromTwin ? twinPos : productionPos;
      // First half: node -> comparator. Second half: comparator -> node (return trip).
      const [from, to] = progress < 0.5 ? [start, comparatorPos] : [comparatorPos, start];
      const localT = progress < 0.5 ? progress * 2 : (progress - 0.5) * 2;
      mesh.position.lerpVectors(from, to, localT);
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = progress < 0.5 ? 0.9 : 0.9 * (1 - localT * 0.6);
    });
  });

  const linePoints = useMemo(
    () => [
      [productionPos, comparatorPos],
      [twinPos, comparatorPos],
    ],
    [productionPos, twinPos, comparatorPos],
  );

  return (
    <group ref={group}>
      {linePoints.map(([a, b], i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([a.x, a.y, a.z, b.x, b.y, b.z]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={MUTED} transparent opacity={0.3} />
        </line>
      ))}

      <mesh position={productionPos}>
        <sphereGeometry args={[0.16, 32, 32]} />
        <meshStandardMaterial color={BLUE} emissive={BLUE} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={twinPos}>
        <sphereGeometry args={[0.16, 32, 32]} />
        <meshStandardMaterial color={BLUE} emissive={BLUE} emissiveIntensity={0.4} transparent opacity={0.7} />
      </mesh>
      <mesh position={comparatorPos}>
        <icosahedronGeometry args={[0.24, 0]} />
        <meshStandardMaterial color={GREEN} emissive={GREEN} emissiveIntensity={0.5} wireframe />
      </mesh>

      {packetSeeds.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) packetsRef.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color={GREEN} transparent />
        </mesh>
      ))}
    </group>
  );
}

export function TwinNetworkScene() {
  return (
    <div className="h-64 w-full lg:h-80" aria-hidden>
      <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.6} />
        <pointLight position={[3, 3, 3]} intensity={40} color={BLUE} />
        <Network />
      </Canvas>
    </div>
  );
}
