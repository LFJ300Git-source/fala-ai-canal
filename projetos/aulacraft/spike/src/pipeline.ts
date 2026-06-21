import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs';
import { runGenerateStoryboard } from './generate-storyboard';
import { resolveAssets } from './resolve-assets';
import { resolveAudio } from './resolve-audio';
import { runRender } from './render-local';
import { DEFAULT_WORK_DIR, getJobPaths } from './paths';

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

export async function runPipeline(workDir: string = DEFAULT_WORK_DIR): Promise<string> {
  const paths = getJobPaths(workDir);

  console.log('\n🎬 AulaCraft Pipeline — geração end-to-end\n');
  console.log(`📂 workDir: ${workDir}`);

  // Garante a estrutura de dirs do job (recursive cria o workDir tambem)
  fs.mkdirSync(paths.stockDir, { recursive: true });
  fs.mkdirSync(paths.aiDir, { recursive: true });
  fs.mkdirSync(paths.narrationDir, { recursive: true });
  fs.mkdirSync(path.dirname(paths.outputPath), { recursive: true });

  if (!fs.existsSync(paths.scriptPath)) {
    throw new Error(`Input ausente: ${paths.scriptPath}. Coloque o roteiro em script.txt antes de rodar.`);
  }

  const steps: Step[] = [
    {
      label: 'generate-storyboard (roteiro -> storyboard.json)',
      fn: () => runGenerateStoryboard(workDir),
      expectOutput: paths.storyboardPath,
    },
    {
      label: 'resolve-assets (stock + IA -> storyboard.resolved.json)',
      fn: () => resolveAssets(workDir),
      expectOutput: paths.resolvedPath,
    },
    {
      label: 'resolve-audio (narracao + trilha)',
      fn: () => resolveAudio(workDir),
      expectOutput: paths.finalAudioPath,
      verify: () => {
        const sb = JSON.parse(fs.readFileSync(paths.resolvedPath, 'utf-8')) as { audioUrl?: string };
        if (!sb.audioUrl) {
          throw new Error('storyboard.resolved.json sem audioUrl apos resolve-audio');
        }
      },
    },
    {
      label: 'render (Remotion -> lesson.mp4)',
      fn: () => runRender(workDir),
      expectOutput: paths.outputPath,
    },
  ];

  const t0 = Date.now();
  for (let i = 0; i < steps.length; i++) {
    await runStep(steps[i], i + 1, steps.length);
  }
  const total = ((Date.now() - t0) / 1000).toFixed(1);

  console.log(`\n🎉 Pipeline completo em ${total}s`);
  console.log(`📍 Video: ${paths.outputPath}`);
  return paths.outputPath;
}

if (require.main === module) {
  const arg = process.argv[2];
  const workDir = arg ? path.resolve(arg) : DEFAULT_WORK_DIR;
  runPipeline(workDir).catch((err) => {
    console.error('\n❌', err.message);
    process.exit(1);
  });
}
