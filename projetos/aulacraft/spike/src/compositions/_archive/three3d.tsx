import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate } from 'remotion';
import * as THREE from 'three';
import { PALETTE_ARR } from './palette';

// Floating 3D shapes in background — slow continuous motion, vivid colors
// Renders inside a Three.js canvas at full composition size.

type ShapeKind = 'box' | 'sphere' | 'torus' | 'octa';

const SHAPES: { kind: ShapeKind; pos: [number, number, number]; color: string; size: number }[] = [
  { kind: 'box',    pos: [-4.5,  2.5, -3], color: PALETTE_ARR[0], size: 1.2 },
  { kind: 'sphere', pos: [ 5.0,  1.8, -4], color: PALETTE_ARR[1], size: 1.0 },
  { kind: 'torus',  pos: [-3.5, -2.5, -2], color: PALETTE_ARR[2], size: 0.9 },
  { kind: 'octa',   pos: [ 4.0, -2.0, -3], color: PALETTE_ARR[3], size: 1.1 },
  { kind: 'box',    pos: [ 0.0,  3.0, -5], color: PALETTE_ARR[4], size: 0.8 },
  { kind: 'sphere', pos: [-2.0,  0.0, -6], color: PALETTE_ARR[5], size: 1.3 },
  { kind: 'torus',  pos: [ 2.5, -1.0, -5], color: PALETTE_ARR[6], size: 0.7 },
  { kind: 'octa',   pos: [-5.0, -1.0, -4], color: PALETTE_ARR[7], size: 0.9 },
];

const Shape: React.FC<{
  kind: ShapeKind;
  pos: [number, number, number];
  color: string;
  size: number;
  index: number;
}> = ({ kind, pos, color, size, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Each shape rotates at slightly different rates and floats
  const rotX = t * (0.15 + (index % 3) * 0.08);
  const rotY = t * (0.20 + (index % 4) * 0.07);
  const floatY = Math.sin(t * 0.6 + index) * 0.4;
  const floatX = Math.cos(t * 0.4 + index * 1.7) * 0.3;

  const geometry = (() => {
    switch (kind) {
      case 'box':    return <boxGeometry args={[size, size, size]} />;
      case 'sphere': return <sphereGeometry args={[size * 0.7, 32, 32]} />;
      case 'torus':  return <torusGeometry args={[size * 0.6, size * 0.22, 16, 48]} />;
      case 'octa':   return <octahedronGeometry args={[size * 0.8, 0]} />;
    }
  })();

  return (
    <mesh
      position={[pos[0] + floatX, pos[1] + floatY, pos[2]]}
      rotation={[rotX, rotY, 0]}
    >
      {geometry}
      <meshStandardMaterial
        color={color}
        roughness={0.35}
        metalness={0.2}
        emissive={color}
        emissiveIntensity={0.15}
      />
    </mesh>
  );
};

export const ThreeBackground: React.FC<{
  fadeIn?: boolean;
  durationInFrames: number;
  opacity?: number;
}> = ({ fadeIn = true, durationInFrames, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const fadeOpacity = fadeIn ? interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }) : 1;

  return (
    <AbsoluteFill style={{ opacity: fadeOpacity * opacity, pointerEvents: 'none' }}>
      <ThreeCanvas width={1920} height={1080}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-5, -3, 4]} intensity={0.7} color="#a3e635" />
        {SHAPES.map((s, i) => (
          <Shape key={i} {...s} index={i} />
        ))}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// CountUp3D — number with CSS 3D extrusion + Y rotation while counting
export const CountUp3D: React.FC<{
  target: number;
  suffix?: string;
  label?: string;
  startTime: number;
  durationSeconds: number;
  position: { left?: string; right?: string; top?: string; bottom?: string };
  color: string;
}> = ({ target, suffix = '', label, startTime, durationSeconds, position, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const endTime = startTime + durationSeconds;
  if (t < startTime || t > endTime + 0.4) return null;

  const countDuration = Math.min(1.4, durationSeconds * 0.6);
  const progress = interpolate(t, [startTime, startTime + countDuration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const eased = 1 - Math.pow(1 - progress, 3);
  const current = Math.round(target * eased);

  // 3D rotation: spins fast at start, settles
  const rotProgress = interpolate(t, [startTime, startTime + 0.9], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rotY = interpolate(rotProgress, [0, 1], [-180, 0]);
  const inScale = interpolate(rotProgress, [0, 1], [0.4, 1]);
  const outFade = interpolate(t, [endTime, endTime + 0.4], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Build text-shadow stack for extrusion effect (10 layers, darker progressively)
  const extrudeShadows = Array.from({ length: 12 })
    .map((_, i) => {
      const o = i + 1;
      const darkness = Math.max(0, 0.5 - i * 0.04);
      return `${o}px ${o}px 0 rgba(0,0,0,${darkness})`;
    })
    .join(', ');

  return (
    <div
      style={{
        position: 'absolute',
        ...position,
        opacity: outFade,
        textAlign: 'center',
        perspective: 1200,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          transform: `rotateY(${rotY}deg) scale(${inScale})`,
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          style={{
            color,
            fontSize: 220,
            fontWeight: 900,
            lineHeight: 0.9,
            letterSpacing: -10,
            textShadow: `${extrudeShadows}, 0 0 40px ${color}99, 0 20px 60px rgba(0,0,0,0.6)`,
          }}
        >
          {current}
          <span style={{ fontSize: 130, marginLeft: 6 }}>{suffix}</span>
        </div>
        {label && (
          <div
            style={{
              color: '#ffffff',
              fontSize: 30,
              fontWeight: 700,
              marginTop: 12,
              textShadow: '0 2px 12px rgba(0,0,0,0.85), 0 0 24px rgba(0,0,0,0.6)',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            {label}
          </div>
        )}
      </div>
    </div>
  );
};

// SceneTitle3D — extruded text with rotateX entrance
export const SceneTitle3D: React.FC<{
  number: string;
  title: string;
  color: string;
}> = ({ number, title, color }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;

  const entranceFrame = Math.min(frame, 20);
  const entrance = interpolate(entranceFrame, [0, 20], [0, 1]);
  const rotX = interpolate(entrance, [0, 1], [-90, 0]);
  const outFade = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const extrudeShadows = Array.from({ length: 10 })
    .map((_, i) => `${i + 1}px ${i + 1}px 0 rgba(0,0,0,${Math.max(0, 0.5 - i * 0.04)})`)
    .join(', ');

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: outFade,
        fontFamily: 'Inter, sans-serif',
        perspective: 1500,
      }}
    >
      <div
        style={{
          color: '#ffffff',
          fontSize: 36,
          fontWeight: 900,
          letterSpacing: 10,
          textTransform: 'uppercase',
          opacity: entrance,
          marginBottom: 24,
        }}
      >
        {number}
      </div>
      <div
        style={{
          transform: `rotateX(${rotX}deg)`,
          transformOrigin: 'bottom center',
          color: '#ffffff',
          fontSize: 160,
          fontWeight: 900,
          letterSpacing: -4,
          lineHeight: 1,
          textShadow: `${extrudeShadows}, 0 30px 80px rgba(0,0,0,0.4)`,
        }}
      >
        {title}
      </div>
    </AbsoluteFill>
  );
};

// OutroChip3D — card with 3D flip entrance
export const OutroChip3D: React.FC<{
  label: string;
  startTime: number;
  color: string;
}> = ({ label, startTime, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < startTime) return <div style={{ width: 280, height: 160, opacity: 0 }} />;

  const localFrame = (t - startTime) * fps;
  const flipProgress = interpolate(localFrame, [0, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rotY = interpolate(flipProgress, [0, 1], [-180, 0]);
  const scale = interpolate(flipProgress, [0, 1], [0.5, 1]);

  return (
    <div
      style={{
        perspective: 1200,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          transform: `rotateY(${rotY}deg) scale(${scale})`,
          transformStyle: 'preserve-3d',
          padding: '40px 64px',
          background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
          color: '#0a0a0a',
          borderRadius: 28,
          fontSize: 96,
          fontWeight: 900,
          letterSpacing: 2,
          boxShadow: `0 30px 80px ${color}88, inset 0 -12px 32px rgba(0,0,0,0.18), inset 0 4px 0 rgba(255,255,255,0.5)`,
        }}
      >
        {label}
      </div>
    </div>
  );
};
