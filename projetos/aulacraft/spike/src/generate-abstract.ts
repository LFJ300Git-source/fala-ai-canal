// src/generate-abstract.ts
// Script CLI pra geração de fundos abstratos via fal.ai FLUX 2 [pro].
// Uso: npx ts-node src/generate-abstract.ts <nome-do-preset>
// Exemplo: npx ts-node src/generate-abstract.ts opener-default

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { fal } from '@fal-ai/client';

type ImageSize =
  | 'square_hd'
  | 'square'
  | 'portrait_4_3'
  | 'portrait_16_9'
  | 'landscape_4_3'
  | 'landscape_16_9';

type Preset = {
  prompt: string;
  image_size: ImageSize;
  outputFile: string;
  description: string;
};

const PRESETS: Record<string, Preset> = {
  'opener-default': {
    description: 'Fundo atmosférico padrão pro AIOpenerScene — céu noturno cinematográfico azul-marinho com glow âmbar sutil no canto superior direito.',
    prompt:
      'deep dark navy blue night atmosphere, subtle warm amber glow accent in upper right corner, soft gradient atmosphere, no clouds, no horizon, no objects, no people, smooth volumetric haze, pure abstract dark sky, dark navy dominant with minimal warm amber accent, subtle film grain, moody minimal cinematography, contemplative empty space, ultra wide cinematic',
    image_size: 'landscape_16_9',
    outputFile: 'test-opener-bg.png',
  },
};

const OUTPUT_DIR = path.resolve(__dirname, '..', 'assets');

async function downloadImage(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Download falhou com status ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        fs.unlink(destPath, () => reject(err));
      });
  });
}

export async function generateAbstract(
  prompt: string,
  outputName: string
): Promise<string> {
  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY não está definida no .env');
  }

  fal.config({ credentials: process.env.FAL_KEY });

  console.log(`\n[generate-abstract] Prompt: ${prompt.slice(0, 80)}...`);
  console.log(`[generate-abstract] Output: ${outputName}`);
  console.log(`[generate-abstract] Modelo: fal-ai/flux-2-pro`);
  console.log(`[generate-abstract] Tamanho: landscape_16_9`);
  console.log(`[generate-abstract] Chamando fal.ai...\n`);

  const start = Date.now();

  const result = await fal.subscribe('fal-ai/flux-2-pro', {
    input: {
      prompt,
      image_size: 'landscape_16_9',
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === 'IN_PROGRESS') {
        update.logs?.forEach((log) => console.log(`  [fal] ${log.message}`));
      }
    },
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n[generate-abstract] Geração concluída em ${elapsed}s`);

  const data = result.data as { images?: Array<{ url: string }> };
  const imageUrl = data.images?.[0]?.url;

  if (!imageUrl) {
    throw new Error('Resposta da fal.ai não contém URL de imagem');
  }

  console.log(`[generate-abstract] URL gerada: ${imageUrl}`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const outputPath = path.join(OUTPUT_DIR, outputName);
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`[generate-abstract] Baixando pra ${outputPath}...`);
  await downloadImage(imageUrl, outputPath);

  const stats = fs.statSync(outputPath);
  const sizeKb = (stats.size / 1024).toFixed(1);
  console.log(`[generate-abstract] Salvo. Tamanho: ${sizeKb} KB\n`);

  return outputName;
}

async function generate(presetName: string): Promise<void> {
  const preset = PRESETS[presetName];
  if (!preset) {
    const available = Object.keys(PRESETS).join(', ');
    throw new Error(
      `Preset "${presetName}" não existe. Presets disponíveis: ${available}`
    );
  }

  console.log(`\n[generate-abstract] Preset: ${presetName}`);
  console.log(`[generate-abstract] Descrição: ${preset.description}`);

  await generateAbstract(preset.prompt, preset.outputFile);
}

async function main() {
  const arg = process.argv[2];

  if (!arg) {
    const available = Object.keys(PRESETS).join(', ');
    console.error(
      `\nErro: preset ou prompt não foi fornecido.\nUso:\n  npx ts-node src/generate-abstract.ts <preset>\n  npx ts-node src/generate-abstract.ts "seu prompt aqui"\nPresets disponíveis: ${available}\n`
    );
    process.exit(1);
  }

  try {
    if (PRESETS[arg]) {
      await generate(arg);
    } else {
      const timestamp = Date.now();
      const outputName = `ai/direct-${timestamp}.png`;
      await generateAbstract(arg, outputName);
      console.log(`[generate-abstract] Gerado com sucesso: ${outputName}\n`);
    }
  } catch (err) {
    console.error(`\n[generate-abstract] ERRO: ${(err as Error).message}\n`);
    process.exit(1);
  }
}

// Only run main if this file is executed directly
if (process.argv[1]?.endsWith('generate-abstract.ts')) {
  main();
}
