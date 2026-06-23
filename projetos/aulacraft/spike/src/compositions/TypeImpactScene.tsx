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

// Estima largura de uma palavra (px) pelo numero de chars e o tamanho da fonte.
// Fatores por familia: Bebas (display) e condensada; Inter/Fraunces mais largas.
const charWidthFactor = (emphasis: WordEmphasis): number => {
  if (emphasis === 'display-huge') return 0.52;      // Bebas Neue, condensada
  if (emphasis === 'editorial-italic') return 0.50;  // Fraunces italic
  return 0.55;                                        // Inter
};

const fontSizeFor = (emphasis: WordEmphasis): number => {
  if (emphasis === 'display-huge') return theme.fontSize.display1;   // 220
  if (emphasis === 'editorial-italic') return theme.fontSize.display3; // 120
  return theme.fontSize.bodyLarge;                                   // 52
};

// Funcao PURA: dado o conjunto de palavras, devolve um fator <=1 que garante
// que o bloco caiba na zona (largura 1300, altura util ~760). Determinista:
// mesmo input -> mesmo fator em todo frame, sem flicker.
const computeFitScale = (words: ImpactWord[]): number => {
  const MAX_WIDTH = 1300;
  const MAX_HEIGHT = 760; // 880 util menos folga do preLine + margens
  const GAP_X = 24;       // theme.spacing.md entre palavras

  // Simula a quebra de linha (flex-wrap) com os tamanhos base.
  let lineWidth = 0;
  let lines = 1;
  let maxLineHeight = 0;
  let totalHeight = 0;
  const lineHeights: number[] = [];

  for (const w of words) {
    const fs = fontSizeFor(w.emphasis);
    const wordWidth = w.text.length * fs * charWidthFactor(w.emphasis);
    const lineHeightPx = fs * 0.95; // lineHeight tight aprox

    if (lineWidth > 0 && lineWidth + GAP_X + wordWidth > MAX_WIDTH) {
      // quebra de linha
      lineHeights.push(maxLineHeight);
      lines += 1;
      lineWidth = wordWidth;
      maxLineHeight = lineHeightPx;
    } else {
      lineWidth = lineWidth === 0 ? wordWidth : lineWidth + GAP_X + wordWidth;
      maxLineHeight = Math.max(maxLineHeight, lineHeightPx);
    }
  }
  lineHeights.push(maxLineHeight);
  totalHeight = lineHeights.reduce((a, b) => a + b, 0);

  // Maior palavra isolada nao pode exceder a largura.
  let widestWord = 0;
  for (const w of words) {
    const fs = fontSizeFor(w.emphasis);
    widestWord = Math.max(widestWord, w.text.length * fs * charWidthFactor(w.emphasis));
  }

  const heightScale = totalHeight > MAX_HEIGHT ? MAX_HEIGHT / totalHeight : 1;
  const widthScale = widestWord > MAX_WIDTH ? MAX_WIDTH / widestWord : 1;

  const scale = Math.min(1, heightScale, widthScale);
  // Piso de seguranca: nunca encolhe abaixo de 0.45 (texto vira ilegivel).
  return Math.max(0.45, scale);
};

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

  const fitScale = computeFitScale(words);

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

            const fontSize = (isDisplay
              ? theme.fontSize.display1
              : isItalic
              ? theme.fontSize.display3
              : theme.fontSize.bodyLarge) * fitScale;

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
