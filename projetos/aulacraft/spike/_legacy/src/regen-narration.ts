import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs';
import { generateNarration } from './tts';
import { mixAudio } from './music';

const ASSETS_DIR = path.resolve(__dirname, '../assets');
const SCRIPT_PATH = path.join(ASSETS_DIR, 'script.txt');
const NARRATION_PATH = path.join(ASSETS_DIR, 'narration.mp3');
const MUSIC_PATH = path.join(ASSETS_DIR, 'music.mp3');
const MIXED_AUDIO_PATH = path.join(ASSETS_DIR, 'mixed_audio.mp3');

async function run() {
  await generateNarration(SCRIPT_PATH, NARRATION_PATH);
  if (fs.existsSync(MUSIC_PATH)) {
    mixAudio(NARRATION_PATH, MUSIC_PATH, MIXED_AUDIO_PATH);
  }
  console.log('Done.');
}

run().catch((err) => { console.error(err); process.exit(1); });
