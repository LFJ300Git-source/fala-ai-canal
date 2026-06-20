// src/components/SceneFrame.tsx
// Estrutura mestra de toda cena. Define fundo, safe area, animação
// de entrada/saída padrão, e slot pra conteúdo + caption opcional.
//
// REGRA: nenhum template deve renderizar fundo, padding de borda,
// ou caption por conta própria. Sempre envolver o conteúdo da cena
// em <SceneFrame>.

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import { composeTheme } from '../theme';

type ThemeMode = 'light' | 'dark';

const theme = composeTheme();

export type SceneFrameProps = {
  /** 'light' = fundo creme, 'dark' = fundo grafite */
  mode?: ThemeMode;
  /** Legenda opcional na base da cena (estilo Canva caption strip) */
  caption?: string;
  /** Mostrar logo/marca d'água no canto */
  showBranding?: boolean;
  /** Conteúdo principal da cena */
  children: React.ReactNode;
  /** Frame em que a cena começa a aparecer (default 0) */
  enterAtFrame?: number;
  /** Frame em que a cena começa a sumir (default: últimos 15 frames) */
  exitAtFrame?: number;
};

export const SceneFrame: React.FC<SceneFrameProps> = ({
  mode = 'light',
  caption,
  showBranding = false,
  children,
  enterAtFrame = 0,
  exitAtFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Entrada: spring suave nos primeiros frames
  const enterProgress = spring({
    frame: frame - enterAtFrame,
    fps,
    config: theme.motion.spring.gentle,
  });

  // Saída: fade nos últimos frames
  const exitStart = exitAtFrame ?? durationInFrames - theme.motion.duration.fast;
  const exitProgress = interpolate(
    frame,
    [exitStart, exitStart + theme.motion.duration.fast],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const opacity = enterProgress * exitProgress;
  const scale = 0.98 + enterProgress * 0.02;
  const background = mode === 'dark' ? theme.colors.backgroundDark : theme.colors.backgroundLight;

  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      {/* Conteúdo principal — dentro da safe area, com animação herdada */}
      <AbsoluteFill
        style={{
          paddingLeft: theme.safeArea.horizontal,
          paddingRight: theme.safeArea.horizontal,
          paddingTop: theme.safeArea.vertical,
          paddingBottom: caption
            ? theme.safeArea.vertical + 160 // espaço extra pra caption
            : theme.safeArea.vertical,
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </AbsoluteFill>

      {/* Caption strip — sempre na mesma posição, sempre na mesma fonte */}
      {caption && (
        <CaptionStrip mode={mode} text={caption} progress={enterProgress} />
      )}

      {/* Branding opcional */}
      {showBranding && <Branding mode={mode} />}
    </AbsoluteFill>
  );
};

// ---------- Subcomponentes internos ----------

const CaptionStrip: React.FC<{
  mode: ThemeMode;
  text: string;
  progress: number;
}> = ({ mode, text, progress }) => {
  const textColor = mode === 'dark' ? theme.colors.textOnDarkMuted : theme.colors.textOnLightMuted;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: theme.safeArea.vertical / 2,
        left: theme.safeArea.horizontal,
        right: theme.safeArea.horizontal,
        opacity: progress,
        transform: `translateY(${(1 - progress) * 20}px)`,
        textAlign: 'center',
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.bodyLarge,
        fontWeight: theme.fontWeight.medium,
        lineHeight: theme.lineHeight.snug,
        color: textColor,
        letterSpacing: '-0.01em',
      }}
    >
      {text}
    </div>
  );
};

const Branding: React.FC<{ mode: ThemeMode }> = ({ mode }) => {
  const textColor = mode === 'dark' ? theme.colors.textOnDarkMuted : theme.colors.textOnLightMuted;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: theme.spacing.lg,
        right: theme.spacing.lg,
        fontFamily: theme.fonts.display,
        fontSize: theme.fontSize.bodySmall,
        fontWeight: theme.fontWeight.semibold,
        color: textColor,
        letterSpacing: '-0.02em',
      }}
    >
      aulacraft
    </div>
  );
};
