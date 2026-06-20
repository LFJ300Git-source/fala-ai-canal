import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { SceneFrame } from '../components/SceneFrame';
import { composeTheme } from '../theme';

// =====================================================================
// CANVA-STYLE TEMPLATE — fixed identity across all scenes
// =====================================================================

// Cohesive palette — NEVER changes per scene (this is the design discipline
// that's been missing). Accent for highlights can shift between magenta and teal,
// but base palette is fixed.
export const PALETTE = {
  navy: '#0A0A1A',
  navyLight: '#13132B',
  magenta: '#EC4899',
  magentaDeep: '#BE185D',
  purple: '#7C3AED',
  teal: '#14B8A6',
  cyan: '#22D3EE',
  white: '#F8FAFC',
  gray: '#94A3B8',
};

const SANS = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

// =====================================================================
// TopographicBackground — procedural wavy contour lines (Canva signature)
// =====================================================================
export const TopographicBackground: React.FC<{ color?: string }> = ({
  color = PALETTE.purple,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Generate concentric wavy paths — they drift slowly
  const paths = useMemo(() => {
    const lines: { d: string; opacity: number }[] = [];
    const numLines = 18;
    for (let i = 0; i < numLines; i++) {
      const baseRadius = 200 + i * 80;
      const wobble = 30 + (i % 3) * 20;
      const segments = 60;
      let d = '';
      for (let s = 0; s <= segments; s++) {
        const angle = (s / segments) * Math.PI * 2;
        const noise =
          Math.sin(angle * 3 + i * 0.5) * wobble * 0.6 +
          Math.cos(angle * 5 + i * 0.7) * wobble * 0.4;
        const r = baseRadius + noise;
        const x = 960 + Math.cos(angle) * r;
        const y = 540 + Math.sin(angle) * r * 0.85;
        d += s === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      }
      lines.push({ d, opacity: 0.08 + (i % 3) * 0.03 });
    }
    return lines;
  }, []);

  const drift = Math.sin(t * 0.2) * 5;
  const rotate = t * 0.4;

  return (
    <AbsoluteFill style={{ background: PALETTE.navy, overflow: 'hidden' }}>
      <svg
        width="1920"
        height="1080"
        viewBox="0 0 1920 1080"
        style={{
          position: 'absolute',
          inset: 0,
          transform: `rotate(${rotate}deg) translateX(${drift}px)`,
          transformOrigin: 'center',
        }}
      >
        {paths.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill="none"
            stroke={color}
            strokeWidth={1.2}
            opacity={p.opacity}
          />
        ))}
      </svg>
      {/* Subtle vignette */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

// =====================================================================
// AtmosphericBlobs — corner decoration (always present across all scenes)
// =====================================================================
export const AtmosphericBlobs: React.FC<{
  positions?: ('top-left' | 'top-right' | 'bottom-left' | 'bottom-right')[];
}> = ({ positions = ['top-right', 'bottom-left'] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const blobImages = ['blob_1.png', 'blob_2.png', 'blob_3.png'];

  const cornerStyle: Record<string, React.CSSProperties> = {
    'top-left': { top: '-15%', left: '-10%', width: 700, height: 700 },
    'top-right': { top: '-12%', right: '-12%', width: 750, height: 750 },
    'bottom-left': { bottom: '-15%', left: '-15%', width: 800, height: 800 },
    'bottom-right': { bottom: '-12%', right: '-10%', width: 700, height: 700 },
  };

  return (
    <>
      {positions.map((pos, i) => {
        const rotation = t * (i === 0 ? 4 : -3);
        const float = Math.sin(t * 0.4 + i) * 10;
        return (
          <div
            key={pos}
            style={{
              position: 'absolute',
              ...cornerStyle[pos],
              transform: `rotate(${rotation}deg) translateY(${float}px)`,
              mixBlendMode: 'screen',
              opacity: 0.85,
              pointerEvents: 'none',
            }}
          >
            <Img
              src={staticFile(blobImages[i % blobImages.length])}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        );
      })}
    </>
  );
};

// =====================================================================
// CaptionStrip — Canva-style with magenta period signature
// =====================================================================
export const CanvaCaption: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp' });
  const translateY = interpolate(easeOutExpo(Math.min(frame / 14, 1)), [0, 1], [12, 0]);

  // Inject magenta period at end (Canva signature)
  const cleaned = text.trim().replace(/[.!?]$/, '');

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '60px 130px 90px',
        background: 'linear-gradient(to top, rgba(10,10,26,0.95) 0%, rgba(10,10,26,0.4) 70%, transparent 100%)',
        opacity,
        transform: `translateY(${translateY}px)`,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          color: PALETTE.white,
          fontSize: 42,
          fontFamily: SANS,
          fontWeight: 500,
          lineHeight: 1.35,
          letterSpacing: -0.5,
          maxWidth: 1500,
          textShadow: '0 2px 16px rgba(0,0,0,0.8)',
        }}
      >
        {cleaned}
        <span style={{ color: PALETTE.magenta, marginLeft: 4 }}>.</span>
      </div>
    </div>
  );
};

// =====================================================================
// TitleScene — opening, light mode, theme-driven typography + chips
// Refactored to use <SceneFrame> for background, safe area, caption.
// All visual values come from theme/index (system + brand) — zero hardcoded.
// =====================================================================
export const CanvaTitleScene: React.FC<{
  title: string;
  subtitle?: string;
  entities?: { name: string; sublabel: string; color: string }[];
  caption: string;
}> = ({ title, subtitle, entities = [], caption }) => {
  const theme = composeTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring-based entrance: title at 0, subtitle delayed 4f, then chips staggered 4f each
  const titleSpring = spring({
    frame,
    fps,
    config: theme.motion.spring.gentle,
  });
  const subtitleSpring = spring({
    frame: frame - 4,
    fps,
    config: theme.motion.spring.gentle,
  });

  // Sublabel font size: bodySmall * 0.85, rounded UP
  const sublabelFontSize = Math.ceil(theme.fontSize.bodySmall * 0.85);

  return (
    <SceneFrame mode="light" caption={caption}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: theme.spacing.xl,
        }}
      >
        {/* TITLE */}
        <div
          style={{
            opacity: titleSpring,
            transform: `translateY(${(1 - titleSpring) * 20}px)`,
            fontFamily: theme.fonts.display,
            fontSize: theme.fontSize.displayHero,
            fontWeight: theme.fontWeight.semibold,
            lineHeight: theme.lineHeight.tight,
            color: theme.colors.textOnLight,
            letterSpacing: '-0.03em',
            textAlign: 'center',
            maxWidth: '80%',
          }}
        >
          {title}
        </div>

        {/* SUBTITLE (optional) */}
        {subtitle && (
          <div
            style={{
              opacity: subtitleSpring,
              transform: `translateY(${(1 - subtitleSpring) * 20}px)`,
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSize.display3,
              fontWeight: theme.fontWeight.regular,
              lineHeight: theme.lineHeight.snug,
              color: theme.colors.textOnLightMuted,
              letterSpacing: '-0.01em',
              textAlign: 'center',
              maxWidth: '70%',
            }}
          >
            {subtitle}
          </div>
        )}

        {/* ENTITY CHIPS (optional) — pill style with colored dot + name + sublabel */}
        {entities.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: theme.spacing.md,
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: theme.spacing.xl,
            }}
          >
            {entities.map((e, i) => {
              // Stagger: each chip enters 4 frames after the previous,
              // starting 8 frames after title (after subtitle has begun)
              const chipSpring = spring({
                frame: frame - (8 + i * 4),
                fps,
                config: theme.motion.spring.gentle,
              });
              return (
                <div
                  key={i}
                  style={{
                    opacity: chipSpring,
                    transform: `translateY(${(1 - chipSpring) * 12}px)`,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.xs,
                    padding: `${theme.spacing.sm}px ${theme.spacing.lg}px`,
                    borderRadius: theme.radius.pill,
                    border: '1px solid rgba(0,0,0,0.08)',
                    background: theme.colors.backgroundLight,
                  }}
                >
                  {/* Colored dot — uses entity.color from storyboard data */}
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: theme.radius.pill,
                      background: e.color,
                    }}
                  />
                  {/* Name */}
                  <span
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: theme.fontSize.bodySmall,
                      fontWeight: theme.fontWeight.semibold,
                      color: theme.colors.textOnLight,
                    }}
                  >
                    {e.name}
                  </span>
                  {/* Sublabel (if present) — smaller, secondary color */}
                  {e.sublabel && (
                    <span
                      style={{
                        fontFamily: theme.fonts.body,
                        fontSize: sublabelFontSize,
                        fontWeight: theme.fontWeight.regular,
                        color: theme.colors.textOnLightMuted,
                        marginLeft: theme.spacing.xs,
                      }}
                    >
                      {e.sublabel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SceneFrame>
  );
};

// =====================================================================
// AnnotatedHeartScene — heart illustration + pin labels with leader lines
// =====================================================================
type Annotation = { label: string; x: string; y: string; anchor: 'left' | 'right' };

export const CanvaAnnotatedHeartScene: React.FC<{
  imageSrc: string; // 'heart_anatomy.png' or 'heart_lungs.png'
  annotations: Annotation[];
  caption: string;
}> = ({ imageSrc, annotations, caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const imgProgress = easeOutExpo(Math.min(frame / (0.6 * fps), 1));

  return (
    <AbsoluteFill>
      <TopographicBackground color={PALETTE.purple} />
      <AtmosphericBlobs positions={['top-right', 'bottom-left']} />

      {/* Heart illustration — asymmetric placement, slightly to one side */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: 200,
        }}
      >
        <div
          style={{
            width: 720,
            height: 720,
            opacity: imgProgress,
            transform: `scale(${0.92 + imgProgress * 0.08})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Glow under the heart */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at center, ${PALETTE.magenta}55 0%, transparent 60%)`,
              filter: 'blur(40px)',
            }}
          />
          <Img
            src={staticFile(imageSrc)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              position: 'relative',
              filter: 'drop-shadow(0 16px 48px rgba(236,72,153,0.25))',
            }}
          />
        </div>
      </AbsoluteFill>

      {/* Pin annotations — Canva style: small label with pin connected by line */}
      {annotations.map((ann, i) => {
        const delay = 0.7 + i * 0.22;
        const p = easeOutExpo(Math.max(0, Math.min((frame - delay * fps) / (0.4 * fps), 1)));
        const isLeft = ann.anchor === 'left';
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: ann.x,
              top: ann.y,
              transform: `translate(${isLeft ? '0' : '-100%'}, -50%) translateY(${(1 - p) * 14}px)`,
              opacity: p,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexDirection: isLeft ? 'row' : 'row-reverse',
              fontFamily: SANS,
            }}
          >
            <div
              style={{
                width: 50,
                height: 1,
                background: PALETTE.magenta,
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: PALETTE.magenta,
                boxShadow: `0 0 16px ${PALETTE.magenta}`,
              }}
            />
            <div
              style={{
                padding: '10px 20px',
                background: PALETTE.navy,
                border: `1px solid ${PALETTE.magenta}`,
                borderRadius: 4,
                color: PALETTE.white,
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: 1,
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
              }}
            >
              {ann.label}
            </div>
          </div>
        );
      })}

      <CanvaCaption text={caption} />
    </AbsoluteFill>
  );
};

// =====================================================================
// FlowDiagramScene — sequential pill steps with arrows
// =====================================================================
export const CanvaFlowDiagramScene: React.FC<{
  steps: { label: string; color: string }[];
  caption: string;
}> = ({ steps, caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <TopographicBackground color={PALETTE.purple} />
      <AtmosphericBlobs positions={['top-right', 'bottom-left']} />

      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 6% 220px',
          fontFamily: SANS,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 28,
            flexWrap: 'nowrap',
          }}
        >
          {steps.map((step, i) => {
            const delay = 0.3 + i * 0.5;
            const p = easeOutExpo(Math.max(0, Math.min((frame - delay * fps) / (0.5 * fps), 1)));
            const arrowDelay = delay + 0.35;
            const arrowP = easeOutExpo(
              Math.max(0, Math.min((frame - arrowDelay * fps) / (0.35 * fps), 1)),
            );

            return (
              <React.Fragment key={i}>
                <div
                  style={{
                    opacity: p,
                    transform: `translateY(${(1 - p) * 18}px) scale(${0.9 + p * 0.1})`,
                    padding: '32px 42px',
                    minWidth: 200,
                    background: 'rgba(20,20,40,0.85)',
                    border: `1px solid ${step.color}`,
                    borderTop: `4px solid ${step.color}`,
                    borderRadius: 8,
                    boxShadow: `0 12px 40px ${step.color}33`,
                    textAlign: 'center',
                    color: PALETTE.white,
                    fontSize: 24,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {step.label}
                </div>
                {i < steps.length - 1 && (
                  <div
                    style={{
                      opacity: arrowP,
                      transform: `translateX(${(1 - arrowP) * -8}px)`,
                      color: PALETTE.magenta,
                      fontSize: 36,
                      fontWeight: 200,
                    }}
                  >
                    →
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </AbsoluteFill>

      <CanvaCaption text={caption} />
    </AbsoluteFill>
  );
};

// =====================================================================
// StatCardScene — huge number with label below
// =====================================================================
export const CanvaStatScene: React.FC<{
  statValue: string;
  statLabel: string;
  statSuffix?: string;
  caption: string;
}> = ({ statValue, statLabel, statSuffix, caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const numP = easeOutExpo(Math.min(frame / (0.7 * fps), 1));
  const labelP = easeOutExpo(Math.max(0, Math.min((frame - 0.35 * fps) / (0.5 * fps), 1)));

  return (
    <AbsoluteFill>
      <TopographicBackground color={PALETTE.purple} />
      <AtmosphericBlobs positions={['top-right', 'bottom-left']} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 8% 200px',
          fontFamily: SANS,
        }}
      >
        <div
          style={{
            opacity: numP,
            transform: `scale(${0.85 + numP * 0.15})`,
            color: PALETTE.white,
            fontSize: 360,
            fontWeight: 800,
            lineHeight: 1.0,
            letterSpacing: -16,
            fontVariantNumeric: 'tabular-nums',
            textShadow: `0 0 80px ${PALETTE.magenta}88`,
          }}
        >
          {statValue}
          <span style={{ color: PALETTE.magenta }}>.</span>
          {statSuffix && (
            <span style={{ fontSize: 180, marginLeft: 12, color: PALETTE.cyan }}>{statSuffix}</span>
          )}
        </div>
        <div
          style={{
            opacity: labelP,
            color: PALETTE.cyan,
            fontSize: 36,
            fontWeight: 600,
            marginTop: 24,
            letterSpacing: 6,
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          {statLabel}
        </div>
      </AbsoluteFill>

      <CanvaCaption text={caption} />
    </AbsoluteFill>
  );
};

// =====================================================================
// HeroHeartScene — heart centered, dramatic, "behold the heart" reveal
// =====================================================================
export const CanvaHeroHeartScene: React.FC<{ caption: string }> = ({ caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const heartP = easeOutExpo(Math.min(frame / (0.8 * fps), 1));
  const t = frame / fps;
  const beat = Math.sin((t / 0.85) * Math.PI * 2) * 0.025 + 1;

  return (
    <AbsoluteFill>
      <TopographicBackground color={PALETTE.magentaDeep} />
      <AtmosphericBlobs positions={['top-left', 'bottom-right']} />

      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: 200,
        }}
      >
        <div
          style={{
            width: 780,
            height: 780,
            opacity: heartP,
            transform: `scale(${(0.85 + heartP * 0.15) * beat})`,
            position: 'relative',
          }}
        >
          {/* Strong magenta glow */}
          <div
            style={{
              position: 'absolute',
              inset: '-10%',
              background: `radial-gradient(ellipse at center, ${PALETTE.magenta}66 0%, transparent 55%)`,
              filter: 'blur(50px)',
            }}
          />
          <Img
            src={staticFile('heart_anatomy.png')}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              position: 'relative',
              filter: `drop-shadow(0 24px 60px ${PALETTE.magenta}88)`,
            }}
          />
        </div>
      </AbsoluteFill>

      <CanvaCaption text={caption} />
    </AbsoluteFill>
  );
};

// =====================================================================
// ClosingScene — big serif title with magenta period
// =====================================================================
export const CanvaClosingScene: React.FC<{
  title: string;
  subtitle?: string;
  caption: string;
}> = ({ title, subtitle, caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleP = easeOutExpo(Math.min(frame / (0.8 * fps), 1));
  const subP = easeOutExpo(Math.max(0, Math.min((frame - 0.4 * fps) / (0.6 * fps), 1)));

  const cleaned = title.trim().replace(/[.!?]$/, '');

  return (
    <AbsoluteFill>
      <TopographicBackground color={PALETTE.purple} />
      <AtmosphericBlobs positions={['top-left', 'bottom-right']} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 12% 200px',
          fontFamily: SANS,
        }}
      >
        <div
          style={{
            opacity: titleP,
            transform: `translateY(${(1 - titleP) * 20}px)`,
            color: PALETTE.white,
            fontSize: 180,
            fontWeight: 800,
            letterSpacing: -3,
            lineHeight: 0.95,
            textAlign: 'center',
            textShadow: `0 4px 40px rgba(0,0,0,0.6)`,
          }}
        >
          {cleaned}
          <span style={{ color: PALETTE.magenta }}>.</span>
        </div>
        {subtitle && (
          <div
            style={{
              opacity: subP,
              color: PALETTE.cyan,
              fontSize: 36,
              fontWeight: 500,
              marginTop: 32,
              letterSpacing: 6,
              textTransform: 'uppercase',
              fontFamily: SANS,
            }}
          >
            {subtitle}
          </div>
        )}
      </AbsoluteFill>

      <CanvaCaption text={caption} />
    </AbsoluteFill>
  );
};

// =====================================================================
// SceneWipeTransition — magenta diagonal sweep
// =====================================================================
export const CanvaSceneWipe: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const duration = 0.5;
  if (t > duration) return null;

  const progress = easeOutExpo(t / duration);
  const leftEdge = interpolate(progress, [0, 0.5, 1], [-110, 0, 110]);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `skewX(-15deg) translateX(${leftEdge}%)`,
          background: `linear-gradient(95deg, ${PALETTE.magenta} 0%, ${PALETTE.purple}ee 50%, transparent 100%)`,
          boxShadow: `0 0 80px ${PALETTE.magenta}`,
        }}
      />
    </AbsoluteFill>
  );
};
