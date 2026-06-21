import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs';
import { generateStoryboard } from './storyboard';

const ASSETS_DIR = path.resolve(__dirname, '../assets');
const SCRIPT_PATH = path.join(ASSETS_DIR, 'script.txt');
const STORYBOARD_PATH = path.join(ASSETS_DIR, 'storyboard.json');

export async function runGenerateStoryboard() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set in .env');
  }

  const script = fs.readFileSync(SCRIPT_PATH, 'utf-8');

  console.log(`📜 Gerando storyboard a partir de ${script.length} caracteres de roteiro...`);

  const storyboard = await generateStoryboard(script);

  fs.writeFileSync(STORYBOARD_PATH, JSON.stringify(storyboard, null, 2));
  console.log(`💾 Storyboard salvo em: ${STORYBOARD_PATH}`);
  console.log(`📊 ${storyboard.scenes.length} cenas`);
  console.log(`📈 visualMix: stock=${storyboard.visualMix.stock}, type=${storyboard.visualMix.type}, ai=${storyboard.visualMix.ai}`);
}

if (require.main === module) {
  runGenerateStoryboard().catch((err) => {
    console.error('❌ Falhou:', err.message);
    process.exit(1);
  });
}
