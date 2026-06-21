import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { DEFAULT_WORK_DIR, getJobPaths } from './paths';
import type { Storyboard } from './storyboard-schema';

const COMPOSITION_ID = 'LessonRenderer';
const ENTRY_POINT = path.resolve(__dirname, './index.ts');

export async function runRender(workDir: string = DEFAULT_WORK_DIR) {
  const { resolvedPath, outputPath } = getJobPaths(workDir);
  console.log(`📂 publicDir (workDir): ${workDir}`);

  console.log('\n🎬 AulaCraft Local Render — Lesson (LessonRenderer)\n');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // Read resolved storyboard
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Missing ${resolvedPath}. Run resolve-audio.ts first (Phase 4b).`);
  }

  const storyboard = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8')) as Storyboard;
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
    publicDir: workDir,
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
    outputLocation: outputPath,
    inputProps,
    onProgress: ({ progress }) => {
      process.stdout.write(`\r   Rendering... ${Math.round(progress * 100)}%`);
    },
  });

  console.log(`\n\n🎉 Lesson saved at: ${outputPath}`);
}

if (require.main === module) {
  const arg = process.argv[2];
  const workDir = arg ? path.resolve(arg) : DEFAULT_WORK_DIR;
  runRender(workDir).catch((err) => {
    console.error('\n❌', err.message);
    process.exit(1);
  });
}
