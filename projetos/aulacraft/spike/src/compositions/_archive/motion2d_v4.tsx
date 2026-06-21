import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { PALETTE_ARR, BG_GRADIENT_STOPS } from './palette';
import type { Word } from './motion';

// Deterministic pseudo-random
function rand(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// ----------------------------------------------------------------------------
// AnimatedBackground — vivid gradient + floating SVG blobs, always moving
// ----------------------------------------------------------------------------
export const AnimatedBackground: React.FC<{
  hueRotateSpeed?: number; // degrees per second
  blobCount?: number;
  opacity?: number;
}> = ({ hueRotateSpeed = 8, blobCount = 14, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const hue = (t * hueRotateSpeed) % 360;

  // Build a multi-stop conic gradient that's hue-rotated
  const stops = BG_GRADIENT_STOPS.map((c, i) => {
    const pct = (i / (BG_GRADIENT_STOPS.length - 1)) * 100;
    return `${c} ${pct}%`;
  }).join(', ');

  return (
    <AbsoluteFill style={{ opacity, overflow: 'hidden' }}>
      {/* Base gradient with continuous hue rotation */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, ${stops})`,
          filter: `hue-rotate(${hue}deg) saturate(1.4)`,
        }}
      />

      {/* Darken slightly so foreground content reads */}
      <AbsoluteFill
        style={{ background: 'rgba(15,15,30,0.45)' }}
      />

      {/* Floating SVG blobs */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <filter id="blob-blur">
            <feGaussianBlur stdDeviation="30" />
          </filter>
        </defs>
        {Array.from({ length: blobCount }).map((_, i) => {
          const seed = i * 31.7 + 1;
          const baseX = rand(seed) * 1920;
          const baseY = rand(seed + 1) * 1080;
          const r = 80 + rand(seed + 2) * 180;
          const driftSpeed = 0.3 + rand(seed + 3) * 0.4;
          const orbitR = 80 + rand(seed + 4) * 140;
          const phase = rand(seed + 5) * Math.PI * 2;
          const x = baseX + Math.cos(t * driftSpeed + phase) * orbitR;
          const y = baseY + Math.sin(t * driftSpeed * 0.8 + phase) * orbitR;
          const color = PALETTE_ARR[i % PALETTE_ARR.length];
          const op = 0.4 + 0.2 * Math.sin(t + i);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={r}
              fill={color}
              opacity={op}
              filter="url(#blob-blur)"
              style={{ mixBlendMode: 'screen' }}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ----------------------------------------------------------------------------
// PerWordPulse — every spoken word triggers a subtle global color pulse
// ----------------------------------------------------------------------------
export const PerWordPulse: React.FC<{
  words: Word[];
  startTime: number;
  endTime: number;
  intensity?: number;
}> = ({ words, startTime, endTime, intensity = 0.18 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < startTime || t > endTime) return null;

  // Find the currently-active word (or just-spoken)
  let activeIdx = -1;
  for (let i = 0; i < words.length; i++) {
    if (t >= words[i].start && t <= words[i].start + 0.15) {
      activeIdx = i;
      break;
    }
  }
  if (activeIdx === -1) return null;

  const localT = t - words[activeIdx].start;
  const flashOpacity = interpolate(localT, [0, 0.05, 0.15], [0, intensity, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const color = PALETTE_ARR[activeIdx % PALETTE_ARR.length];

  return (
    <AbsoluteFill
      style={{
        background: color,
        opacity: flashOpacity,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
    />
  );
};

// ----------------------------------------------------------------------------
// AudioWaveform — vivid bars at bottom that pulse with whether a word is being spoken
// ----------------------------------------------------------------------------
export const AudioWaveform: React.FC<{
  words: Word[];
  position?: 'top' | 'bottom';
  barCount?: number;
  height?: number;
}> = ({ words, position = 'bottom', barCount = 60, height = 80 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Find any word active at this time
  const currentWord = words.find((w) => t >= w.start && t <= w.end);
  const isActive = !!currentWord;

  // Determine activity level: high when word being spoken, low between
  const baseActivity = isActive ? 0.9 : 0.15;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        [position]: 0,
        height,
        display: 'flex',
        alignItems: position === 'bottom' ? 'flex-end' : 'flex-start',
        justifyContent: 'space-between',
        padding: '0 4%',
        pointerEvents: 'none',
        gap: 4,
      }}
    >
      {Array.from({ length: barCount }).map((_, i) => {
        const phase = (i / barCount) * Math.PI * 4 + t * 6;
        const noise = (Math.sin(phase) * 0.5 + 0.5) * baseActivity;
        const barH = Math.max(6, noise * height * 1.2);
        const color = PALETTE_ARR[i % PALETTE_ARR.length];
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: barH,
              background: `linear-gradient(${position === 'bottom' ? 'to top' : 'to bottom'}, ${color} 0%, ${color}aa 100%)`,
              borderRadius: 3,
              opacity: 0.85,
              boxShadow: `0 0 12px ${color}aa`,
            }}
          />
        );
      })}
    </div>
  );
};

// ----------------------------------------------------------------------------
// SceneWipeTransition — colorful diagonal wipe between scenes
// ----------------------------------------------------------------------------
export const SceneWipeTransition: React.FC<{
  startTime: number;
  durationSeconds?: number;
  color?: string;
}> = ({ startTime, durationSeconds = 0.6, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < startTime || t > startTime + durationSeconds) return null;

  const progress = (t - startTime) / durationSeconds;
  const wipeColor = color ?? PALETTE_ARR[Math.floor(t * 2) % PALETTE_ARR.length];

  // Two diagonal panels that slide across and out
  const x1 = interpolate(progress, [0, 0.5, 1], [-120, 0, 120]);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(105deg, transparent ${40 - x1}%, ${wipeColor} ${50 - x1}%, ${wipeColor} ${60 - x1}%, transparent ${70 - x1}%)`,
          boxShadow: `0 0 60px ${wipeColor}`,
        }}
      />
    </AbsoluteFill>
  );
};
