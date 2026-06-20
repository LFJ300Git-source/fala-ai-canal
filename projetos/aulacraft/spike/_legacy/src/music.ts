import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { execSync } from 'child_process';
import axios from 'axios';

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

export async function downloadMusic(outputPath: string): Promise<void> {
  console.log('🎵 Fetching music from Pixabay...');

  const response = await axios.get('https://pixabay.com/api/music/', {
    params: {
      key: process.env.PIXABAY_API_KEY,
      q: 'corporate background',
      category: 'corporate',
      duration_from: 60,
      per_page: 5,
    },
  });

  const tracks = response.data.hits;
  if (!tracks || tracks.length === 0) {
    throw new Error('No music tracks found on Pixabay');
  }

  const track = tracks[0];
  console.log(`   Using track: "${track.tags}"`);

  await downloadFile(track.audio, outputPath);
  console.log(`✅ Music saved to ${outputPath}`);
}

export function mixAudio(narrationPath: string, musicPath: string, outputPath: string): void {
  console.log('🎚️  Mixing narration + music with ffmpeg...');

  // narration at full volume, music ducked to ~10% (-20dB)
  const cmd = `ffmpeg -i "${narrationPath}" -i "${musicPath}" -filter_complex "[1:a]volume=0.1[music];[0:a][music]amix=inputs=2:duration=first:dropout_transition=3[out]" -map "[out]" -y "${outputPath}"`;

  execSync(cmd, { stdio: 'inherit' });
  console.log(`✅ Mixed audio saved to ${outputPath}`);
}
