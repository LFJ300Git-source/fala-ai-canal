import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const FONT_STACK = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
const TEXT = '#F5F5F7';
const DIM = '#A1A1AA';
const HAIRLINE = '#27272A';

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

// ============================================================================
// PhraseTypography — large display text on charcoal, optional emphasis word
// ============================================================================
export const PhraseTypography: React.FC<{
  startTime: number;
  endTime: number;
  text: string;
  emphasis?: string;
  accent: string;
}> = ({ startTime, endTime, text, emphasis, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < startTime || t > endTime) return null;

  const localT = t - startTime;
  const entranceProgress = Math.min(localT / 0.5, 1);
  const eased = easeOutExpo(entranceProgress);
  const translateY = (1 - eased) * 14;

  const outOpacity = interpolate(t, [endTime - 0.4, endTime], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = eased * outOpacity;

  // Build the text, applying accent color to the emphasis word if present
  const renderText = () => {
    if (!emphasis) return text;
    const lowerText = text.toLowerCase();
    const lowerEmph = emphasis.toLowerCase();
    const idx = lowerText.indexOf(lowerEmph);
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const word = text.slice(idx, idx + emphasis.length);
    const after = text.slice(idx + emphasis.length);
    return (
      <>
        {before}
        <span style={{ color: accent }}>{word}</span>
        {after}
      </>
    );
  };

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '15% 12%',
        opacity,
        fontFamily: FONT_STACK,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          color: TEXT,
          fontSize: 130,
          fontWeight: 700,
          letterSpacing: -3,
          lineHeight: 1.05,
          textAlign: 'center',
          maxWidth: 1500,
        }}
      >
        {renderText()}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// KeyPointCardV5 — sober card with hairline border in accent, title + bullets
// ============================================================================
export const KeyPointCardV5: React.FC<{
  startTime: number;
  endTime: number;
  title: string;
  bullets: string[];
  accent: string;
}> = ({ startTime, endTime, title, bullets, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < startTime || t > endTime) return null;

  const localT = t - startTime;
  const entrance = easeOutExpo(Math.min(localT / 0.5, 1));
  const translateY = (1 - entrance) * 16;
  const outOpacity = interpolate(t, [endTime - 0.4, endTime], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = entrance * outOpacity;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12% 15%',
        opacity,
        fontFamily: FONT_STACK,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1200,
          padding: '64px 80px',
          background: 'rgba(20,20,24,0.85)',
          border: `1px solid ${HAIRLINE}`,
          borderLeft: `4px solid ${accent}`,
          borderRadius: 6,
        }}
      >
        <div
          style={{
            color: accent,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: 'uppercase',
            marginBottom: 28,
          }}
        >
          Key Point
        </div>
        <div
          style={{
            color: TEXT,
            fontSize: 78,
            fontWeight: 700,
            letterSpacing: -1.5,
            lineHeight: 1.08,
            marginBottom: bullets.length ? 44 : 0,
          }}
        >
          {title}
        </div>
        {bullets.length > 0 && (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {bullets.map((b, i) => {
              const itemDelay = 0.5 + i * 0.2;
              const itemProgress = easeOutExpo(Math.max(0, Math.min((localT - itemDelay) / 0.4, 1)));
              return (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 20,
                    color: DIM,
                    fontSize: 34,
                    fontWeight: 400,
                    lineHeight: 1.4,
                    marginTop: i > 0 ? 18 : 0,
                    opacity: itemProgress,
                    transform: `translateX(${(1 - itemProgress) * 12}px)`,
                  }}
                >
                  <span style={{ color: accent, fontSize: 28, lineHeight: 1.4, fontWeight: 700 }}>—</span>
                  <span>{b}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// LabeledCalloutV5 — small chip with hairline border in accent, centered text
// ============================================================================
export const LabeledCalloutV5: React.FC<{
  startTime: number;
  endTime: number;
  text: string;
  accent: string;
}> = ({ startTime, endTime, text, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < startTime || t > endTime) return null;

  const localT = t - startTime;
  const entrance = easeOutExpo(Math.min(localT / 0.45, 1));
  const translateY = (1 - entrance) * 14;
  const outOpacity = interpolate(t, [endTime - 0.4, endTime], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = entrance * outOpacity;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '15% 12%',
        opacity,
        fontFamily: FONT_STACK,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          padding: '36px 64px',
          background: 'rgba(20,20,24,0.7)',
          border: `1px solid ${accent}`,
          borderRadius: 999,
          color: TEXT,
          fontSize: 60,
          fontWeight: 600,
          letterSpacing: -0.5,
          textAlign: 'center',
          maxWidth: 1400,
          lineHeight: 1.15,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
