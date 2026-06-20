import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { fal } from '@fal-ai/client';

const ASSETS = [
  {
    name: 'heart_anatomy',
    prompt: 'Flat vector illustration of human heart anatomy in cross-section showing four chambers clearly visible (right atrium, left atrium, right ventricle, left ventricle), modern medical diagram infographic style, clean geometric shapes with smooth curves, deep magenta and crimson red for muscle tissue, teal cyan for oxygen-rich blood vessels, indigo purple background, NO TEXT NO LABELS, isolated centered composition, professional educational illustration like Canva infographic, flat shading no realistic photography, vector art style, high contrast on dark background',
    width: 1536,
    height: 1536,
  },
  {
    name: 'heart_lungs',
    prompt: 'Flat vector illustration of human heart with both lungs visible flanking it on each side, anatomical educational diagram, modern flat design with clean geometric shapes, magenta heart in center with soft pink lungs on sides, teal blue blood vessels, indigo purple background, NO TEXT NO LABELS, professional medical infographic Canva style, vector art not photography, isolated centered composition, high contrast',
    width: 1920,
    height: 1080,
  },
  {
    name: 'blob_1',
    prompt: '3D iridescent chrome liquid metal blob, holographic purple magenta teal cyan gradient surface, abstract organic shape like spilled mercury, floating in space, studio lighting from multiple angles, smooth glossy metallic finish with rainbow reflections, isolated on solid dark navy background hex #0A0A1A, no text no objects no people, abstract decorative element',
    width: 1024,
    height: 1024,
  },
  {
    name: 'blob_2',
    prompt: '3D iridescent chrome liquid blob shape, holographic teal cyan purple metallic gradient, abstract twisted organic form, smooth glossy reflective surface, isolated on solid dark navy background hex #0A0A1A, abstract decorative element, no text no objects',
    width: 1024,
    height: 1024,
  },
  {
    name: 'blob_3',
    prompt: '3D iridescent chrome liquid metal blob, holographic magenta pink purple gradient surface with rainbow reflections, smooth flowing organic shape, glossy metallic finish, isolated on solid dark navy background hex #0A0A1A, abstract decorative atmospheric element, no text no objects',
    width: 1024,
    height: 1024,
  },
];

function downloadImage(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

export async function generateImages(outputDir: string): Promise<string[]> {
  console.log('🖼️  Generating Canva-style assets with fal.ai flux-pro...');
  fal.config({ credentials: process.env.FAL_KEY });
  fs.mkdirSync(outputDir, { recursive: true });

  const imagePaths: string[] = [];

  for (const asset of ASSETS) {
    console.log(`   Generating ${asset.name}...`);
    const result = await fal.subscribe('fal-ai/flux-pro', {
      input: {
        prompt: asset.prompt,
        width: asset.width,
        height: asset.height,
        num_images: 1,
        safety_tolerance: '2',
      },
    }) as unknown as Record<string, unknown>;

    const data = result.data as { images: { url: string }[] } | undefined;
    const images = data?.images;
    if (!images || images.length === 0) {
      throw new Error(`fal.ai returned no images for ${asset.name}`);
    }
    const outputPath = path.join(outputDir, `${asset.name}.png`);
    await downloadImage(images[0].url, outputPath);
    console.log(`   ✅ ${asset.name} saved`);
    imagePaths.push(outputPath);
  }

  console.log('✅ All assets generated');
  return imagePaths;
}
