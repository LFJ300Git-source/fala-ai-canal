import 'dotenv/config';
import * as fs from 'fs';
import { generateStoryboard } from './storyboard';
import { DEFAULT_WORK_DIR, getJobPaths } from './paths';

export async function runGenerateStoryboard(workDir: string = DEFAULT_WORK_DIR) {
  const { scriptPath, storyboardPath } = getJobPaths(workDir);

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set in .env');
  }

  const script = fs.readFileSync(scriptPath, 'utf-8');

  console.log(`📜 Gerando storyboard a partir de ${script.length} caracteres de roteiro...`);

  const storyboard = await generateStoryboard(script);

  fs.writeFileSync(storyboardPath, JSON.stringify(storyboard, null, 2));
  console.log(`💾 Storyboard salvo em: ${storyboardPath}`);
  console.log(`📊 ${storyboard.scenes.length} cenas`);
  console.log(`📈 visualMix: stock=${storyboard.visualMix.stock}, type=${storyboard.visualMix.type}, ai=${storyboard.visualMix.ai}`);
}

if (require.main === module) {
  runGenerateStoryboard().catch((err) => {
    console.error('❌ Falhou:', err.message);
    process.exit(1);
  });
}
