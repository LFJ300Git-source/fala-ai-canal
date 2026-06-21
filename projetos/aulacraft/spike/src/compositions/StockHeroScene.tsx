// src/compositions/StockHeroScene.tsx
// v2: full bleed corrigido, caption ancorada à esquerda com eyebrow, vinheta sutil.

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

export type StockHeroSceneProps = {
  videoSrc: string;
  caption?: string;
  eyebrow?: string;
  showBranding?: boolean;
  gradeIntensity?: number;
  clipDurationInSeconds?: number;
};

const ENTER_EYEBROW_AT = 6;
const ENTER_CAPTION_AT = 18;
const EXIT_DURATION = 18;

export const StockHeroScene: React.FC<StockHeroSceneProps> = ({
  videoSrc,
  caption,
  eyebrow = 'NARRAÇÃO',
  showBranding = false,
  gradeIntensity = 1,
  clipDurationInSeconds,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const clipFrames = clipDurationInSeconds ? Math.round(clipDurationInSeconds * fps) : null;

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
    [1.0, 1.04],
    { extrapolateRight: 'clamp' }
  );

  const filterString = [
    `contrast(${1 + 0.15 * gradeIntensity})`,
    `saturate(${1 - 0.25 * gradeIntensity})`,
    `brightness(${1 - 0.08 * gradeIntensity})`,
  ].join(' ');

  const eyebrowProgress = spring({
    frame: frame - ENTER_EYEBROW_AT,
    fps,
    config: theme.motion.spring.gentle,
  });

  const captionProgress = spring({
    frame: frame - ENTER_CAPTION_AT,
    fps,
    config: theme.motion.spring.gentle,
  });

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
            'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(11,15,30,0) 45%, rgba(20,184,166,0.20) 100%)',
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      />

      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to top, rgba(11,15,30,0.85) 0%, rgba(11,15,30,0.3) 35%, rgba(11,15,30,0) 60%)',
          pointerEvents: 'none',
        }}
      />

      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)',
          pointerEvents: 'none',
        }}
      />

      {caption && (
        <div
          style={{
            position: 'absolute',
            left: theme.safeArea.horizontal,
            bottom: theme.safeArea.vertical,
            maxWidth: 1400,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              opacity: eyebrowProgress,
              transform: `translateY(${(1 - eyebrowProgress) * 12}px)`,
              marginBottom: theme.spacing.md,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
            }}
          >
            <div
              style={{
                width: 50,
                height: 2,
                backgroundColor: theme.colors.accentPrimary,
              }}
            />
            <span
              style={{
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSize.bodyTiny,
                fontWeight: theme.fontWeight.semibold,
                color: theme.colors.accentPrimary,
                letterSpacing: theme.letterSpacing.label,
                textTransform: 'uppercase',
              }}
            >
              {eyebrow}
            </span>
          </div>

          <p
            style={{
              opacity: captionProgress,
              transform: `translateY(${(1 - captionProgress) * 16}px)`,
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSize.bodyLarge,
              fontWeight: theme.fontWeight.medium,
              lineHeight: theme.lineHeight.snug,
              letterSpacing: theme.letterSpacing.bodyTight,
              color: theme.colors.textOnDark,
              margin: 0,
              maxWidth: 1100,
              textShadow: '0 2px 16px rgba(0, 0, 0, 0.7)',
            }}
          >
            {caption}
          </p>
        </div>
      )}

      {showBranding && (
        <div
          style={{
            position: 'absolute',
            bottom: theme.spacing.lg,
            right: theme.spacing.lg,
            fontFamily: theme.fonts.display,
            fontSize: theme.fontSize.bodyTiny,
            fontWeight: theme.fontWeight.bold,
            color: theme.colors.textOnDarkMuted,
            letterSpacing: theme.letterSpacing.display,
            opacity: 0.7,
          }}
        >
          AULACRAFT
        </div>
      )}
    </AbsoluteFill>
  );
};
