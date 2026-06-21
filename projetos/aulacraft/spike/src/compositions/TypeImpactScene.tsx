// src/compositions/TypeImpactScene.tsx

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import { composeTheme } from '../theme';

const theme = composeTheme();

export type WordEmphasis = 'normal' | 'display-huge' | 'editorial-italic';

export type ImpactWord = {
  text: string;
  emphasis: WordEmphasis;
};

export type TypeImpactSceneProps = {
  preLine: string;
  words: ImpactWord[];
  number: string;
  numberLabel: string;
};

const ENTER_PRELINE_AT = 6;
const ENTER_NUMBER_AT = 12;
const ENTER_WORDS_AT = 30;
const WORD_STAGGER = 6;
const EXIT_DURATION = 18;

export const TypeImpactScene: React.FC<TypeImpactSceneProps> = ({
  preLine,
  words,
  number,
  numberLabel,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const exitStart = durationInFrames - EXIT_DURATION;
  const exitProgress = interpolate(
    frame,
    [exitStart, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const numberCountProgress = spring({
    frame: frame - ENTER_NUMBER_AT,
    fps,
    config: { damping: 25, stiffness: 120, mass: 1 },
  });
  const numberDisplay =
    number === ''
      ? ''
      : Math.round(numberCountProgress * parseInt(number, 10))
          .toString()
          .padStart(number.length, '0');

  const numberOpacity = interpolate(
    frame,
    [ENTER_NUMBER_AT, ENTER_NUMBER_AT + 12],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const preLineProgress = spring({
    frame: frame - ENTER_PRELINE_AT,
    fps,
    config: theme.motion.spring.gentle,
  });

  const glowPulse = (Math.sin(frame / 18) + 1) / 2;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.backgroundDark,
        opacity: exitProgress,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, ${theme.colors.backgroundDark} 0%, #050813 80%)`,
        }}
      />

      {number !== '' && (
        <div
          style={{
            position: 'absolute',
            top: theme.safeArea.vertical,
            right: theme.safeArea.horizontal,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            opacity: numberOpacity,
          }}
        >
          <span
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: theme.fontSize.stat,
              fontWeight: theme.fontWeight.bold,
              lineHeight: theme.lineHeight.tight,
              color: theme.colors.accentPrimary,
              letterSpacing: '-0.04em',
            }}
          >
            {numberDisplay}
          </span>
          <span
            style={{
              marginTop: theme.spacing.sm,
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSize.bodySmall,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.textOnDarkMuted,
              letterSpacing: theme.letterSpacing.label,
              textTransform: 'uppercase',
            }}
          >
            {numberLabel}
          </span>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: theme.safeArea.vertical,
          left: theme.safeArea.horizontal,
          maxWidth: 1300,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            opacity: preLineProgress,
            transform: `translateY(${(1 - preLineProgress) * 12}px)`,
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
              color: theme.colors.textOnDarkMuted,
              letterSpacing: theme.letterSpacing.label,
              textTransform: 'uppercase',
            }}
          >
            {preLine}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            gap: `${theme.spacing.xs}px ${theme.spacing.md}px`,
          }}
        >
          {words.map((word, i) => {
            const wordEnterAt = ENTER_WORDS_AT + i * WORD_STAGGER;
            const wordProgress = spring({
              frame: frame - wordEnterAt,
              fps,
              config: theme.motion.spring.gentle,
            });
            const opacity = wordProgress;
            const translateY = (1 - wordProgress) * 30;

            const isDisplay = word.emphasis === 'display-huge';
            const isItalic = word.emphasis === 'editorial-italic';

            const fontFamily = isDisplay
              ? theme.fonts.display
              : isItalic
              ? theme.fonts.editorial
              : theme.fonts.body;

            const fontSize = isDisplay
              ? theme.fontSize.display1
              : isItalic
              ? theme.fontSize.display3
              : theme.fontSize.bodyLarge;

            const fontWeight = isDisplay
              ? theme.fontWeight.bold
              : isItalic
              ? theme.fontWeight.regular
              : theme.fontWeight.regular;

            const fontStyle = isItalic ? 'italic' : 'normal';
            const color = isDisplay
              ? theme.colors.textOnDark
              : isItalic
              ? theme.colors.accentPrimary
              : theme.colors.textOnDarkMuted;

            const lineHeight = isDisplay
              ? theme.lineHeight.tight
              : theme.lineHeight.snug;

            const glowOpacity = isDisplay ? 0.35 + glowPulse * 0.25 : 0;

            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity,
                  transform: `translateY(${translateY}px)`,
                  fontFamily,
                  fontSize,
                  fontWeight,
                  fontStyle,
                  lineHeight,
                  color,
                  letterSpacing: isDisplay ? theme.letterSpacing.display : theme.letterSpacing.bodyTight,
                  textShadow: isDisplay
                    ? `0 0 60px rgba(245, 158, 11, ${glowOpacity}), 0 0 120px rgba(245, 158, 11, ${glowOpacity * 0.6})`
                    : 'none',
                }}
              >
                {word.text}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
