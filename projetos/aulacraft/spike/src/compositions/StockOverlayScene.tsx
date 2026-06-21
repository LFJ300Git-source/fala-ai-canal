// src/compositions/StockOverlayScene.tsx

import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  Loop,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  staticFile,
} from 'remotion';
import { composeTheme } from '../theme';

const theme = composeTheme();

export type StockOverlaySceneProps = {
  videoSrc: string;
  eyebrow: string;
  impact: string;
  gradeIntensity?: number;
  clipDurationInSeconds?: number;
};

const ENTER_EYEBROW_AT = 12;
const ENTER_IMPACT_AT = 30;
const IMPACT_WORD_STAGGER = 7;
const EXIT_DURATION = 24;

export const StockOverlayScene: React.FC<StockOverlaySceneProps> = ({
  videoSrc,
  eyebrow,
  impact,
  gradeIntensity = 1,
  clipDurationInSeconds,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const clipFrames = clipDurationInSeconds ? Math.round(clipDurationInSeconds * fps) : null;

  const impactWords = impact.split(' ');

  const exitStart = durationInFrames - EXIT_DURATION;
  const exitProgress = interpolate(
    frame,
    [exitStart, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const zoom = interpolate(
    frame,
    [0, durationInFrames],
    [1.0, 1.06],
    { extrapolateRight: 'clamp' }
  );

  const filterString = [
    `contrast(${1 + 0.2 * gradeIntensity})`,
    `saturate(${1 - 0.35 * gradeIntensity})`,
    `brightness(${1 - 0.25 * gradeIntensity})`,
  ].join(' ');

  const eyebrowProgress = spring({
    frame: frame - ENTER_EYEBROW_AT,
    fps,
    config: theme.motion.spring.gentle,
  });

  const glowPulse = (Math.sin(frame / 18) + 1) / 2;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.backgroundDark,
        opacity: exitProgress,
        overflow: 'hidden',
      }}
    >
      <AbsoluteFill
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        {clipFrames && clipFrames < durationInFrames ? (
          <Loop durationInFrames={clipFrames}>
            <OffthreadVideo
              src={staticFile(videoSrc)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: filterString,
              }}
              muted
              startFrom={0}
            />
          </Loop>
        ) : (
          <OffthreadVideo
            src={staticFile(videoSrc)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: filterString,
            }}
            muted
            startFrom={0}
          />
        )}
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background:
            'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(11,15,30,0) 45%, rgba(20,184,166,0.18) 100%)',
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      />

      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to right, rgba(11,15,30,0.55) 0%, rgba(11,15,30,0.2) 50%, rgba(11,15,30,0.4) 100%)',
          pointerEvents: 'none',
        }}
      />

      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(0,0,0,0.7) 100%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: theme.safeArea.horizontal,
          bottom: theme.safeArea.vertical + 40,
          maxWidth: 1500,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            opacity: eyebrowProgress,
            transform: `translateY(${(1 - eyebrowProgress) * 16}px)`,
            marginBottom: theme.spacing.lg,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
          }}
        >
          <div
            style={{
              width: 60,
              height: 2,
              backgroundColor: theme.colors.accentPrimary,
            }}
          />
          <span
            style={{
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSize.bodySmall,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.accentPrimary,
              letterSpacing: theme.letterSpacing.label,
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: `${theme.spacing.xs}px ${theme.spacing.md}px`,
          }}
        >
          {impactWords.map((word, i) => {
            const wordEnterAt = ENTER_IMPACT_AT + i * IMPACT_WORD_STAGGER;
            const wordProgress = spring({
              frame: frame - wordEnterAt,
              fps,
              config: { damping: 22, stiffness: 110, mass: 1 },
            });
            const opacity = wordProgress;
            const translateY = (1 - wordProgress) * 32;
            const glowOpacity = 0.4 + glowPulse * 0.2;

            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity,
                  transform: `translateY(${translateY}px)`,
                  fontFamily: theme.fonts.display,
                  fontSize: theme.fontSize.displayHero,
                  fontWeight: theme.fontWeight.bold,
                  lineHeight: theme.lineHeight.tight,
                  letterSpacing: theme.letterSpacing.display,
                  color: theme.colors.textOnDark,
                  textShadow: `0 0 80px rgba(245, 158, 11, ${glowOpacity * 0.5}), 0 4px 24px rgba(0, 0, 0, 0.8), 0 0 120px rgba(0, 0, 0, 0.6)`,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
