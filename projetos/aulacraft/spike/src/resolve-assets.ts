// src/resolve-assets.ts
//
// Orquestrador da Fase 4a. Lê assets/storyboard.json, resolve os assets faltantes:
// - Stock videos (StockHeroScene, StockOverlayScene) via fetchStock
// - IA backgrounds (AIOpenerScene, AICloserScene) via buildAiPrompt + generateAbstract
// Escreve assets/storyboard.resolved.json com os paths preenchidos.
// Tolerância a falha: cada cena roda em try/catch. Falhas são registradas,
// não abortam o processo.

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { fetchStock } from './fetch-stock';
import { generateAbstract } from './generate-abstract';
import { buildAiPrompt } from './build-ai-prompt';
import { getAudioDurationSeconds } from './audio-duration';
import { DEFAULT_WORK_DIR, getJobPaths } from './paths';
import type { Storyboard, StoryboardScene } from './storyboard-schema';

interface Failure {
  index: number;
  type: string;
  reason: string;
}

export async function resolveAssets(workDir: string = DEFAULT_WORK_DIR): Promise<void> {
  const { storyboardPath, resolvedPath } = getJobPaths(workDir);

  console.log(`\n[resolve-assets] Lendo ${storyboardPath}...\n`);

  const raw = fs.readFileSync(storyboardPath, 'utf-8');
  const storyboard = JSON.parse(raw) as Storyboard;

  const scenes = storyboard.scenes;
  const failures: Failure[] = [];
  let resolved = 0;
  let skipped = 0;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const type = scene.type;

    try {
      // Stock cenas (video)
      if (type === 'StockHeroScene' || type === 'StockOverlayScene') {
        const props = scene.props as any;
        const clipAlreadyResolved = props.videoSrc && props.videoSrc.trim().length > 0;
        const clipDurationAlreadyResolved = (scene as any).clipDurationInSeconds !== undefined;

        // Se ambos resolvidos, pule tudo
        if (clipAlreadyResolved && clipDurationAlreadyResolved) {
          console.log(`  [${i}] ${type} — videoSrc e duração já resolvidos, pulando`);
          skipped++;
          continue;
        }

        // Se clip não resolvido, busque-o
        if (!clipAlreadyResolved) {
          const stockQuery = (scene as any).stockQuery;
          if (!stockQuery || stockQuery.trim().length === 0) {
            throw new Error('stockQuery ausente ou vazio');
          }

          console.log(`  [${i}] ${type} — buscando stock: "${stockQuery}"`);
          const videoPath = await fetchStock(stockQuery, workDir);
          props.videoSrc = videoPath;
          resolved++;
          console.log(`       ✓ resolvido: ${videoPath}`);
        }

        // Medir duração se ainda não temos (idempotência: se temos, não meça de novo)
        if (!clipDurationAlreadyResolved) {
          try {
            const diskPath = path.join(workDir, props.videoSrc);
            const durationSeconds = getAudioDurationSeconds(diskPath);
            (scene as any).clipDurationInSeconds = durationSeconds;
            console.log(`       ✓ duração medida: ${durationSeconds.toFixed(2)}s (${Math.round(durationSeconds * 30)} frames @ 30fps)`);
          } catch (err) {
            console.warn(`       ⚠️  Não foi possível medir duração: ${(err as Error).message}`);
            // Não aborta: o vídeo foi resolvido, só falta a duração para o loop ativar
          }
        }
      }
      // IA cenas (fundo)
      else if (type === 'AIOpenerScene' || type === 'AICloserScene') {
        const props = scene.props as any;
        if (props.backgroundSrc && props.backgroundSrc.trim().length > 0) {
          console.log(`  [${i}] ${type} — backgroundSrc já resolvido, pulando`);
          skipped++;
          continue;
        }

        console.log(`  [${i}] ${type} — gerando fundo de IA`);
        const prompt = await buildAiPrompt(scene);
        const outputName = `ai/ai-${i}-${type}.png`;
        const bgPath = await generateAbstract(prompt, outputName, workDir);
        props.backgroundSrc = bgPath;
        resolved++;
        console.log(`       ✓ resolvido: ${bgPath}`);
      }
      // Outros tipos (TypeImpact, TypeQuote) não têm assets
      else {
        console.log(`  [${i}] ${type} — nenhum asset externo, pulando`);
        skipped++;
      }
    } catch (err) {
      const reason = (err as Error).message;
      console.log(`  [${i}] ${type} — ERRO: ${reason}`);
      failures.push({ index: i, type, reason });
    }
  }

  // Escreve o storyboard resolvido (com falhas parciais ou não)
  console.log(`\n[resolve-assets] Escrevendo ${resolvedPath}...\n`);
  const resolved_storyboard: Storyboard = {
    version: storyboard.version,
    totalDurationInFrames: storyboard.totalDurationInFrames,
    audioUrl: storyboard.audioUrl,
    visualMix: storyboard.visualMix,
    scenes: storyboard.scenes,
  };

  fs.writeFileSync(resolvedPath, JSON.stringify(resolved_storyboard, null, 2), 'utf-8');

  // Relatório final
  console.log(`=== RESOLVE-ASSETS REPORT ===\n`);
  console.log(`Total de cenas: ${scenes.length}`);
  console.log(`Resolvidas: ${resolved}`);
  console.log(`Puladas (já resolvidas): ${skipped}`);
  console.log(`Falhadas: ${failures.length}\n`);

  if (failures.length > 0) {
    console.log('⚠️  FALHAS ENCONTRADAS:');
    failures.forEach((f) => {
      console.log(`   [${f.index}] ${f.type}: ${f.reason}`);
    });
    console.log(
      `\n❌ storyboard.resolved.json foi escrito, mas ${failures.length} cena(s) não tem asset.`
    );
    console.log(
      '   NÃO está pronto pra render. Re-rode para tentar de novo (cenas OK serão puladas).\n'
    );
  } else {
    console.log(
      '✅ Todas as cenas resolvidas. storyboard.resolved.json pronto para render.\n'
    );
  }
}

if (require.main === module) {
  resolveAssets().catch((err) => {
    console.error(`\n[resolve-assets] ERRO CRÍTICO: ${(err as Error).message}\n`);
    process.exit(1);
  });
}
