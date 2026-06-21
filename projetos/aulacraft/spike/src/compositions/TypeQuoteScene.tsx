// src/compositions/TypeQuoteScene.tsx

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

export type TypeQuoteSceneProps = {
  quote: string;
  author: string;
  authorTitle?: string;
};

const ENTER_MARK_AT = 6;
const ENTER_QUOTE_AT = 18;
const QUOTE_WORD_STAGGER = 3;
const ENTER_AUTHOR_AFTER_QUOTE = 24;
const EXIT_DURATION = 24;

export const TypeQuoteScene: React.FC<TypeQuoteSceneProps> = ({
  quote,
  author,
  authorTitle,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const quoteWords = quote.split(' ');
  const quoteEndFrame =
    ENTER_QUOTE_AT + (quoteWords.length - 1) * QUOTE_WORD_STAGGER + 18;
  const enterAuthorAt = quoteEndFrame + ENTER_AUTHOR_AFTER_QUOTE;

  const exitStart = durationInFrames - EXIT_DURATION;
  const exitProgress = interpolate(
    frame,
    [exitStart, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const markProgress = spring({
    frame: frame - ENTER_MARK_AT,
    fps,
    config: theme.motion.spring.gentle,
  });

  const authorProgress = spring({
    frame: frame - enterAuthorAt,
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
          background: `radial-gradient(ellipse at 30% 50%, ${theme.colors.backgroundDark} 0%, #050813 80%)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: theme.safeArea.horizontal,
          top: '50%',
          transform: 'translateY(-50%)',
          maxWidth: 1400,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            opacity: markProgress,
            transform: `scale(${0.85 + markProgress * 0.15})`,
            transformOrigin: 'left center',
            fontFamily: theme.fonts.editorial,
            fontSize: 280,
            fontWeight: theme.fontWeight.bold,
            lineHeight: 0.8,
            color: theme.colors.accentPrimary,
            letterSpacing: '-0.04em',
            marginBottom: theme.spacing.md,
            marginLeft: -16,
          }}
        >
          “
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: `${theme.spacing.xs}px ${theme.spacing.md}px`,
            marginBottom: theme.spacing.xl,
          }}
        >
          {quoteWords.map((word, i) => {
            const wordEnterAt = ENTER_QUOTE_AT + i * QUOTE_WORD_STAGGER;
            const wordProgress = spring({
              frame: frame - wordEnterAt,
              fps,
              config: theme.motion.spring.gentle,
            });
            const opacity = wordProgress;
            const translateY = (1 - wordProgress) * 16;

            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity,
                  transform: `translateY(${translateY}px)`,
                  fontFamily: theme.fonts.editorial,
                  fontSize: theme.fontSize.display3,
                  fontWeight: theme.fontWeight.regular,
                  fontStyle: 'italic',
                  lineHeight: theme.lineHeight.snug,
                  letterSpacing: theme.letterSpacing.bodyTight,
                  color: theme.colors.textOnDark,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>

        <div
          style={{
            opacity: authorProgress,
            transform: `translateY(${(1 - authorProgress) * 12}px)`,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.md,
          }}
        >
          <div
            style={{
              width: 80,
              height: 2,
              backgroundColor: theme.colors.accentPrimary,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span
              style={{
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSize.bodyMedium,
                fontWeight: theme.fontWeight.semibold,
                color: theme.colors.textOnDark,
                letterSpacing: theme.letterSpacing.label,
                textTransform: 'uppercase',
              }}
            >
              {author}
            </span>
            {authorTitle && (
              <span
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSize.bodySmall,
                  fontWeight: theme.fontWeight.regular,
                  color: theme.colors.textOnDarkMuted,
                  letterSpacing: theme.letterSpacing.body,
                }}
              >
                {authorTitle}
              </span>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
