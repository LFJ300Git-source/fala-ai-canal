// Vivid saturated palette — high energy, cheerful, NOT cinematic dark
export const PALETTE = {
  electricBlue: '#0ea5e9',
  hotPink: '#ec4899',
  lime: '#a3e635',
  sunYellow: '#facc15',
  magenta: '#d946ef',
  cyan: '#22d3ee',
  orange: '#fb923c',
  emerald: '#10b981',
  violet: '#8b5cf6',
  rose: '#fb7185',
};

export const PALETTE_ARR = Object.values(PALETTE);

// Use this for backgrounds — fully saturated rainbow loop
export const BG_GRADIENT_STOPS = [
  PALETTE.electricBlue,
  PALETTE.violet,
  PALETTE.hotPink,
  PALETTE.orange,
  PALETTE.sunYellow,
  PALETTE.lime,
  PALETTE.cyan,
];

export const FONT_STACK = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
