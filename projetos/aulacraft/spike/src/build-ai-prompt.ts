// src/build-ai-prompt.ts
//
// Gera um prompt FLUX pra criar o fundo atmosférico de uma cena de IA
// (AIOpenerScene ou AICloserScene) usando o Claude Sonnet.
//
// Fluxo: cena (com título, subtitle/ctaText, narração) → system prompt
// editorial → Claude gera prompt FLUX → retorna string usável.
//
// Fallback: se chamada falhar ou resposta vazia, usa o prompt padrão
// do opener-default (prompt atmosférico seguro e testado).

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import type { StoryboardScene } from './storyboard-schema';

const client = new Anthropic();

// Prompt padrão do opener (fallback seguro)
const OPENER_DEFAULT_PROMPT =
  'deep dark navy blue night atmosphere, subtle warm amber glow accent in upper right corner, soft gradient atmosphere, no clouds, no horizon, no objects, no people, smooth volumetric haze, pure abstract dark sky, dark navy dominant with minimal warm amber accent, subtle film grain, moody minimal cinematography, contemplative empty space, ultra wide cinematic';

const SYSTEM_PROMPT = `You are an art director generating a text-to-image prompt for FLUX to create an atmospheric background for a video scene.

Your task: given the narrative content of a scene (title, subtitle/CTA, and narration), generate a cinematic, abstract prompt that will serve as a backdrop behind on-screen typography. The background must be abstract and atmospheric, NOT literal. No recognizable objects, no people, no text/letters. The prompt must account for landscape 16:9 aspect ratio.

Key rules:
- Background is ABSTRACT and ATMOSPHERIC, never literal or photorealistic
- NO people, NO recognizable objects, NO text/letters on screen
- Must have DARK/CLEAN AREAS so typography overlaid on top remains readable
- Cinematic, moody, evocative — think mood, light, atmosphere, not subject matter

MOOD DISTINCTION (CRITICAL):
- For **AIOpenerScene**: deep night, contemplative, introspective. Dark navy/indigo, subtle warm amber glow accent, profound quiet. Mood: "before dawn, before beginning, inner silence."
- For **AICloserScene**: action, clarity emerging, empowerment. More light than opener, dark-to-light transition, sense of motion/opening. NOT a night sky like the opener. Mood: "breaking through, clarity rising, ready to move."

Output: ONLY the FLUX prompt in English, plain text. NO markdown, NO quotes, NO preamble, NO explanation. Just the raw prompt text.`;

export async function buildAiPrompt(scene: StoryboardScene): Promise<string> {
  // Validate that this is an AI scene
  if (scene.type !== 'AIOpenerScene' && scene.type !== 'AICloserScene') {
    throw new Error(
      `buildAiPrompt only accepts AIOpenerScene or AICloserScene, got: ${scene.type}`
    );
  }

  // Extract relevant text from the scene
  let sceneText = '';
  if (scene.type === 'AIOpenerScene') {
    const props = scene.props as any; // AIOpenerSceneProps
    sceneText = `
Type: AIOpenerScene (opening/establishing mood)
Title: ${props.title}
Subtitle: ${props.subtitle}
Narration: ${scene.narrationText}
`.trim();
  } else if (scene.type === 'AICloserScene') {
    const props = scene.props as any; // AICloserSceneProps
    sceneText = `
Type: AICloserScene (closing/call to action)
Title: ${props.title}
CTA Text: ${props.ctaText}
Narration: ${scene.narrationText}
`.trim();
  }

  const userMessage = `Generate a FLUX prompt for the following scene:

${sceneText}

Respond ONLY with the FLUX prompt — no explanation, no markdown, no quotes.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === 'text'
    );

    if (!textBlock) {
      console.warn(
        '⚠️  [buildAiPrompt] No text block in response, falling back to opener-default'
      );
      return OPENER_DEFAULT_PROMPT;
    }

    const prompt = textBlock.text.trim();

    if (!prompt || prompt.length === 0) {
      console.warn(
        '⚠️  [buildAiPrompt] Empty response from Claude, falling back to opener-default'
      );
      return OPENER_DEFAULT_PROMPT;
    }

    return prompt;
  } catch (err) {
    console.warn(
      `⚠️  [buildAiPrompt] Error calling Claude: ${(err as Error).message}, falling back to opener-default`
    );
    return OPENER_DEFAULT_PROMPT;
  }
}
