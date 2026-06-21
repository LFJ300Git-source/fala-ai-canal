import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs';
import { runGenerateStoryboard } from './generate-storyboard';
import { resolveAssets } from './resolve-assets';
import { resolveAudio } from './resolve-audio';
import { runRender } from './render-local';

const ASSETS_DIR = path.resolve(__dirname, '../assets');
const OUTPUT_DIR = path.resolve(__dirname, '../output');
const SCRIPT_PATH = path.join(ASSETS_DIR, 'script.txt');
const STORYBOARD_PATH = path.join(ASSETS_DIR, 'storyboard.json');
const RESOLVED_PATH = path.join(ASSETS_DIR, 'storyboard.resolved.json');
const NARRATION_PATH = path.join(ASSETS_DIR, 'narration.mp3');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'lesson.mp4');

type Step = {
  label: string;
  fn: () => Promise<unknown>;
  expectOutput: string;
  verify?: () => void;
};

async function runStep(step: Step, index: number, total: number): Promise<void> {
  const start = Date.now();
  console.log(`\n━━━ [${index}/${total}] ${step.label} ━━━`);
  try {
    await step.fn();
  } catch (err: any) {
    throw new Error(`Pipeline FALHOU no passo "${step.label}": ${err?.message ?? err}`);
  }
  if (!fs.existsSync(step.expectOutput)) {
    throw new Error(`Pipeline FALHOU no passo "${step.label}": saída esperada não encontrada (${step.expectOutput})`);
  }
  if (step.verify) step.verify();
  const secs = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`✅ ${step.label} OK (${secs}s)`);
}

export async function runPipeline(): Promise<string> {
  console.log('\n🎬 AulaCraft Pipeline — geração end-to-end\n');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  if (!fs.existsSync(SCRIPT_PATH)) {
    throw new Error(`Input ausente: ${SCRIPT_PATH}. Coloque o roteiro em assets/script.txt antes de rodar.`);
  }

  const steps: Step[] = [
    {
      label: 'generate-storyboard (roteiro -> storyboard.json)',
      fn: runGenerateStoryboard,
      expectOutput: STORYBOARD_PATH,
    },
    {
      label: 'resolve-assets (stock + IA -> storyboard.resolved.json)',
      fn: resolveAssets,
      expectOutput: RESOLVED_PATH,
    },
    {
      label: 'resolve-audio (narracao + trilha)',
      fn: resolveAudio,
      expectOutput: NARRATION_PATH,
      verify: () => {
        const sb = JSON.parse(fs.readFileSync(RESOLVED_PATH, 'utf-8')) as { audioUrl?: string };
        if (!sb.audioUrl) {
          throw new Error('storyboard.resolved.json sem audioUrl apos resolve-audio');
        }
      },
    },
    {
      label: 'render (Remotion -> lesson.mp4)',
      fn: runRender,
      expectOutput: OUTPUT_PATH,
    },
  ];

  const t0 = Date.now();
  for (let i = 0; i < steps.length; i++) {
    await runStep(steps[i], i + 1, steps.length);
  }
  const total = ((Date.now() - t0) / 1000).toFixed(1);

  console.log(`\n🎉 Pipeline completo em ${total}s`);
  console.log(`📍 Video: ${OUTPUT_PATH}`);
  return OUTPUT_PATH;
}

if (require.main === module) {
  runPipeline().catch((err) => {
    console.error('\n❌', err.message);
    process.exit(1);
  });
}
