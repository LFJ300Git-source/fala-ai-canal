// src/compositions/AIOpenerScene.tsx

import React from 'react';
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  staticFile,
} from 'remotion';
import { composeTheme } from '../theme';

const theme = composeTheme();

export type AIOpenerSceneProps = {
  backgroundSrc: string;
  eyebrow: string;
  title: string;
  subtitle: string;
};

const BG_FADE_IN_END = 30;
const ENTER_EYEBROW_AT = 24;
const ENTER_TITLE_AT = 42;
const TITLE_WORD_STAGGER = 8;
const ENTER_SUBTITLE_AFTER_TITLE = 18;
const EXIT_DURATION = 24;

export const AIOpenerScene: React.FC<AIOpenerSceneProps> = ({
  backgroundSrc,
  eyebrow,
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const titleWords = title.split(' ');
  const titleEndFrame =
    ENTER_TITLE_AT + (titleWords.length - 1) * TITLE_WORD_STAGGER + 24;
  const enterSubtitleAt = titleEndFrame + ENTER_SUBTITLE_AFTER_TITLE;

  const exitStart = durationInFrames - EXIT_DURATION;
  const exitProgress = interpolate(
    frame,
    [exitStart, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const bgOpacity = interpolate(
    frame,
    [0, BG_FADE_IN_END],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const bgScale = interpolate(
    frame,
    [0, durationInFrames],
    [1.0, 1.05],
    { extrapolateRight: 'clamp' }
  );

  const eyebrowProgress = spring({
    frame: frame - ENTER_EYEBROW_AT,
    fps,
    config: theme.motion.spring.gentle,
  });

  const subtitleProgress = spring({
    frame: frame - enterSubtitleAt,
    fps,
    config: theme.motion.spring.gentle,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.backgroundDark,
        opacity: exitProgress,
      }}
    >
      <AbsoluteFill
        style={{
          opacity: bgOpacity,
          transform: `scale(${bgScale})`,
          transformOrigin: 'center center',
        }}
      >
        <Img
          src={staticFile(backgroundSrc)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to right, rgba(11,15,30,0.7) 0%, rgba(11,15,30,0.3) 40%, rgba(11,15,30,0) 70%)',
          pointerEvents: 'none',
        }}
      />

      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: theme.safeArea.horizontal,
          top: '50%',
          transform: 'translateY(-50%)',
          maxWidth: 900,
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
            marginBottom: theme.spacing.xl,
          }}
        >
          {titleWords.map((word, i) => {
            const wordEnterAt = ENTER_TITLE_AT + i * TITLE_WORD_STAGGER;
            const wordProgress = spring({
              frame: frame - wordEnterAt,
              fps,
              config: { damping: 22, stiffness: 90, mass: 1 },
            });
            const opacity = wordProgress;
            const blurPx = (1 - wordProgress) * 12;
            const translateY = (1 - wordProgress) * 24;

            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity,
                  filter: `blur(${blurPx}px)`,
                  transform: `translateY(${translateY}px)`,
                  fontFamily: theme.fonts.display,
                  fontSize: theme.fontSize.display1,
                  fontWeight: theme.fontWeight.bold,
                  lineHeight: theme.lineHeight.tight,
                  letterSpacing: theme.letterSpacing.display,
                  color: theme.colors.textOnDark,
                  textShadow: '0 0 80px rgba(11, 15, 30, 0.8)',
                }}
              >
                {word}
              </span>
            );
          })}
        </div>

        <div
          style={{
            opacity: subtitleProgress,
            transform: `translateY(${(1 - subtitleProgress) * 16}px)`,
            maxWidth: 800,
          }}
        >
          <p
            style={{
              fontFamily: theme.fonts.editorial,
              fontSize: theme.fontSize.bodyLarge,
              fontWeight: theme.fontWeight.regular,
              fontStyle: 'italic',
              lineHeight: theme.lineHeight.snug,
              color: theme.colors.textOnDarkMuted,
              letterSpacing: theme.letterSpacing.bodyTight,
              margin: 0,
            }}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
