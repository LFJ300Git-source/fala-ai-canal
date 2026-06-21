import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  ANNOTATION_SCREEN_POSITIONS,
  AnatomyPart,
  cameraPositionFor,
  Heart3DModel,
  PART_POSITIONS,
} from './heart3d';

const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
const CHARCOAL = '#0A0A0F';
const CREAM = '#F4F0E8';
const CREAM_TEXT = '#1A1614';

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

// ============================================================================
// CaptionStrip — ALWAYS present at the bottom (dark variant for dark scenes)
// ============================================================================
export const CaptionStrip: React.FC<{ text: string; accentColor: string; variant?: 'dark' | 'light' }> = ({
  text,
  accentColor,
  variant = 'dark',
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const isLight = variant === 'light';
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '60px 140px 70px',
        background: isLight
          ? 'linear-gradient(to top, rgba(244,240,232,0.92) 0%, rgba(244,240,232,0.5) 70%, transparent 100%)'
          : 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 70%, transparent 100%)',
        opacity,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 50,
          height: 3,
          background: accentColor,
          marginBottom: 22,
          borderRadius: 1.5,
        }}
      />
      <div
        style={{
          color: isLight ? CREAM_TEXT : '#F5F5F5',
          fontSize: 34,
          fontFamily: SERIF,
          fontStyle: 'italic',
          lineHeight: 1.45,
          maxWidth: 1500,
          letterSpacing: 0.2,
          textShadow: isLight ? '0 1px 2px rgba(255,255,255,0.4)' : '0 2px 12px rgba(0,0,0,0.6)',
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ============================================================================
// SceneWipeTransition — colored panel sweeping across, overlays for first ~600ms
// ============================================================================
export const SceneWipeTransition: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const duration = 0.55;
  if (t > duration) return null;

  const progress = easeOutExpo(t / duration);
  // Panel slides from left to right covering then revealing
  const leftEdge = interpolate(progress, [0, 0.5, 1], [-110, 0, 110]);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `skewX(-15deg) translateX(${leftEdge}%)`,
          background: `linear-gradient(95deg, ${color} 0%, ${color}ee 50%, ${color}00 100%)`,
          boxShadow: `0 0 80px ${color}`,
        }}
      />
    </AbsoluteFill>
  );
};

// ============================================================================
// Atmospheric background — richer dark with accent color washes + subtle texture
// ============================================================================
const AtmosphericBg: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  // Gentle drift on the radial bloom center
  const cx = 50 + Math.sin(t * 0.3) * 8;
  const cy = 45 + Math.cos(t * 0.25) * 6;
  return (
    <AbsoluteFill>
      {/* Base dark with accent radial bloom (much stronger than before) */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${cx}% ${cy}%, ${accent}55 0%, ${accent}22 25%, ${CHARCOAL} 70%)`,
        }}
      />
      {/* Diagonal accent stripe overlay for depth */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(125deg, transparent 0%, transparent 60%, ${accent}15 100%)`,
        }}
      />
      {/* Starfield + accent dots */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: 80 }).map((_, i) => {
          const x = (Math.sin(i * 12.34) * 0.5 + 0.5) * 100;
          const y = (Math.cos(i * 7.91) * 0.5 + 0.5) * 100;
          const r = (Math.sin(i * 3.14) * 0.5 + 0.5) * 2 + 0.4;
          const isAccent = i % 7 === 0;
          return (
            <circle
              key={i}
              cx={`${x}%`}
              cy={`${y}%`}
              r={r}
              fill={isAccent ? accent : '#FFFFFF'}
              opacity={isAccent ? 0.5 : 0.3}
            />
          );
        })}
      </svg>
      {/* Vignette */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

// ============================================================================
// HeroScene3D — full heart, slowly rotating, dramatic
// ============================================================================
export const HeroScene3D: React.FC<{
  highlights?: AnatomyPart[];
  accent: string;
  caption: string;
}> = ({ highlights = ['whole'], accent, caption }) => {
  const camera = cameraPositionFor('whole');
  return (
    <AbsoluteFill style={{ background: CHARCOAL }}>
      <AtmosphericBg accent={accent} />
      <ThreeCanvas width={1920} height={1080} camera={{ position: camera, fov: 35 }}>
        <ambientLight intensity={0.45} />
        <directionalLight position={[5, 6, 5]} intensity={1.0} color="#ffffff" />
        <directionalLight position={[-4, 2, 3]} intensity={0.5} color={accent} />
        <Heart3DModel highlights={highlights} cameraTilt={1} accent={accent} />
      </ThreeCanvas>
      <CaptionStrip text={caption} accentColor={accent} />
    </AbsoluteFill>
  );
};

// ============================================================================
// AnnotatedScene3D — heart + floating label callouts with leader lines
// ============================================================================
export const AnnotatedScene3D: React.FC<{
  focus: AnatomyPart;
  highlights: AnatomyPart[];
  annotations: { label: string; part: AnatomyPart }[];
  accent: string;
  caption: string;
}> = ({ focus, highlights, annotations, accent, caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const camera = cameraPositionFor(focus);

  return (
    <AbsoluteFill style={{ background: CHARCOAL }}>
      <AtmosphericBg accent={accent} />
      <ThreeCanvas width={1920} height={1080} camera={{ position: camera, fov: 36 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 6, 5]} intensity={0.95} color="#ffffff" />
        <directionalLight position={[-4, 2, 3]} intensity={0.45} color={accent} />
        <Heart3DModel highlights={highlights} cameraTilt={0.6} accent={accent} />
      </ThreeCanvas>

      {/* Annotation overlays — stagger entrance */}
      {annotations.map((ann, i) => {
        const delay = 0.4 + i * 0.25;
        const localFrame = frame - delay * fps;
        const progress = easeOutExpo(Math.max(0, Math.min(localFrame / (0.45 * fps), 1)));
        const pos = ANNOTATION_SCREEN_POSITIONS[ann.part];
        const isLeft = pos.anchor === 'left';
        const translateX = (1 - progress) * (isLeft ? -20 : 20);

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              transform: `translate(${isLeft ? '0' : '-100%'}, -50%) translateX(${translateX}px)`,
              opacity: progress,
              pointerEvents: 'none',
              fontFamily: SANS,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                flexDirection: isLeft ? 'row' : 'row-reverse',
              }}
            >
              {/* Leader line */}
              <div
                style={{
                  width: 60,
                  height: 2,
                  background: accent,
                }}
              />
              {/* Dot */}
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: accent,
                  boxShadow: `0 0 12px ${accent}`,
                }}
              />
              {/* Label */}
              <div
                style={{
                  padding: '12px 22px',
                  background: 'rgba(15,15,20,0.92)',
                  border: `1px solid ${accent}`,
                  borderRadius: 4,
                  color: '#FFFFFF',
                  fontSize: 26,
                  fontWeight: 600,
                  letterSpacing: 0.8,
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                }}
              >
                {ann.label}
              </div>
            </div>
          </div>
        );
      })}

      <CaptionStrip text={caption} accentColor={accent} />
    </AbsoluteFill>
  );
};

// ============================================================================
// FlowDiagramScene — animated steps with arrows
// ============================================================================
export const FlowDiagramScene: React.FC<{
  steps: { label: string; color: string }[];
  accent: string;
  caption: string;
}> = ({ steps, accent, caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: CHARCOAL }}>
      <AtmosphericBg accent={accent} />

      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 8% 200px',
          fontFamily: SANS,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            flexWrap: 'nowrap',
            maxWidth: '100%',
          }}
        >
          {steps.map((step, i) => {
            const delay = 0.3 + i * 0.5;
            const localFrame = frame - delay * fps;
            const progress = easeOutExpo(Math.max(0, Math.min(localFrame / (0.5 * fps), 1)));
            const arrowDelay = delay + 0.4;
            const arrowFrame = frame - arrowDelay * fps;
            const arrowProgress = easeOutExpo(Math.max(0, Math.min(arrowFrame / (0.4 * fps), 1)));

            return (
              <React.Fragment key={i}>
                <div
                  style={{
                    opacity: progress,
                    transform: `translateY(${(1 - progress) * 16}px) scale(${0.92 + progress * 0.08})`,
                    padding: '36px 40px',
                    minWidth: 180,
                    background: 'rgba(15,15,20,0.95)',
                    border: `2px solid ${step.color}`,
                    borderRadius: 12,
                    boxShadow: `0 8px 32px ${step.color}55, inset 0 -3px 12px ${step.color}22`,
                    textAlign: 'center',
                    color: '#FFFFFF',
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                  }}
                >
                  {step.label}
                </div>

                {i < steps.length - 1 && (
                  <div
                    style={{
                      opacity: arrowProgress,
                      display: 'flex',
                      alignItems: 'center',
                      color: accent,
                      fontSize: 48,
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

      <CaptionStrip text={caption} accentColor={accent} />
    </AbsoluteFill>
  );
};

// ============================================================================
// TitleCardScene — CREAM editorial background, big title, labeled entity chips
// ============================================================================
export const TitleCardScene: React.FC<{
  title: string;
  subtitle?: string;
  entities?: { name: string; sublabel: string; color: string }[];
  accent: string;
  caption: string;
}> = ({ title, subtitle, entities = [], accent, caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleProgress = easeOutExpo(Math.min(frame / (0.6 * fps), 1));

  return (
    <AbsoluteFill style={{ background: CREAM }}>
      {/* Editorial paper texture — diagonal stripes very subtle */}
      <AbsoluteFill
        style={{
          background:
            'repeating-linear-gradient(135deg, transparent 0px, transparent 8px, rgba(26,22,20,0.025) 8px, rgba(26,22,20,0.025) 9px)',
        }}
      />
      {/* Hairline accent border at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: accent,
          transform: `scaleX(${titleProgress})`,
          transformOrigin: 'left',
        }}
      />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '13% 12% 0',
          fontFamily: SERIF,
        }}
      >
        {/* Eyebrow accent text */}
        <div
          style={{
            color: accent,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 8,
            textTransform: 'uppercase',
            marginBottom: 28,
            fontFamily: SANS,
            opacity: titleProgress,
          }}
        >
          Cardiovascular System
        </div>
        {/* Title */}
        <div
          style={{
            color: accent,
            fontSize: 140,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: 1.0,
            textAlign: 'center',
            textTransform: 'uppercase',
            opacity: titleProgress,
            transform: `translateY(${(1 - titleProgress) * 14}px)`,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              color: CREAM_TEXT,
              fontSize: 32,
              fontStyle: 'italic',
              marginTop: 22,
              opacity: titleProgress,
            }}
          >
            {subtitle}
          </div>
        )}

        {/* Entity chips — staggered */}
        {entities.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 48,
              marginTop: 72,
              justifyContent: 'center',
              flexWrap: 'wrap',
              maxWidth: 1500,
            }}
          >
            {entities.map((e, i) => {
              const delay = 0.4 + i * 0.18;
              const p = easeOutExpo(Math.max(0, Math.min((frame - delay * fps) / (0.45 * fps), 1)));
              return (
                <div
                  key={i}
                  style={{
                    opacity: p,
                    transform: `translateY(${(1 - p) * 18}px)`,
                    minWidth: 340,
                    padding: '32px 40px',
                    background: '#FFFFFF',
                    border: `2px solid ${e.color}`,
                    borderTop: `5px solid ${e.color}`,
                    borderRadius: 4,
                    boxShadow: '0 8px 28px rgba(26,22,20,0.12)',
                    textAlign: 'center',
                    fontFamily: SANS,
                  }}
                >
                  <div
                    style={{
                      color: e.color,
                      fontSize: 16,
                      fontWeight: 700,
                      letterSpacing: 4,
                      textTransform: 'uppercase',
                      marginBottom: 10,
                    }}
                  >
                    {e.sublabel}
                  </div>
                  <div
                    style={{
                      color: CREAM_TEXT,
                      fontSize: 42,
                      fontWeight: 700,
                      letterSpacing: -0.5,
                    }}
                  >
                    {e.name}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AbsoluteFill>

      <CaptionStrip text={caption} accentColor={accent} variant="light" />
    </AbsoluteFill>
  );
};

// ============================================================================
// StatCardScene — ONE huge number callout on an accent-saturated background
// ============================================================================
export const StatCardScene: React.FC<{
  statValue: string;
  statLabel: string;
  statSuffix?: string;
  accent: string;
  caption: string;
}> = ({ statValue, statLabel, statSuffix, accent, caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const numProgress = easeOutExpo(Math.min(frame / (0.7 * fps), 1));
  const labelProgress = easeOutExpo(Math.max(0, Math.min((frame - 0.35 * fps) / (0.5 * fps), 1)));

  return (
    <AbsoluteFill style={{ background: CHARCOAL }}>
      {/* Bold radial accent background */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, ${accent}66 0%, ${accent}22 40%, ${CHARCOAL} 80%)`,
        }}
      />
      {/* Dot grid texture */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px) 0 0/40px 40px',
          opacity: 0.5,
        }}
      />

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
            opacity: numProgress,
            transform: `scale(${0.85 + numProgress * 0.15})`,
            color: '#FFFFFF',
            fontSize: 380,
            fontWeight: 800,
            lineHeight: 1.0,
            letterSpacing: -16,
            fontVariantNumeric: 'tabular-nums',
            textShadow: `0 0 80px ${accent}, 0 8px 40px rgba(0,0,0,0.8)`,
          }}
        >
          {statValue}
          {statSuffix && <span style={{ fontSize: 200, marginLeft: 8 }}>{statSuffix}</span>}
        </div>
        <div
          style={{
            opacity: labelProgress,
            color: accent,
            fontSize: 38,
            fontWeight: 600,
            marginTop: 32,
            letterSpacing: 8,
            textTransform: 'uppercase',
            textAlign: 'center',
            maxWidth: 1200,
          }}
        >
          {statLabel}
        </div>
      </AbsoluteFill>

      <CaptionStrip text={caption} accentColor={accent} variant="dark" />
    </AbsoluteFill>
  );
};

// ============================================================================
// ClosingCardScene — big title overlay on subtle 3D background
// ============================================================================
export const ClosingCardScene: React.FC<{
  title: string;
  subtitle?: string;
  accent: string;
  caption: string;
}> = ({ title, subtitle, accent, caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleProgress = easeOutExpo(Math.min(frame / (0.7 * fps), 1));
  const subProgress = easeOutExpo(Math.max(0, Math.min((frame - 0.35 * fps) / (0.6 * fps), 1)));

  return (
    <AbsoluteFill style={{ background: CHARCOAL }}>
      <AtmosphericBg accent={accent} />
      {/* Subtle heart in background */}
      <AbsoluteFill style={{ opacity: 0.35 }}>
        <ThreeCanvas width={1920} height={1080} camera={{ position: [0, 0, 11], fov: 35 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 6, 5]} intensity={0.7} color="#ffffff" />
          <directionalLight position={[-4, 2, 3]} intensity={0.5} color={accent} />
          <Heart3DModel highlights={['whole']} cameraTilt={0.3} accent={accent} />
        </ThreeCanvas>
      </AbsoluteFill>

      {/* Title overlay */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 12% 200px',
          fontFamily: SERIF,
        }}
      >
        <div
          style={{
            opacity: titleProgress,
            transform: `translateY(${(1 - titleProgress) * 16}px)`,
            color: '#FFFFFF',
            fontSize: 180,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: 1.0,
            textAlign: 'center',
            textShadow: `0 4px 40px rgba(0,0,0,0.8)`,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              opacity: subProgress,
              color: accent,
              fontSize: 42,
              fontStyle: 'italic',
              marginTop: 28,
              letterSpacing: 2,
              textTransform: 'lowercase',
              fontFamily: SERIF,
            }}
          >
            {subtitle}
          </div>
        )}
      </AbsoluteFill>

      <CaptionStrip text={caption} accentColor={accent} />
    </AbsoluteFill>
  );
};
