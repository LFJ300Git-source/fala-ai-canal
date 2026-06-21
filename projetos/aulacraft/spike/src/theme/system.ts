// src/theme/system.ts
// SYSTEM TOKENS — DNA do Aulacraft.
// Define tipografia, escala, motion e layout. Não é customizável
// pelo usuário do curso. Só o time do Aulacraft pode alterar.

export const system = {
  // ===== TIPOGRAFIA =====
  fonts: {
    // Display: Bebas Neue (sans condensada ousada) pra TÍTULOS gigantes
    display: 'Bebas Neue',
    // Body: Inter (sans geométrica neutra) pra corpo e UI
    body: 'Inter',
    editorial: 'Fraunces',
    // Mono: pra números, stats, códigos
    mono: 'Space Mono',
  },

  // Escala tipográfica AMPLA — alto contraste entre títulos e corpo.
  // Base: 1080p (1920x1080). Pra 4K multiplicar tudo por 2 via helper.
  fontSize: {
    // Display (Bebas Neue) — escala documentário, MUITO grande
    displayHero: 280,    // título-bomba de abertura
    display1: 220,       // título de cena principal
    display2: 160,       // título secundário
    display3: 120,       // subtítulo grande

    // Body (Inter) — informação e UI
    bodyLarge: 52,       // caption principal, body grande
    body: 40,            // corpo padrão
    bodyMedium: 32,      // corpo médio
    bodySmall: 26,       // labels, anotações
    bodyTiny: 22,        // meta-info, créditos

    // Mono — números gigantes de stat
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
    tight: 0.95,         // Bebas Neue em uppercase grande
    snug: 1.15,
    normal: 1.45,
    relaxed: 1.65,
  },

  letterSpacing: {
    // Bebas Neue precisa de spacing positivo em uppercase
    display: '0.01em',
    // Labels editoriais (uppercase pequeno)
    label: '0.18em',
    // Corpo
    body: '-0.01em',
    // Títulos grandes em weight pesado pedem negative
    bodyTight: '-0.02em',
  },

  // ===== ESPAÇAMENTO =====
  // Grid de 8pt. Sempre múltiplos de 8.
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

  // ===== SAFE AREA =====
  safeArea: {
    horizontal: 140,
    vertical: 100,
  },

  // ===== RAIO DE BORDA =====
  radius: {
    none: 0,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 40,
    pill: 9999,
  },

  // ===== MOTION =====
  motion: {
    // Durações em frames (assumindo 30fps).
    duration: {
      instant: 6,        // 200ms
      fast: 12,          // 400ms
      base: 18,          // 600ms
      slow: 30,          // 1000ms
      slower: 45,        // 1500ms
    },
    spring: {
      // Pra usar com spring() do Remotion
      gentle:  { damping: 20, stiffness: 80,  mass: 1 },
      stiff:   { damping: 25, stiffness: 200, mass: 1 },
      impact:  { damping: 18, stiffness: 260, mass: 1 },  // entrada cinematográfica
      bouncy:  { damping: 10, stiffness: 100, mass: 1 },
    },
  },

  // ===== VÍDEO =====
  video: {
    fps: 30,
    width: 1920,
    height: 1080,
  },
} as const;
