import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Text } from '@react-three/drei'
import type { Primitive } from './geometries'
import { buildYantra3D } from './geometries'
import type { DimensionMap } from './dimensions'

interface Props {
  type: string
  dims: DimensionMap
}

function Label({ position, text }: { position: [number, number, number]; text: string }) {
  return (
    <Text
      position={position}
      fontSize={0.6}
      color="#2b2b2b"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.02}
      outlineColor="#ffffff"
    >
      {text}
    </Text>
  )
}

function PrimitiveNode({ p }: { p: Primitive }) {
  const rot = p.rot ?? [0, 0, 0]
  const basePos = (p.kind === 'line' ? p.start : (p.pos ?? [0, 0, 0])) as [
    number,
    number,
    number,
  ]
  const labelPos = p.label
    ? ([basePos[0], basePos[1] + 1.2, basePos[2]] as [number, number, number])
    : null

  let mesh: React.ReactNode = null
  switch (p.kind) {
    case 'box':
      mesh = (
        <mesh position={basePos} rotation={rot as [number, number, number]}>
          <boxGeometry args={p.size} />
          <meshStandardMaterial color={p.color ?? '#cccccc'} metalness={0.05} roughness={0.9} />
        </mesh>
      )
      break
    case 'cylinder':
      mesh = (
        <mesh position={basePos} rotation={rot as [number, number, number]}>
          <cylinderGeometry args={[p.radius, p.radius, p.height, p.segments ?? 32]} />
          <meshStandardMaterial color={p.color ?? '#cccccc'} metalness={0.05} roughness={0.9} />
        </mesh>
      )
      break
    case 'ring':
      mesh = (
        <mesh position={basePos} rotation={rot as [number, number, number]}>
          <torusGeometry args={[p.radius, p.tube, 16, 64]} />
          <meshStandardMaterial color={p.color ?? '#cccccc'} metalness={0.4} roughness={0.5} />
        </mesh>
      )
      break
    case 'sphere':
      mesh = (
        <mesh position={basePos}>
          <sphereGeometry args={[p.radius, 32, 32]} />
          <meshStandardMaterial color={p.color ?? '#cccccc'} metalness={0.05} roughness={0.9} />
        </mesh>
      )
      break
    case 'disk':
      mesh = (
        <mesh position={basePos} rotation={rot as [number, number, number]}>
          <cylinderGeometry args={[p.radius, p.radius, 0.3, 48]} />
          <meshStandardMaterial color={p.color ?? '#cccccc'} metalness={0.05} roughness={0.9} />
        </mesh>
      )
      break
    case 'line':
      mesh = (
        <mesh position={basePos}>
          <cylinderGeometry args={[p.width ?? 0.05, p.width ?? 0.05, 5, 8]} />
          <meshStandardMaterial color={p.color ?? '#cccccc'} />
        </mesh>
      )
      break
  }

  return (
    <group>
      {mesh}
      {labelPos && (
        <Label position={labelPos} text={p.label as string} />
      )}
    </group>
  )
}

function geometryFit(type: string, dims: DimensionMap): number {
  return buildYantra3D(type, dims).reduce((acc, p) => {
    let size = 12
    switch (p.kind) {
      case 'box':
        size = Math.max(...p.size)
        break
      case 'cylinder':
      case 'ring':
        size = Math.max(p.radius, (p.kind === 'cylinder' ? p.height : 0)) * 2
        break
      case 'sphere':
      case 'disk':
        size = p.radius * 2
        break
      case 'line':
        size = 5
        break
    }
    return Math.max(acc, size)
  }, 12)
}

function YantraModel({ type, dims }: Props) {
  const primitives = buildYantra3D(type, dims)
  const fit = geometryFit(type, dims)
  return (
    <group>
      {primitives.map((p, i) => (
        <PrimitiveNode key={i} p={p} />
      ))}
      <Grid
        position={[0, -0.5, 0]}
        args={[fit * 3, fit * 3]}
        cellSize={Math.max(0.5, fit / 12)}
        cellThickness={0.6}
        cellColor="#c9c9c9"
        sectionSize={Math.max(1, fit / 4)}
        sectionThickness={1}
        sectionColor="#9a9a9a"
        fadeDistance={fit * 4}
        fadeStrength={1}
      />
    </group>
  )
}

export default function Yantra3D({ type, dims }: Props) {
  const fit = geometryFit(type, dims)
  return (
    <Canvas camera={{ position: [fit, fit, fit * 1.6], fov: 50 }}>
      <ambientLight intensity={0.9} />
      <directionalLight position={[fit, fit, fit]} intensity={1.4} />
      <directionalLight position={[-fit, fit, -fit]} intensity={0.4} />
      <YantraModel type={type} dims={dims} />
      <OrbitControls
        enablePan={false}
        minDistance={fit * 0.5}
        maxDistance={fit * 5}
        autoRotate
        autoRotateSpeed={0.6}
      />
    </Canvas>
  )
}
