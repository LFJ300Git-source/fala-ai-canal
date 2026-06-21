import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const FONT_STACK = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
const CHARCOAL = '#0E0E11';
const TEXT = '#F5F5F7';
const DIM = '#A1A1AA';

// Ease-out-expo
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

// Common 3D scene lighting + camera setup
const SceneLights: React.FC<{ accent: string }> = ({ accent }) => (
  <>
    <ambientLight intensity={0.45} />
    <directionalLight position={[4, 6, 5]} intensity={1.0} color="#ffffff" />
    <directionalLight position={[-3, 2, 4]} intensity={0.35} color={accent} />
  </>
);

// ============================================================================
// BarChart3D — single bar filling to value (out of 100), with label below
// ============================================================================
const BarChartMesh: React.FC<{ value: number; accent: string; progress: number }> = ({
  value,
  accent,
  progress,
}) => {
  const targetHeight = (value / 100) * 4.5; // max 4.5 units tall
  const currentHeight = targetHeight * progress;

  return (
    <group position={[0, -2.2, 0]}>
      {/* Background rail (100%) */}
      <mesh position={[0, 4.5 / 2, -0.05]}>
        <boxGeometry args={[1.4, 4.5, 0.18]} />
        <meshStandardMaterial color="#1A1A20" roughness={0.9} metalness={0.0} />
      </mesh>
      {/* Filled bar */}
      <mesh position={[0, currentHeight / 2, 0]}>
        <boxGeometry args={[1.4, Math.max(currentHeight, 0.01), 0.42]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.42}
          metalness={0.15}
          emissive={accent}
          emissiveIntensity={0.06}
        />
      </mesh>
    </group>
  );
};

export const BarChart3D: React.FC<{
  startTime: number;
  endTime: number;
  value: number;
  suffix: string;
  label: string;
  accent: string;
}> = ({ startTime, endTime, value, suffix, label, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < startTime || t > endTime) return null;

  const localT = t - startTime;
  // Count-up phase: first 1.0s. Hold phase: rest.
  const countDuration = 1.0;
  const countProgress = Math.min(localT / countDuration, 1);
  const eased = easeOutExpo(countProgress);
  const displayValue = Math.round(value * eased);

  // Entrance / exit fade
  const inOpacity = interpolate(localT, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });
  const outOpacity = interpolate(t, [endTime - 0.4, endTime], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = inOpacity * outOpacity;

  return (
    <AbsoluteFill style={{ opacity }}>
      <ThreeCanvas width={1920} height={1080}>
        <color attach="background" args={[CHARCOAL]} />
        <SceneLights accent={accent} />
        <BarChartMesh value={value} accent={accent} progress={eased} />
      </ThreeCanvas>

      {/* HTML overlay: big number + label */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: 200,
          pointerEvents: 'none',
          fontFamily: FONT_STACK,
        }}
      >
        <div
          style={{
            color: accent,
            fontSize: 220,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: -8,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {displayValue}
          <span style={{ fontSize: 130, marginLeft: 4 }}>{suffix}</span>
        </div>
        <div
          style={{
            color: DIM,
            fontSize: 28,
            fontWeight: 500,
            marginTop: 24,
            letterSpacing: 4,
            textTransform: 'uppercase',
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          {label}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================================
// ComparisonBars3D — two bars side by side
// ============================================================================
const ComparisonBarsMesh: React.FC<{
  leftValue: number;
  rightValue: number;
  leftAccent: string;
  rightAccent: string;
  progress: number;
}> = ({ leftValue, rightValue, leftAccent, rightAccent, progress }) => {
  const leftHeight = ((leftValue / 100) * 4) * progress;
  const rightHeight = ((rightValue / 100) * 4) * progress;

  return (
    <group position={[0, -2, 0]}>
      {/* Left bar */}
      <group position={[-1.6, 0, 0]}>
        <mesh position={[0, 4 / 2, -0.05]}>
          <boxGeometry args={[1.3, 4, 0.18]} />
          <meshStandardMaterial color="#1A1A20" roughness={0.9} metalness={0.0} />
        </mesh>
        <mesh position={[0, leftHeight / 2, 0]}>
          <boxGeometry args={[1.3, Math.max(leftHeight, 0.01), 0.4]} />
          <meshStandardMaterial color={leftAccent} roughness={0.42} metalness={0.15} emissive={leftAccent} emissiveIntensity={0.06} />
        </mesh>
      </group>
      {/* Right bar */}
      <group position={[1.6, 0, 0]}>
        <mesh position={[0, 4 / 2, -0.05]}>
          <boxGeometry args={[1.3, 4, 0.18]} />
          <meshStandardMaterial color="#1A1A20" roughness={0.9} metalness={0.0} />
        </mesh>
        <mesh position={[0, rightHeight / 2, 0]}>
          <boxGeometry args={[1.3, Math.max(rightHeight, 0.01), 0.4]} />
          <meshStandardMaterial color={rightAccent} roughness={0.42} metalness={0.15} emissive={rightAccent} emissiveIntensity={0.06} />
        </mesh>
      </group>
    </group>
  );
};

export const ComparisonBars3D: React.FC<{
  startTime: number;
  endTime: number;
  left: { value: number; suffix: string; label: string };
  right: { value: number; suffix: string; label: string };
  accent: string;
}> = ({ startTime, endTime, left, right, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < startTime || t > endTime) return null;

  const localT = t - startTime;
  const countDuration = 1.2;
  const countProgress = Math.min(localT / countDuration, 1);
  const eased = easeOutExpo(countProgress);
  const leftDisplay = Math.round(left.value * eased);
  const rightDisplay = Math.round(right.value * eased);

  // Two accents: keep the right bar in muted DIM for contrast (rule: Mono+1)
  // We bend the rule slightly here because the comparison REQUIRES two colors
  // to read at all. Use accent + DIM-gray.
  const leftAccent = accent;
  const rightAccent = '#52525B';

  const inOpacity = interpolate(localT, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });
  const outOpacity = interpolate(t, [endTime - 0.4, endTime], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = inOpacity * outOpacity;

  return (
    <AbsoluteFill style={{ opacity }}>
      <ThreeCanvas width={1920} height={1080}>
        <color attach="background" args={[CHARCOAL]} />
        <SceneLights accent={accent} />
        <ComparisonBarsMesh
          leftValue={left.value}
          rightValue={right.value}
          leftAccent={leftAccent}
          rightAccent={rightAccent}
          progress={eased}
        />
      </ThreeCanvas>

      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-around',
          paddingTop: 140,
          pointerEvents: 'none',
          fontFamily: FONT_STACK,
        }}
      >
        {/* Left column */}
        <div style={{ textAlign: 'center', width: 480 }}>
          <div style={{ color: leftAccent, fontSize: 180, fontWeight: 700, lineHeight: 1, letterSpacing: -6, fontVariantNumeric: 'tabular-nums' }}>
            {leftDisplay}<span style={{ fontSize: 110, marginLeft: 4 }}>{left.suffix}</span>
          </div>
          <div style={{ color: TEXT, fontSize: 26, fontWeight: 500, marginTop: 20, letterSpacing: 3, textTransform: 'uppercase' }}>
            {left.label}
          </div>
        </div>

        {/* Right column */}
        <div style={{ textAlign: 'center', width: 480 }}>
          <div style={{ color: '#71717A', fontSize: 180, fontWeight: 700, lineHeight: 1, letterSpacing: -6, fontVariantNumeric: 'tabular-nums' }}>
            {rightDisplay}<span style={{ fontSize: 110, marginLeft: 4 }}>{right.suffix}</span>
          </div>
          <div style={{ color: DIM, fontSize: 26, fontWeight: 500, marginTop: 20, letterSpacing: 3, textTransform: 'uppercase' }}>
            {right.label}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================================
// Clock3D — torus ring with a sweep arm rotating to indicate seconds
// ============================================================================
const ClockMesh: React.FC<{ accent: string; sweepProgress: number }> = ({ accent, sweepProgress }) => {
  // Sweep arm rotation: 0 → -2π over the duration (clockwise from 12 o'clock)
  const rotation = -sweepProgress * Math.PI * 2;

  return (
    <group position={[0, 0, 0]}>
      {/* Clock face (back disc) */}
      <mesh position={[0, 0, -0.05]}>
        <cylinderGeometry args={[2.6, 2.6, 0.08, 64]} />
        <meshStandardMaterial color="#16161B" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Outer ring */}
      <mesh>
        <torusGeometry args={[2.6, 0.06, 12, 96]} />
        <meshStandardMaterial color="#27272A" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Filled progress ring (using torus rotated to represent progress) */}
      {/* Sweep arm */}
      <group rotation={[0, 0, rotation]}>
        <mesh position={[0, 1.1, 0.05]}>
          <boxGeometry args={[0.12, 2.2, 0.12]} />
          <meshStandardMaterial color={accent} roughness={0.4} metalness={0.2} emissive={accent} emissiveIntensity={0.18} />
        </mesh>
        {/* Tip dot */}
        <mesh position={[0, 2.2, 0.08]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color={accent} roughness={0.3} metalness={0.3} emissive={accent} emissiveIntensity={0.35} />
        </mesh>
      </group>
      {/* Center hub */}
      <mesh position={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.18, 0.18, 0.12, 32]} />
        <meshStandardMaterial color={accent} roughness={0.4} metalness={0.3} emissive={accent} emissiveIntensity={0.2} />
      </mesh>
      {/* Tick marks at 12, 3, 6, 9 */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * 2.35, Math.cos(a) * 2.35, 0]}>
          <boxGeometry args={[0.06, 0.22, 0.06]} />
          <meshStandardMaterial color="#52525B" />
        </mesh>
      ))}
    </group>
  );
};

export const Clock3D: React.FC<{
  startTime: number;
  endTime: number;
  totalSeconds: number;
  label: string;
  accent: string;
}> = ({ startTime, endTime, totalSeconds, label, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < startTime || t > endTime) return null;

  const localT = t - startTime;
  const sweepDuration = Math.min(2.0, (endTime - startTime) * 0.7);
  const sweepProgress = Math.min(localT / sweepDuration, 1);
  const eased = easeOutExpo(sweepProgress);
  const displaySeconds = Math.round(totalSeconds * eased);

  const inOpacity = interpolate(localT, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });
  const outOpacity = interpolate(t, [endTime - 0.4, endTime], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = inOpacity * outOpacity;

  return (
    <AbsoluteFill style={{ opacity }}>
      <ThreeCanvas width={1920} height={1080}>
        <color attach="background" args={[CHARCOAL]} />
        <SceneLights accent={accent} />
        <ClockMesh accent={accent} sweepProgress={eased} />
      </ThreeCanvas>

      {/* HTML: large seconds count below the clock + label */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: 130,
          pointerEvents: 'none',
          fontFamily: FONT_STACK,
        }}
      >
        <div
          style={{
            color: accent,
            fontSize: 140,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: -4,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {displaySeconds}<span style={{ fontSize: 80, marginLeft: 4 }}>s</span>
        </div>
        <div
          style={{
            color: DIM,
            fontSize: 28,
            fontWeight: 500,
            marginTop: 18,
            letterSpacing: 3,
            textTransform: 'uppercase',
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          {label}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================================
// StackedFramework3D — N cards stacking, each appearing one at a time
// ============================================================================
const StackedCardsMesh: React.FC<{
  items: string[];
  perItemReveal: number; // 0..1 reveal per item, sequenced
  accent: string;
}> = ({ items, perItemReveal, accent }) => {
  // Total cards: each appears at i/N..(i+1)/N of overall progress
  return (
    <group position={[0, 0, 0]}>
      {items.map((label, i) => {
        const t0 = i / items.length;
        const t1 = (i + 1) / items.length;
        const localProgress = Math.max(0, Math.min(1, (perItemReveal - t0) / (t1 - t0)));
        if (localProgress <= 0) return null;
        const eased = easeOutExpo(localProgress);
        // Cards stack bottom to top: card i at y = i * spacing
        const spacing = 0.85;
        const targetY = (i - (items.length - 1) / 2) * spacing;
        const startY = targetY + 2.5; // enters from above
        const y = startY + (targetY - startY) * eased;
        const opacity = eased;
        return (
          <mesh key={i} position={[0, y, 0]}>
            <boxGeometry args={[4.5, 0.7, 0.3]} />
            <meshStandardMaterial
              color={i === 0 || i === items.length - 1 ? accent : '#1A1A20'}
              roughness={0.5}
              metalness={0.15}
              transparent
              opacity={opacity}
              emissive={i === 0 || i === items.length - 1 ? accent : '#000000'}
              emissiveIntensity={i === 0 || i === items.length - 1 ? 0.1 : 0}
            />
          </mesh>
        );
      })}
    </group>
  );
};

export const StackedFramework3D: React.FC<{
  startTime: number;
  endTime: number;
  items: string[];
  accent: string;
}> = ({ startTime, endTime, items, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < startTime || t > endTime) return null;

  const localT = t - startTime;
  const buildDuration = Math.min(2.4, (endTime - startTime) * 0.5);
  const overallProgress = Math.min(localT / buildDuration, 1);

  const inOpacity = interpolate(localT, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });
  const outOpacity = interpolate(t, [endTime - 0.5, endTime], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = inOpacity * outOpacity;

  return (
    <AbsoluteFill style={{ opacity }}>
      <ThreeCanvas width={1920} height={1080}>
        <color attach="background" args={[CHARCOAL]} />
        <SceneLights accent={accent} />
        <StackedCardsMesh items={items} perItemReveal={overallProgress} accent={accent} />
      </ThreeCanvas>

      {/* HTML labels overlaid at the position of each card. Bottom-to-top
          matches Three.js Y; convert by computing vertical fraction. */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          pointerEvents: 'none',
          fontFamily: FONT_STACK,
        }}
      >
        {/* Render labels in REVERSE order: top label = last item, since
            Three.js Y axis points up and we stack bottom-to-top in 3D */}
        {[...items].reverse().map((label, idx) => {
          const i = items.length - 1 - idx;
          const t0 = i / items.length;
          const t1 = (i + 1) / items.length;
          const localProgress = Math.max(0, Math.min(1, (overallProgress - t0) / (t1 - t0)));
          if (localProgress <= 0) return <div key={i} style={{ height: 90 }} />;
          const eased = easeOutExpo(localProgress);
          return (
            <div
              key={i}
              style={{
                height: 90,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: eased,
                color: i === 0 || i === items.length - 1 ? '#0A0A0F' : TEXT,
                fontSize: 56,
                fontWeight: 700,
                letterSpacing: 4,
                textTransform: 'uppercase',
              }}
            >
              {label}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
