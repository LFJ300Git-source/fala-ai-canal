// src/storyboard-schema.ts
//
// Schema de dados do storyboard. Cada cena é uma entrada em uma
// discriminated union: o campo `type` identifica qual template renderiza,
// e o campo `props` carrega exatamente os props daquele template.
//
// Os tipos de props são importados diretamente dos arquivos dos templates
// — eles são a fonte da verdade. NÃO redeclarar tipos aqui.
//
// stockQuery: metadado de geração (busca Pexels na Fase 4).
// narrationText: o trecho do roteiro original falado nesta cena (fiel,
//   fluido). A concatenação de todos reconstrói o roteiro inteiro.
//   Distinto do que aparece na tela (caption/words/impact/quote).

import type { AIOpenerSceneProps } from './compositions/AIOpenerScene';
import type { StockHeroSceneProps } from './compositions/StockHeroScene';
import type { TypeImpactSceneProps } from './compositions/TypeImpactScene';
import type { StockOverlaySceneProps } from './compositions/StockOverlayScene';
import type { TypeQuoteSceneProps } from './compositions/TypeQuoteScene';
import type { AICloserSceneProps } from './compositions/AICloserScene';

export type StoryboardScene =
  | { type: 'AIOpenerScene'; durationInFrames: number; narrationText: string; props: AIOpenerSceneProps }
  | { type: 'StockHeroScene'; durationInFrames: number; narrationText: string; stockQuery?: string; clipDurationInSeconds?: number; props: StockHeroSceneProps }
  | { type: 'TypeImpactScene'; durationInFrames: number; narrationText: string; props: TypeImpactSceneProps }
  | { type: 'StockOverlayScene'; durationInFrames: number; narrationText: string; stockQuery?: string; clipDurationInSeconds?: number; props: StockOverlaySceneProps }
  | { type: 'TypeQuoteScene'; durationInFrames: number; narrationText: string; props: TypeQuoteSceneProps }
  | { type: 'AICloserScene'; durationInFrames: number; narrationText: string; props: AICloserSceneProps };

export type VisualMix = {
  stock: number;
  type: number;
  ai: number;
};

export type Storyboard = {
  version: 1;
  totalDurationInFrames: number;
  audioUrl: string | null;
  visualMix: VisualMix;
  scenes: StoryboardScene[];
};
