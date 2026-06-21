import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const FONT_STACK = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';

// ----------------------------------------------------------------------------
// KenBurnsImage — slow zoom/pan + vignette + brand tint for cinematic feel
// ----------------------------------------------------------------------------
type KenBurnsDirection = 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right';

export const KenBurnsImage: React.FC<{
  src: string;
  durationInFrames: number;
  direction?: KenBurnsDirection;
  brightness?: number;
  contrast?: number;
  saturate?: number;
  tintColor?: string;
  tintOpacity?: number;
  vignetteStrength?: number;
}> = ({
  src,
  durationInFrames,
  direction = 'zoom-in',
  brightness = 0.6,
  contrast = 1.2,
  saturate = 1.15,
  tintColor = '#1e1b4b',
  tintOpacity = 0.18,
  vignetteStrength = 0.55,
}) => {
  const frame = useCurrentFrame();
  const progress = Math.min(frame / durationInFrames, 1);

  let scale = 1;
  let tx = 0;
  let ty = 0;

  switch (direction) {
    case 'zoom-in':
      scale = interpolate(progress, [0, 1], [1.05, 1.22]);
      break;
    case 'zoom-out':
      scale = interpolate(progress, [0, 1], [1.22, 1.05]);
      break;
    case 'pan-left':
      scale = 1.15;
      tx = interpolate(progress, [0, 1], [5, -5]);
      break;
    case 'pan-right':
      scale = 1.15;
      tx = interpolate(progress, [0, 1], [-5, 5]);
      break;
  }

  const resolved = /^(https?:)?\/\//.test(src) ? src : staticFile(src);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: '#000' }}>
      <Img
        src={resolved}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translate(${tx}%, ${ty}%)`,
          filter: `brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`,
        }}
      />
      {/* Brand color tint */}
      <AbsoluteFill
        style={{
          background: tintColor,
          opacity: tintOpacity,
          mixBlendMode: 'color',
        }}
      />
      {/* Vignette for cinematic darkening of edges */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,${vignetteStrength}) 100%)`,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

// ----------------------------------------------------------------------------
// ParticleBurst — SVG particles fanning out from a center point
// ----------------------------------------------------------------------------
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const ParticleBurst: React.FC<{
  startTime: number;
  durationSeconds?: number;
  color: string;
  particleCount?: number;
  size?: number;
  position: { left?: string; right?: string; top?: string; bottom?: string };
}> = ({ startTime, durationSeconds = 0.8, color, particleCount = 24, size = 320, position }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < startTime || t > startTime + durationSeconds) return null;

  const progress = (t - startTime) / durationSeconds;

  return (
    <div
      style={{
        position: 'absolute',
        ...position,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        pointerEvents: 'none',
      }}
    >
      <svg width={size} height={size} style={{ overflow: 'visible' }}>
        {Array.from({ length: particleCount }).map((_, i) => {
          const angle = (i / particleCount) * Math.PI * 2 + seededRandom(i + 1) * 0.4;
          const speed = 0.6 + seededRandom(i + 100) * 0.6;
          const distance = progress * size * 0.5 * speed;
          const x = size / 2 + Math.cos(angle) * distance;
          const y = size / 2 + Math.sin(angle) * distance;
          const opacity = interpolate(progress, [0, 0.2, 1], [0, 1, 0]);
          const r = interpolate(progress, [0, 0.3, 1], [10, 6, 2]);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={r}
              fill={color}
              opacity={opacity}
            />
          );
        })}
      </svg>
    </div>
  );
};

// ----------------------------------------------------------------------------
// ColorFlash — full-screen color overlay flash on key beats
// ----------------------------------------------------------------------------
export const ColorFlash: React.FC<{
  startTime: number;
  color: string;
  intensity?: number;
  durationFrames?: number;
}> = ({ startTime, color, intensity = 0.35, durationFrames = 6 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = startTime * fps;
  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame > durationFrames) return null;

  const opacity = interpolate(
    localFrame,
    [0, 2, durationFrames],
    [0, intensity, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill
      style={{
        background: color,
        opacity,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
    />
  );
};

// ----------------------------------------------------------------------------
// CameraShake — wraps children with translation/rotation noise at given moments
// ----------------------------------------------------------------------------
export const CameraShake: React.FC<{
  shakeMoments: number[]; // seconds
  intensity?: number;
  durationFrames?: number;
  children: React.ReactNode;
}> = ({ shakeMoments, intensity = 6, durationFrames = 8, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Find the closest shake moment
  let activeIntensity = 0;
  for (const moment of shakeMoments) {
    const dt = (t - moment) * fps;
    if (dt >= 0 && dt <= durationFrames) {
      const falloff = 1 - dt / durationFrames;
      activeIntensity = Math.max(activeIntensity, falloff);
    }
  }

  const noiseX = (seededRandom(frame) - 0.5) * 2 * intensity * activeIntensity;
  const noiseY = (seededRandom(frame + 500) - 0.5) * 2 * intensity * activeIntensity;
  const noiseRot = (seededRandom(frame + 1000) - 0.5) * 1 * activeIntensity;

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${noiseX}px, ${noiseY}px) rotate(${noiseRot}deg)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// ----------------------------------------------------------------------------
// KaraokeCaption — word-by-word highlight synced to TTS timestamps
// ----------------------------------------------------------------------------
export type Word = { word: string; start: number; end: number };

function chunkWords(words: Word[], maxPerChunk = 7): Word[][] {
  const chunks: Word[][] = [];
  let current: Word[] = [];
  for (const w of words) {
    current.push(w);
    const endsWithPunct = /[.,!?;:]$/.test(w.word);
    if (current.length >= maxPerChunk || endsWithPunct) {
      chunks.push(current);
      current = [];
    }
  }
  if (current.length) chunks.push(current);
  return chunks;
}

export type CaptionPosition = 'top' | 'bottom' | 'hidden';

export const KaraokeCaption: React.FC<{
  words: Word[];
  startTime: number;
  endTime: number;
  color: string;
  highlightColor?: string;
  position?: CaptionPosition;
}> = ({
  words,
  startTime,
  endTime,
  color,
  highlightColor = '#fde047',
  position = 'bottom',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  if (position === 'hidden' || t < startTime || t > endTime) return null;

  const visibleWords = words.filter((w) => w.start >= startTime - 0.01 && w.end <= endTime + 0.5);
  const chunks = chunkWords(visibleWords, 6);

  let activeChunk: Word[] | null = null;
  for (const chunk of chunks) {
    const cStart = chunk[0].start;
    const cEnd = chunk[chunk.length - 1].end;
    if (t >= cStart - 0.15 && t <= cEnd + 0.4) {
      activeChunk = chunk;
      break;
    }
  }
  if (!activeChunk) return null;

  const isTop = position === 'top';

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: isTop ? 'flex-start' : 'flex-end',
        justifyContent: 'center',
        paddingTop: isTop ? 80 : 0,
        paddingBottom: isTop ? 0 : 110,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '0 16px',
          maxWidth: 1500,
          padding: '0 36px',
        }}
      >
        {activeChunk.map((w, i) => {
          // Per-word entrance: spring at word.start
          const localFrame = (t - w.start) * fps;
          const entranceSpring = spring({
            frame: Math.max(0, localFrame + 4), // start slightly before spoken
            fps,
            config: { damping: 12, stiffness: 200, mass: 0.5 },
          });
          const isActive = t >= w.start - 0.03 && t <= w.end + 0.05;
          const hasStarted = t >= w.start - 0.2;
          const wordOpacity = hasStarted ? entranceSpring : 0;
          const translateY = interpolate(entranceSpring, [0, 1], [22, 0]);
          const scaleBoost = isActive ? 1.08 : 1;
          return (
            <span
              key={i}
              style={{
                fontFamily: FONT_STACK,
                fontSize: 62,
                fontWeight: 900,
                color: isActive ? highlightColor : '#ffffff',
                opacity: wordOpacity,
                transform: `translateY(${translateY}px) scale(${scaleBoost})`,
                textShadow: '0 4px 16px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.6)',
                letterSpacing: -0.5,
                WebkitTextStroke: isActive ? `1px ${highlightColor}` : '1px rgba(0,0,0,0.5)',
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ----------------------------------------------------------------------------
// LabeledCallout — chip with label that springs in at a position
// ----------------------------------------------------------------------------
export const LabeledCallout: React.FC<{
  label: string;
  startTime: number;
  durationSeconds: number;
  position: { left?: string; right?: string; top?: string; bottom?: string };
  color: string;
  icon?: string;
}> = ({ label, startTime, durationSeconds, position, color, icon }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const endTime = startTime + durationSeconds;
  if (t < startTime || t > endTime + 0.4) return null;

  const localFrame = (t - startTime) * fps;
  const inSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.6 },
  });
  const outFade = interpolate(
    t,
    [endTime, endTime + 0.4],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const translateY = interpolate(inSpring, [0, 1], [18, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        ...position,
        opacity: inSpring * outFade,
        transform: `translateY(${translateY}px) scale(${0.92 + inSpring * 0.08})`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 24px',
        background: color,
        color: '#0f0f0f',
        borderRadius: 999,
        fontFamily: FONT_STACK,
        fontSize: 28,
        fontWeight: 700,
        letterSpacing: 0.3,
        boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
        whiteSpace: 'nowrap',
      }}
    >
      {icon && <span style={{ fontSize: 32 }}>{icon}</span>}
      <span>{label}</span>
    </div>
  );
};

// ----------------------------------------------------------------------------
// KeyPointCard — floating card with title + bullets, slide-in
// ----------------------------------------------------------------------------
export const KeyPointCard: React.FC<{
  title: string;
  bullets: string[];
  startTime: number;
  durationSeconds: number;
  position: { left?: string; right?: string; top?: string; bottom?: string };
  color: string;
}> = ({ title, bullets, startTime, durationSeconds, position, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const endTime = startTime + durationSeconds;
  if (t < startTime || t > endTime + 0.5) return null;

  const localFrame = (t - startTime) * fps;
  const inSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 90, mass: 0.7 },
  });
  const outFade = interpolate(t, [endTime, endTime + 0.5], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateX = interpolate(inSpring, [0, 1], [40, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        ...position,
        opacity: inSpring * outFade,
        transform: `translateX(${translateX}px)`,
        width: 480,
        padding: '28px 32px',
        background: 'rgba(15,15,15,0.92)',
        borderLeft: `5px solid ${color}`,
        borderRadius: 14,
        boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
        fontFamily: FONT_STACK,
      }}
    >
      <div
        style={{
          color,
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        Key Point
      </div>
      <div
        style={{
          color: '#ffffff',
          fontSize: 32,
          fontWeight: 700,
          marginBottom: bullets.length ? 18 : 0,
          lineHeight: 1.15,
        }}
      >
        {title}
      </div>
      {bullets.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {bullets.map((b, i) => {
            const itemDelay = (i + 1) * 0.18;
            const itemFrame = (t - startTime - itemDelay) * fps;
            const itemSpring = spring({
              frame: Math.max(0, itemFrame),
              fps,
              config: { damping: 14, stiffness: 110 },
            });
            return (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  color: '#e5e5e5',
                  fontSize: 22,
                  fontWeight: 500,
                  marginTop: i > 0 ? 12 : 0,
                  opacity: itemSpring,
                  transform: `translateX(${interpolate(itemSpring, [0, 1], [10, 0])}px)`,
                }}
              >
                <span style={{ color, fontWeight: 800, fontSize: 24, lineHeight: 1 }}>•</span>
                <span>{b}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------
// CountUpNumber — animated 0→N count with optional suffix and label
// ----------------------------------------------------------------------------
export const CountUpNumber: React.FC<{
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

  const countDuration = Math.min(1.2, durationSeconds * 0.6);
  const progress = interpolate(
    t,
    [startTime, startTime + countDuration],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const eased = 1 - Math.pow(1 - progress, 3);
  const current = Math.round(target * eased);

  const localFrame = (t - startTime) * fps;
  const inSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.6 },
  });
  const outFade = interpolate(t, [endTime, endTime + 0.4], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        ...position,
        opacity: inSpring * outFade,
        transform: `scale(${0.85 + inSpring * 0.15})`,
        textAlign: 'center',
        fontFamily: FONT_STACK,
      }}
    >
      <div
        style={{
          color,
          fontSize: 200,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: -6,
          textShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        {current}
        <span style={{ fontSize: 110, marginLeft: 4 }}>{suffix}</span>
      </div>
      {label && (
        <div
          style={{
            color: '#ffffff',
            fontSize: 30,
            fontWeight: 600,
            marginTop: 8,
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------
// SceneTitleCard — big "Part N" slate between sections
// ----------------------------------------------------------------------------
export const SceneTitleCard: React.FC<{
  number: string;
  title: string;
  color: string;
}> = ({ number, title, color }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const inSpring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 110, mass: 0.7 },
  });
  const outFade = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const numberY = interpolate(inSpring, [0, 1], [40, 0]);
  const titleX = interpolate(inSpring, [0, 1], [-40, 0]);

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: outFade,
        fontFamily: FONT_STACK,
      }}
    >
      <div
        style={{
          color,
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: 8,
          textTransform: 'uppercase',
          opacity: inSpring,
          transform: `translateY(${numberY}px)`,
          marginBottom: 28,
        }}
      >
        {number}
      </div>
      <div
        style={{
          width: 80,
          height: 4,
          background: color,
          borderRadius: 2,
          opacity: inSpring,
          marginBottom: 28,
        }}
      />
      <div
        style={{
          color: '#ffffff',
          fontSize: 120,
          fontWeight: 900,
          letterSpacing: -3,
          opacity: inSpring,
          transform: `translateX(${titleX}px)`,
          lineHeight: 1,
        }}
      >
        {title}
      </div>
    </AbsoluteFill>
  );
};

// ----------------------------------------------------------------------------
// HookTitleCard — opening card for the video
// ----------------------------------------------------------------------------
export const HookTitleCard: React.FC<{
  title: string;
  subtitle: string;
  color: string;
}> = ({ title, subtitle, color }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 90 },
  });
  const subSpring = spring({
    frame: Math.max(0, frame - 12),
    fps,
    config: { damping: 18, stiffness: 90 },
  });
  const outFade = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0a 70%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: outFade,
        fontFamily: FONT_STACK,
      }}
    >
      <div
        style={{
          width: interpolate(titleSpring, [0, 1], [0, 88]),
          height: 5,
          background: color,
          borderRadius: 3,
          marginBottom: 40,
        }}
      />
      <h1
        style={{
          color: '#ffffff',
          fontSize: 88,
          fontWeight: 900,
          textAlign: 'center',
          margin: 0,
          maxWidth: 1300,
          lineHeight: 1.05,
          letterSpacing: -2,
          opacity: titleSpring,
          transform: `translateY(${interpolate(titleSpring, [0, 1], [30, 0])}px)`,
        }}
      >
        {title}
      </h1>
      <p
        style={{
          color: 'rgba(255,255,255,0.65)',
          fontSize: 30,
          fontWeight: 500,
          marginTop: 28,
          letterSpacing: 1,
          textTransform: 'uppercase',
          opacity: subSpring,
        }}
      >
        {subtitle}
      </p>
    </AbsoluteFill>
  );
};
