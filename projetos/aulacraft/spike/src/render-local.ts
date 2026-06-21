import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import type { Storyboard } from './storyboard-schema';

const ASSETS_DIR = path.resolve(__dirname, '../assets');
const OUTPUT_DIR = path.resolve(__dirname, '../output');
const STORYBOARD_PATH = path.join(ASSETS_DIR, 'storyboard.resolved.json');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'lesson.mp4');
const COMPOSITION_ID = 'LessonRenderer';
const ENTRY_POINT = path.resolve(__dirname, './index.ts');

export async function runRender() {
  console.log('\n🎬 AulaCraft Local Render — Lesson (LessonRenderer)\n');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Read resolved storyboard
  if (!fs.existsSync(STORYBOARD_PATH)) {
    throw new Error(`Missing ${STORYBOARD_PATH}. Run resolve-audio.ts first (Phase 4b).`);
  }

  const storyboard = JSON.parse(fs.readFileSync(STORYBOARD_PATH, 'utf-8')) as Storyboard;
  console.log(`📋 Loaded storyboard: ${storyboard.scenes.length} scenes, ${storyboard.totalDurationInFrames} frames`);

  // Validation: audioUrl must be present
  if (!storyboard.audioUrl) {
    throw new Error('storyboard.resolved.json does not have audioUrl — run resolve-audio.ts before rendering.');
  }

  // Validation: check for missing assets (warn, don't block)
  const missingScenesWarnings: string[] = [];
  storyboard.scenes.forEach((scene, i) => {
    if ((scene.type === 'StockHeroScene' || scene.type === 'StockOverlayScene') && (scene.props as any).videoSrc === '') {
      missingScenesWarnings.push(`[${i}] ${scene.type}: videoSrc is empty`);
    }
    if ((scene.type === 'AIOpenerScene' || scene.type === 'AICloserScene') && (scene.props as any).backgroundSrc === '') {
      missingScenesWarnings.push(`[${i}] ${scene.type}: backgroundSrc is empty`);
    }
  });

  if (missingScenesWarnings.length > 0) {
    console.warn('\n⚠️  Some scenes have missing assets (but render will attempt to proceed):');
    missingScenesWarnings.forEach((w) => console.warn(`   ${w}`));
    console.warn('');
  }

  const inputProps = { storyboard };

  console.log('\n📦 Bundling Remotion composition...');
  const serveUrl = await bundle({
    entryPoint: ENTRY_POINT,
    publicDir: ASSETS_DIR,
    onProgress: (p) => process.stdout.write(`\r   Bundling... ${p}%`),
  });
  console.log('\n✅ Bundle ready');

  console.log('\n🔍 Selecting composition...');
  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps,
  });
  console.log(`✅ Composition: ${composition.durationInFrames} frames @ ${composition.fps}fps (${(composition.durationInFrames / composition.fps).toFixed(1)}s)`);

  console.log('\n🎥 Rendering MP4 locally...');
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation: OUTPUT_PATH,
    inputProps,
    onProgress: ({ progress }) => {
      process.stdout.write(`\r   Rendering... ${Math.round(progress * 100)}%`);
    },
  });

  console.log(`\n\n🎉 Lesson saved at: ${OUTPUT_PATH}`);
}

if (require.main === module) {
  runRender().catch((err) => {
    console.error('\n❌ Render failed:', err.message);
    process.exit(1);
  });
}
