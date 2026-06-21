// src/fill-clip-durations.ts
//
// Script isolado que lê storyboard.resolved.json ATUAL e preenche
// clipDurationInSeconds para cenas de stock que não têm, sem mexer
// em outros campos (audioUrl, totalDurationInFrames, etc).

import * as fs from 'fs';
import * as path from 'path';
import { getAudioDurationSeconds } from './audio-duration';
import type { Storyboard } from './storyboard-schema';

const RESOLVED_PATH = path.resolve(__dirname, '../assets/storyboard.resolved.json');
const ASSETS_DIR = path.resolve(__dirname, '../assets');

async function fillClipDurations(): Promise<void> {
  console.log(`\n[fill-clip-durations] Lendo ${RESOLVED_PATH}...\n`);

  const raw = fs.readFileSync(RESOLVED_PATH, 'utf-8');
  const storyboard = JSON.parse(raw) as Storyboard;

  const scenes = storyboard.scenes;
  let filled = 0;
  let skipped = 0;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const type = scene.type;

    // Apenas processar cenas de stock
    if (type === 'StockHeroScene' || type === 'StockOverlayScene') {
      const props = scene.props as any;
      const clipDurationAlreadyResolved = (scene as any).clipDurationInSeconds !== undefined;

      if (clipDurationAlreadyResolved) {
        console.log(
          `  [${i}] ${type} — clipDurationInSeconds já preenchido (${(scene as any).clipDurationInSeconds}s), pulando`
        );
        skipped++;
        continue;
      }

      // Medir duração
      try {
        const diskPath = path.join(ASSETS_DIR, props.videoSrc);
        const durationSeconds = getAudioDurationSeconds(diskPath);
        (scene as any).clipDurationInSeconds = durationSeconds;
        filled++;
        console.log(
          `  [${i}] ${type} — duração medida: ${durationSeconds.toFixed(2)}s (${Math.round(durationSeconds * 30)} frames @ 30fps)`
        );
      } catch (err) {
        console.warn(`  [${i}] ${type} — ERRO ao medir: ${(err as Error).message}`);
      }
    }
  }

  // Reescrever storyboard.resolved.json (preservando toda estrutura)
  console.log(`\n[fill-clip-durations] Escrevendo ${RESOLVED_PATH}...\n`);
  fs.writeFileSync(RESOLVED_PATH, JSON.stringify(storyboard, null, 2), 'utf-8');

  // Relatório
  console.log(`=== FILL-CLIP-DURATIONS REPORT ===\n`);
  console.log(`Preenchidas: ${filled}`);
  console.log(`Já resolvidas (puladas): ${skipped}`);
  console.log(`\n✅ storyboard.resolved.json atualizado.\n`);
}

fillClipDurations().catch((err) => {
  console.error(`\n[fill-clip-durations] ERRO: ${(err as Error).message}\n`);
  process.exit(1);
});
