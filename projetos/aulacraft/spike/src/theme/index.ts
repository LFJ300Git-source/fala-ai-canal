// src/theme/index.ts
// Helper que combina system + brand pros templates consumirem
// como um único objeto. Mantém a separação conceitual mas oferece
// API simples no lugar de uso.

import { system } from './system';
import { defaultBrand, type BrandConfig } from './brand';

export { system } from './system';
export { defaultBrand, type BrandConfig } from './brand';

/**
 * Compõe um theme completo a partir de uma configuração de brand
 * (opcional — usa o fallback padrão se não passar nada).
 *
 * Uso nos templates:
 *   const theme = composeTheme();
 *   theme.colors.accentPrimary    // do brand
 *   theme.fontSize.display1       // do system
 *   theme.motion.spring.impact    // do system
 */
export function composeTheme(brand: BrandConfig = defaultBrand) {
  return {
    // Cores vêm do BRAND (customizáveis)
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
    // Tudo do SYSTEM (fixo do Aulacraft)
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
