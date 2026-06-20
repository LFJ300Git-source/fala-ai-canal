import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import { generateNarration } from './tts';
import { generateImages } from './images';
import { downloadMusic, mixAudio } from './music';
import {
  getOrCreateBucket,
  deploySite,
  deployFunction,
  renderMediaOnLambda,
  getRenderProgress,
} from '@remotion/lambda';

const ASSETS_DIR = path.resolve(__dirname, '../assets');
const OUTPUT_DIR = path.resolve(__dirname, '../output');

const SCRIPT_PATH = path.join(ASSETS_DIR, 'script.txt');
const NARRATION_PATH = path.join(ASSETS_DIR, 'narration.mp3');
const MUSIC_PATH = path.join(ASSETS_DIR, 'music.mp3');
const MIXED_AUDIO_PATH = path.join(ASSETS_DIR, 'mixed_audio.mp3');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'demo.mp4');

const REGION = 'us-east-1' as const;
const PRIMARY_COLOR = '#6366f1';

function downloadFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(outputPath);
        downloadFile(response.headers.location!, outputPath).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

async function run() {
  console.log('\n🚀 AulaCraft Spike Pipeline\n');

  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Step 1 — Narration
  await generateNarration(SCRIPT_PATH, NARRATION_PATH);

  // Step 2 — Hero images
  const imagePaths = await generateImages(ASSETS_DIR);

  // Step 3 — Music
  let finalAudioPath = NARRATION_PATH;
  if (fs.existsSync(MUSIC_PATH)) {
    console.log('🎵 Music file found, mixing audio...');
    mixAudio(NARRATION_PATH, MUSIC_PATH, MIXED_AUDIO_PATH);
    finalAudioPath = MIXED_AUDIO_PATH;
  } else {
    console.log('⚠️  No music file at assets/music.mp3 — using narration only');
  }

  // Step 5 — Get or create S3 bucket
  console.log('\n📦 Setting up S3 bucket...');
  const { bucketName } = await getOrCreateBucket({ region: REGION });
  console.log(`✅ Bucket: ${bucketName}`);

  // Step 6 — Deploy Remotion site to S3
  console.log('\n📦 Deploying Remotion site to S3...');
  const { serveUrl } = await deploySite({
    bucketName,
    entryPoint: path.resolve(__dirname, './index.ts'),
    region: REGION,
    siteName: 'aulacraft-spike',
    options: {
      onBundleProgress: (p: number) => process.stdout.write(`\r   Bundling... ${p}%`),
    },
  });
  console.log(`\n✅ Site deployed: ${serveUrl}`);

  // Step 7 — Deploy Lambda function
  console.log('\n⚡ Deploying Lambda function...');
  const { functionName } = await deployFunction({
    region: REGION,
    timeoutInSeconds: 240,
    memorySizeInMb: 2048,
    createCloudWatchLogGroup: true,
  });
  console.log(`✅ Lambda: ${functionName}`);

  // Step 8 — Render on Lambda
  console.log('\n🎬 Rendering video on Lambda...');

  const sections = [
    { title: 'The Hook', imageUrl: `file://${imagePaths[0]}` },
    { title: 'Core Content', imageUrl: `file://${imagePaths[1]}` },
    { title: 'The Summary', imageUrl: `file://${imagePaths[2]}` },
  ];

  const { renderId, bucketName: renderBucket } = await renderMediaOnLambda({
    region: REGION,
    functionName,
    serveUrl,
    composition: 'LessonSummary',
    inputProps: {
      audioUrl: `file://${finalAudioPath}`,
      sections,
      primaryColor: PRIMARY_COLOR,
      secondaryColor: '#a5b4fc',
      title: 'How to Structure an Online Lesson',
    },
    codec: 'h264',
    outName: 'demo.mp4',
    framesPerLambda: 400,
  });

  // Step 9 — Poll until done
  let progress = 0;
  while (progress < 1) {
    await new Promise((r) => setTimeout(r, 3000));
    const status = await getRenderProgress({
      renderId,
      bucketName: renderBucket,
      functionName,
      region: REGION,
    });

    if (status.fatalErrorEncountered) {
      throw new Error(`Render failed: ${status.errors[0]?.message}`);
    }

    progress = status.overallProgress;
    process.stdout.write(`\r   Rendering... ${Math.round(progress * 100)}%`);

    if (status.done && status.outputFile) {
      console.log(`\n✅ Render complete!`);
      console.log(`\n⬇️  Downloading video...`);
      await downloadFile(status.outputFile, OUTPUT_PATH);
      console.log(`\n🎉 Demo saved at: output/demo.mp4`);
      break;
    }
  }
}

run().catch((err) => {
  console.error('\n❌ Pipeline failed:', err.message);
  process.exit(1);
});
