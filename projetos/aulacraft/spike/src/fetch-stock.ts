// src/fetch-stock.ts
//
// Script CLI standalone que busca um clip de stock no Pexels, baixa,
// e normaliza pra 30fps + 1920×1080.
//
// Uso:
//   npx ts-node src/fetch-stock.ts "businessman walking sunset"
//
// Output:
//   assets/stock/<slug>-<id>.mp4  (normalizado, pronto pra Remotion)
//
// Em caso de erro: deleta arquivos parciais, imprime mensagem clara,
// sai com código de erro não-zero.

import 'dotenv/config';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { execSync } from 'child_process';
import { DEFAULT_WORK_DIR } from './paths';

function downloadFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    const request = (currentUrl: string): void => {
      https.get(currentUrl, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          if (response.headers.location) {
            request(response.headers.location);
            return;
          }
        }
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode} ao baixar ${currentUrl}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(outputPath, () => reject(err));
      });
    };
    request(url);
  });
}

const PEXELS_API_URL = 'https://api.pexels.com/videos/search';

type PexelsVideoFile = {
  id: number;
  quality: string;
  file_type: string;
  width: number;
  height: number;
  fps: number;
  link: string;
};

type PexelsVideo = {
  id: number;
  width: number;
  height: number;
  duration: number;
  url: string;
  user: { name: string; url: string };
  video_files: PexelsVideoFile[];
};

type PexelsResponse = {
  total_results: number;
  videos: PexelsVideo[];
};

function slugify(query: string): string {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

function pickBestVideoFile(files: PexelsVideoFile[]): PexelsVideoFile {
  // Preferência: 1920×1080 exato → maior largura ≥1920 → maior disponível.
  // Sempre filtra por file_type que comece com 'video/'.
  const videoFiles = files.filter((f) => f.file_type.startsWith('video/'));
  if (videoFiles.length === 0) {
    throw new Error('Nenhum arquivo de vídeo válido no clip retornado.');
  }

  const exact = videoFiles.find((f) => f.width === 1920 && f.height === 1080);
  if (exact) return exact;

  const above1080 = videoFiles
    .filter((f) => f.width >= 1920)
    .sort((a, b) => a.width - b.width);
  if (above1080.length > 0) return above1080[0];

  // Fallback: maior disponível
  return [...videoFiles].sort((a, b) => b.width - a.width)[0];
}

export async function fetchStock(query: string, workDir: string = DEFAULT_WORK_DIR): Promise<string> {
  const OUTPUT_DIR = path.join(workDir, 'stock');
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error('PEXELS_API_KEY não encontrada no .env');
  }

  console.log(`🎬 Buscando no Pexels: "${query}"`);

  const response = await axios.get<PexelsResponse>(PEXELS_API_URL, {
    headers: { Authorization: apiKey },
    params: {
      query,
      per_page: 1,
      orientation: 'landscape',
      size: 'medium',
    },
  });

  if (!response.data.videos || response.data.videos.length === 0) {
    throw new Error(`Nenhum resultado pra query "${query}"`);
  }

  const video = response.data.videos[0];
  const chosenFile = pickBestVideoFile(video.video_files);

  console.log(`   Clip ID: ${video.id}`);
  console.log(`   Fotógrafo: ${video.user.name}`);
  console.log(`   Página Pexels: ${video.url}`);
  console.log(`   Original: ${video.width}×${video.height}, ${video.duration}s`);
  console.log(`   File escolhido: ${chosenFile.width}×${chosenFile.height} @ ${chosenFile.fps}fps`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const slug = slugify(query);
  const rawPath = path.join(OUTPUT_DIR, `${slug}-${video.id}-raw.mp4`);
  const finalPath = path.join(OUTPUT_DIR, `${slug}-${video.id}.mp4`);

  console.log(`⬇️  Baixando pra ${rawPath}`);
  await downloadFile(chosenFile.link, rawPath);

  console.log(`🎞️  Normalizando pra 30fps + 1920×1080`);
  try {
    const cmd = `ffmpeg -y -i "${rawPath}" -r 30 -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,setsar=1" -c:v libx264 -preset medium -crf 18 -an "${finalPath}"`;
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    // Falha no ffmpeg: limpa o que sobrou
    if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
    if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
    throw new Error(`ffmpeg falhou: ${(err as Error).message}`);
  }

  // Sucesso: apaga o raw, mantém só o normalizado
  if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);

  const stats = fs.statSync(finalPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`✅ Salvo em ${finalPath} (${sizeMB} MB)`);
  console.log(`   Metadata:`);
  console.log(`     - Clip ID: ${video.id}`);
  console.log(`     - Fotógrafo: ${video.user.name}`);
  console.log(`     - Página Pexels: ${video.url}`);
  console.log(`     - Original: ${video.width}×${video.height} @ ${chosenFile.fps}fps, ${video.duration}s`);
  console.log(`     - Normalizado: 1920×1080 @ 30fps`);

  return `stock/${slug}-${video.id}.mp4`;
}

async function main(): Promise<void> {
  const query = process.argv.slice(2).join(' ').trim();
  if (!query) {
    console.error('Uso: npx ts-node src/fetch-stock.ts "<query>"');
    process.exit(1);
  }

  try {
    const resultPath = await fetchStock(query);
    console.log(`✨ Pronto em: ${resultPath}\n`);
  } catch (err) {
    console.error(`❌ Erro: ${(err as Error).message}`);
    process.exit(1);
  }
}

// Only run main if this file is executed directly
if (process.argv[1]?.endsWith('fetch-stock.ts')) {
  main();
}
