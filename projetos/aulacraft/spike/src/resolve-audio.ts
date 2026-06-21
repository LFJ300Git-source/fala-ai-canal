import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { generateNarrationFromText } from './tts';
import { getAudioDurationSeconds } from './audio-duration';
import type { Storyboard, StoryboardScene } from './storyboard-schema';

const FPS = 30;
const MIN_FRAMES = 45;
const STORYBOARD_PATH = path.resolve(__dirname, '../assets/storyboard.resolved.json');
const NARRATION_DIR = path.resolve(__dirname, '../assets/narration');
const FINAL_AUDIO_PATH = path.resolve(__dirname, '../assets/narration.mp3');
const TTS_REQUESTS_PER_MINUTE = 3;
const TTS_THROTTLE_MS = Math.ceil(60000 / TTS_REQUESTS_PER_MINUTE);
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface SceneAudioResult {
  index: number;
  type: string;
  narrationPath: string;
  durationSeconds: number;
  durationInFrames: number;
}

interface FailureRecord {
  index: number;
  type: string;
  reason: string;
}

export async function resolveAudio(): Promise<void> {
  console.log(`\n[resolve-audio] Lendo ${STORYBOARD_PATH}...\n`);

  const raw = fs.readFileSync(STORYBOARD_PATH, 'utf-8');
  const storyboard = JSON.parse(raw) as Storyboard;

  const scenes = storyboard.scenes;
  const results: SceneAudioResult[] = [];
  const failures: FailureRecord[] = [];
  let narrated = 0;
  let skipped = 0;
  let isFirstRealGeneration = true;

  // Process each scene
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const type = scene.type;

    try {
      // Skip scenes without narrationText
      if (!scene.narrationText || scene.narrationText.trim().length === 0) {
        throw new Error('narrationText is empty');
      }

      const scenePath = path.join(NARRATION_DIR, `scene-${i}.mp3`);

      // Check for idempotency
      let durationSeconds: number;
      if (fs.existsSync(scenePath)) {
        console.log(`  [${i}] ${type} — narração já existe, medindo duração`);
        skipped++;
        durationSeconds = getAudioDurationSeconds(scenePath);
      } else {
        // Throttle: respect Gemini TTS free tier rate limit (3 requests/minute)
        if (!isFirstRealGeneration) {
          console.log(`[throttle] aguardando ${TTS_THROTTLE_MS / 1000}s pra respeitar rate limit do Gemini...`);
          await sleep(TTS_THROTTLE_MS);
        }
        console.log(`  [${i}] ${type} — gerando narração`);
        await generateNarrationFromText(scene.narrationText, scenePath);
        durationSeconds = getAudioDurationSeconds(scenePath);
        narrated++;
        console.log(`       ✓ duração: ${durationSeconds.toFixed(2)}s`);
        isFirstRealGeneration = false;
      }

      const durationInFrames = Math.max(MIN_FRAMES, Math.round(durationSeconds * FPS));
      (scene as any).durationInFrames = durationInFrames;

      results.push({
        index: i,
        type,
        narrationPath: scenePath,
        durationSeconds,
        durationInFrames,
      });
    } catch (err) {
      const reason = (err as Error).message;
      console.log(`  [${i}] ${type} — ERRO: ${reason}`);
      failures.push({ index: i, type, reason });
    }
  }

  // Concatenate audio and update totalDurationInFrames only if no failures
  let audioUrl: string | null = null;
  let totalDurationInFrames = storyboard.totalDurationInFrames;

  if (failures.length === 0 && results.length > 0) {
    console.log(`\n[resolve-audio] Concatenando ${results.length} cenas em trilha única...\n`);

    // Create concat list in correct order
    const concatListPath = path.join(NARRATION_DIR, 'concat-list.txt');
    const concatLines = results.map(
      (r) => `file '${path.basename(r.narrationPath)}'`
    );

    fs.writeFileSync(concatListPath, concatLines.join('\n'), 'utf-8');

    try {
      const cmd = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${FINAL_AUDIO_PATH}"`;
      execSync(cmd, { stdio: 'inherit' });
      console.log(`\n✅ Trilha gerada em ${FINAL_AUDIO_PATH}`);

      audioUrl = 'narration.mp3';
      // Recalculate totalDurationInFrames with all processed scenes (zero failures means all have real duration)
      totalDurationInFrames = results.reduce((sum, r) => sum + r.durationInFrames, 0);
    } finally {
      if (fs.existsSync(concatListPath)) {
        fs.unlinkSync(concatListPath);
      }
    }
  }
  // If failures.length > 0: totalDurationInFrames is NOT recalculated; it preserves the original value

  // Update storyboard
  console.log(`\n[resolve-audio] Atualizando ${STORYBOARD_PATH}...\n`);
  const updated: Storyboard = {
    ...storyboard,
    audioUrl,
    totalDurationInFrames,
  };

  fs.writeFileSync(STORYBOARD_PATH, JSON.stringify(updated, null, 2), 'utf-8');

  // Report
  console.log(`=== RESOLVE-AUDIO REPORT ===\n`);
  console.log(`Total de cenas: ${scenes.length}`);
  console.log(`Narradas: ${narrated}`);
  console.log(`Puladas (já existiam): ${skipped}`);
  console.log(`Falhadas: ${failures.length}\n`);

  if (failures.length > 0) {
    console.log('⚠️  FALHAS ENCONTRADAS:');
    failures.forEach((f) => {
      console.log(`   [${f.index}] ${f.type}: ${f.reason}`);
    });
    console.log(
      `\n❌ Trilha NÃO foi gerada devido a ${failures.length} falha(s).`
    );
    console.log(
      '   storyboard.resolved.json tem durações das cenas que processaram.'
    );
    console.log('   Re-rode: cenas com MP3 serão puladas, só as que falharam serão retentadas.\n'
    );
  } else if (results.length === 0) {
    console.log('⚠️  Nenhuma cena foi processada.\n');
  } else {
    console.log(`✅ Narração completa.`);
    console.log(
      `   Trilha: assets/narration.mp3`
    );
    console.log(
      `   Duração total: ${(totalDurationInFrames / FPS).toFixed(1)}s (${totalDurationInFrames} frames)`
    );
    console.log(
      `   storyboard.resolved.json atualizado com durações reais + audioUrl.\n`
    );
  }
}

if (require.main === module) {
  resolveAudio().catch((err) => {
    console.error(`\n[resolve-audio] ERRO CRÍTICO: ${(err as Error).message}\n`);
    process.exit(1);
  });
}
