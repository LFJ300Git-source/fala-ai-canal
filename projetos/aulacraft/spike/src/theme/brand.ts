// src/theme/brand.ts
// BRAND TOKENS — identidade visual do curso/usuário.
// No MVP: hardcoded com fallback padrão.
// Futuro: será injetado dinamicamente via prop ou config do usuário.

export type BrandConfig = {
  /** Cor de fundo principal das cenas escuras */
  backgroundDark: string;
  /** Cor de fundo principal das cenas claras (alternativo) */
  backgroundLight: string;
  /** Acento PRINCIPAL — usado em destaques, leader lines, highlights */
  accentPrimary: string;
  /** Acento SECUNDÁRIO — usado em CTAs emocionais, transições */
  accentSecondary: string;
  /** Cor de texto principal sobre fundo escuro */
  textOnDark: string;
  /** Cor de texto secundário sobre fundo escuro */
  textOnDarkMuted: string;
  /** Cor de texto principal sobre fundo claro */
  textOnLight: string;
  /** Cor de texto secundário sobre fundo claro */
  textOnLightMuted: string;
  /** URL do logo (opcional) */
  logoUrl?: string;
  /** Nome da marca/curso (exibido em marca d'água) */
  brandName?: string;
};

// ===== FALLBACK PADRÃO DO AULACRAFT =====
// Usado quando o usuário ainda não customizou a identidade do curso.
// Paleta neutra-premium: dourado em fundo escuro = autoridade + conhecimento.
export const defaultBrand: BrandConfig = {
  backgroundDark:  '#0B0F1E',   // azul-marinho profundo
  backgroundLight: '#F5F1EA',   // creme suave
  accentPrimary:   '#F59E0B',   // âmbar dourado
  accentSecondary: '#FB7185',   // coral suave
  textOnDark:      '#F5F1EA',
  textOnDarkMuted: '#9CA3AF',
  textOnLight:     '#0B0F1E',
  textOnLightMuted:'#5C5C5C',
  logoUrl:         undefined,
  brandName:       'aulacraft',
};
