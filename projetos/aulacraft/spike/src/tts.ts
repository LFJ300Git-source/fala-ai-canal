import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { GoogleGenerativeAI } from '@google/generative-ai';

const VOICE_NAME = 'Charon'; // deep, professional male voice

// Gemini TTS returns raw PCM: 16-bit signed LE, 24000 Hz, mono
function pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1, bitsPerSample = 16): Buffer {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28);
  header.writeUInt16LE(channels * (bitsPerSample / 8), 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export async function generateNarrationFromText(text: string, outputPath: string): Promise<string> {
  console.log('🎙️  Generating narration with Gemini TTS...');

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-tts' });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text }] }],
    generationConfig: {
      // @ts-ignore — TTS config not yet typed in SDK
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: VOICE_NAME },
        },
      },
    },
  });

  const part = result.response.candidates?.[0]?.content?.parts?.[0]?.inlineData;

  if (!part?.data) {
    throw new Error('Gemini TTS returned no audio data');
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const pcmBuffer = Buffer.from(part.data, 'base64');
  const mimeType = part.mimeType ?? '';

  if (mimeType.includes('wav') || mimeType.includes('audio/x-wav')) {
    // Already WAV, save directly and convert to mp3
    const wavPath = outputPath.replace(/\.mp3$/, '.wav');
    fs.writeFileSync(wavPath, pcmBuffer);
    execSync(`ffmpeg -y -i "${wavPath}" "${outputPath}"`);
    fs.unlinkSync(wavPath);
  } else {
    // Raw PCM (L16, 24000 Hz, mono) — add WAV header then convert to mp3
    const wavBuffer = pcmToWav(pcmBuffer);
    const wavPath = outputPath.replace(/\.mp3$/, '.wav');
    fs.writeFileSync(wavPath, wavBuffer);
    execSync(`ffmpeg -y -i "${wavPath}" "${outputPath}"`);
    fs.unlinkSync(wavPath);
  }

  console.log(`✅ Narration saved to ${outputPath}`);

  return outputPath;
}

export async function generateNarration(scriptPath: string, outputPath: string): Promise<void> {
  const script = fs.readFileSync(scriptPath, 'utf-8');
  await generateNarrationFromText(script, outputPath);
}
