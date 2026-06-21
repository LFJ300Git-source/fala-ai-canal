import * as path from 'path';

// Default = pasta unica legada, pra o CLI continuar igual
export const DEFAULT_WORK_DIR = path.resolve(__dirname, '../assets');
export const DEFAULT_OUTPUT_DIR = path.resolve(__dirname, '../output');

export type JobPaths = {
  workDir: string;
  scriptPath: string;
  storyboardPath: string;
  resolvedPath: string;
  narrationDir: string;
  finalAudioPath: string;
  stockDir: string;
  aiDir: string;
  outputPath: string;
};

export function getJobPaths(
  workDir: string = DEFAULT_WORK_DIR,
  outputDir?: string,
): JobPaths {
  const outDir = outputDir ?? (workDir === DEFAULT_WORK_DIR ? DEFAULT_OUTPUT_DIR : workDir);
  return {
    workDir,
    scriptPath: path.join(workDir, 'script.txt'),
    storyboardPath: path.join(workDir, 'storyboard.json'),
    resolvedPath: path.join(workDir, 'storyboard.resolved.json'),
    narrationDir: path.join(workDir, 'narration'),
    finalAudioPath: path.join(workDir, 'narration.mp3'),
    stockDir: path.join(workDir, 'stock'),
    aiDir: path.join(workDir, 'ai'),
    outputPath: path.join(outDir, 'lesson.mp4'),
  };
}
