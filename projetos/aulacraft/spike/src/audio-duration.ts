// src/audio-duration.ts
//
// Mede a duração de um arquivo de áudio em segundos usando ffprobe.
// Usa o mesmo binário ffprobe que vem com ffmpeg.

import { execSync } from 'child_process';

export function getAudioDurationSeconds(filePath: string): number {
  try {
    const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
    const output = execSync(cmd, { encoding: 'utf-8' }).trim();

    const duration = parseFloat(output);

    if (isNaN(duration)) {
      throw new Error(`ffprobe returned non-numeric value: "${output}"`);
    }

    if (duration <= 0) {
      throw new Error(`Audio duration must be positive, got: ${duration}s`);
    }

    return duration;
  } catch (err) {
    throw new Error(`Failed to get audio duration for "${filePath}": ${(err as Error).message}`);
  }
}
