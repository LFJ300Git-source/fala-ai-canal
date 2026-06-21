# Fase A — Estado atual dos arquivos de theme + SceneFrame

> Gerado em 2026-05-24. Use como referência exata antes de escrever qualquer prompt de continuação.

---

## `src/theme/system.ts`

```ts
// src/theme/system.ts
// SYSTEM TOKENS — DNA do Aulacraft.
// Define tipografia, escala, motion e layout. Não é customizável
// pelo usuário do curso. Só o time do Aulacraft pode alterar.

export const system = {
  fonts: {
    display: 'Bebas Neue',
    body: 'Inter',
    mono: 'Space Mono',
  },

  fontSize: {
    displayHero: 280,
    display1: 220,
    display2: 160,
    display3: 120,
    bodyLarge: 52,
    body: 40,
    bodyMedium: 32,
    bodySmall: 26,
    bodyTiny: 22,
    stat: 360,
    statMedium: 200,
  },

  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },

  lineHeight: {
    tight: 0.95,
    snug: 1.15,
    normal: 1.45,
    relaxed: 1.65,
  },

  letterSpacing: {
    display: '0.01em',
    label: '0.18em',
    body: '-0.01em',
    bodyTight: '-0.02em',
  },

  spacing: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 40,
    xl: 64,
    xxl: 96,
    xxxl: 160,
    huge: 240,
  },

  safeArea: {
    horizontal: 140,
    vertical: 100,
  },

  radius: {
    none: 0,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 40,
    pill: 9999,
  },

  motion: {
    duration: {
      instant: 6,
      fast: 12,
      base: 18,
      slow: 30,
      slower: 45,
    },
    spring: {
      gentle:  { damping: 20, stiffness: 80,  mass: 1 },
      stiff:   { damping: 25, stiffness: 200, mass: 1 },
      impact:  { damping: 18, stiffness: 260, mass: 1 },
      bouncy:  { damping: 10, stiffness: 100, mass: 1 },
    },
  },

  video: {
    fps: 30,
    width: 1920,
    height: 1080,
  },
} as const;
```

---

## `src/theme/brand.ts`

```ts
// src/theme/brand.ts
// BRAND TOKENS — identidade visual do curso/usuário.
// No MVP: hardcoded com fallback padrão.
// Futuro: será injetado dinamicamente via prop ou config do usuário.

export type BrandConfig = {
  backgroundDark: string;
  backgroundLight: string;
  accentPrimary: string;
  accentSecondary: string;
  textOnDark: string;
  textOnDarkMuted: string;
  textOnLight: string;
  textOnLightMuted: string;
  logoUrl?: string;
  brandName?: string;
};

export const defaultBrand: BrandConfig = {
  backgroundDark:  '#0B0F1E',
  backgroundLight: '#F5F1EA',
  accentPrimary:   '#F59E0B',
  accentSecondary: '#FB7185',
  textOnDark:      '#F5F1EA',
  textOnDarkMuted: '#9CA3AF',
  textOnLight:     '#0B0F1E',
  textOnLightMuted:'#5C5C5C',
  logoUrl:         undefined,
  brandName:       'aulacraft',
};
```

---

## `src/theme/index.ts`

```ts
// src/theme/index.ts

import { system } from './system';
import { defaultBrand, type BrandConfig } from './brand';

export { system } from './system';
export { defaultBrand, type BrandConfig } from './brand';

export function composeTheme(brand: BrandConfig = defaultBrand) {
  return {
    colors: {
      backgroundDark:   brand.backgroundDark,
      backgroundLight:  brand.backgroundLight,
      accentPrimary:    brand.accentPrimary,
      accentSecondary:  brand.accentSecondary,
      textOnDark:       brand.textOnDark,
      textOnDarkMuted:  brand.textOnDarkMuted,
      textOnLight:      brand.textOnLight,
      textOnLightMuted: brand.textOnLightMuted,
    },
    brand: {
      logoUrl:   brand.logoUrl,
      brandName: brand.brandName,
    },
    fonts:         system.fonts,
    fontSize:      system.fontSize,
    fontWeight:    system.fontWeight,
    lineHeight:    system.lineHeight,
    letterSpacing: system.letterSpacing,
    spacing:       system.spacing,
    safeArea:      system.safeArea,
    radius:        system.radius,
    motion:        system.motion,
    video:         system.video,
  };
}

export type Theme = ReturnType<typeof composeTheme>;
```

---

## `src/components/SceneFrame.tsx`

```tsx
// src/components/SceneFrame.tsx

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
  mode?: ThemeMode;
  caption?: string;
  showBranding?: boolean;
  children: React.ReactNode;
  enterAtFrame?: number;
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

  const enterProgress = spring({
    frame: frame - enterAtFrame,
    fps,
    config: theme.motion.spring.gentle,
  });

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
      <AbsoluteFill
        style={{
          paddingLeft: theme.safeArea.horizontal,
          paddingRight: theme.safeArea.horizontal,
          paddingTop: theme.safeArea.vertical,
          paddingBottom: caption
            ? theme.safeArea.vertical + 160
            : theme.safeArea.vertical,
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </AbsoluteFill>

      {caption && (
        <CaptionStrip mode={mode} text={caption} progress={enterProgress} />
      )}

      {showBranding && <Branding mode={mode} />}
    </AbsoluteFill>
  );
};

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
```
