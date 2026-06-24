// src/storyboard-zod.ts
//
// Schema Zod pra validar em runtime o storyboard gerado pelo Sonnet.
// Espelha a discriminated union de storyboard-schema.ts.
// Usado em storyboard.ts pra validar o JSON parseado (com retry).
//
// MANTER SINCRONIZADO com storyboard-schema.ts e com as props reais
// dos 6 templates.

import { z } from 'zod';

const emphasisSchema = z.enum(['normal', 'display-huge', 'editorial-italic']);

const impactWordSchema = z.object({
  text: z.string(),
  emphasis: emphasisSchema,
});

// --- Props por template ---

const aiOpenerProps = z.object({
  backgroundSrc: z.string(),
  eyebrow: z.string(),
  title: z.string(),
  subtitle: z.string(),
});

const stockHeroProps = z.object({
  videoSrc: z.string(),
  caption: z.string(),
  eyebrow: z.string(),
  showBranding: z.boolean(),
  gradeIntensity: z.number(),
});

const typeImpactProps = z.object({
  preLine: z.string(),
  number: z.string(),
  numberLabel: z.string(),
  words: z.array(impactWordSchema),
});

const stockOverlayProps = z.object({
  videoSrc: z.string(),
  eyebrow: z.string(),
  impact: z.string(),
  gradeIntensity: z.number(),
});

const typeQuoteProps = z.object({
  quote: z.string(),
  author: z.string(),
  authorTitle: z.string(),
});

const aiCloserProps = z.object({
  backgroundSrc: z.string(),
  eyebrow: z.string(),
  title: z.string(),
  ctaLabel: z.string(),
  ctaText: z.string(),
  brandName: z.string(),
});

// --- Cenas (discriminated union por type) ---

const sceneSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('AIOpenerScene'),
    durationInFrames: z.number().int(),
    narrationText: z.string().min(1, 'narrationText nao pode ser vazio'),
    props: aiOpenerProps,
  }),
  z.object({
    type: z.literal('StockHeroScene'),
    durationInFrames: z.number().int(),
    narrationText: z.string().min(1, 'narrationText nao pode ser vazio'),
    stockQuery: z.string().optional(),
    clipDurationInSeconds: z.number().optional(),
    props: stockHeroProps,
  }),
  z.object({
    type: z.literal('TypeImpactScene'),
    durationInFrames: z.number().int(),
    narrationText: z.string().min(1, 'narrationText nao pode ser vazio'),
    props: typeImpactProps,
  }),
  z.object({
    type: z.literal('StockOverlayScene'),
    durationInFrames: z.number().int(),
    narrationText: z.string().min(1, 'narrationText nao pode ser vazio'),
    stockQuery: z.string().optional(),
    clipDurationInSeconds: z.number().optional(),
    props: stockOverlayProps,
  }),
  z.object({
    type: z.literal('TypeQuoteScene'),
    durationInFrames: z.number().int(),
    narrationText: z.string().min(1, 'narrationText nao pode ser vazio'),
    props: typeQuoteProps,
  }),
  z.object({
    type: z.literal('AICloserScene'),
    durationInFrames: z.number().int(),
    narrationText: z.string().min(1, 'narrationText nao pode ser vazio'),
    props: aiCloserProps,
  }),
]);

export const storyboardSchema = z.object({
  version: z.literal(1),
  totalDurationInFrames: z.number().int(),
  audioUrl: z.string().nullable(),
  visualMix: z.object({
    stock: z.number(),
    type: z.number(),
    ai: z.number(),
  }),
  scenes: z.array(sceneSchema),
});
