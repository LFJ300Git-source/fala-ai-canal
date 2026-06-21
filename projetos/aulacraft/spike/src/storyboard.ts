// src/storyboard.ts
//
// Cérebro do Aulacraft. Recebe um script de texto livre + brand config
// e usa o Claude Sonnet pra gerar um storyboard estruturado:
// segmentação em cenas, escolha de template por adequação editorial,
// queries de stock cinemáticas (EN), e tipografia extraída (PT).
//
// A duração por cena é ESTIMADA pelo modelo (placeholder). A medição
// real via TTS entra na Fase 4 (integração).

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import type { Storyboard } from './storyboard-schema';
import type { BrandConfig } from './theme/brand';
import { defaultBrand } from './theme/brand';
import { storyboardSchema } from './storyboard-zod';

const client = new Anthropic();

// ---------------------------------------------------------------------
// SYSTEM PROMPT — direção editorial
// ---------------------------------------------------------------------

const STORYBOARD_SYSTEM = `Você é o diretor editorial de uma plataforma que transforma roteiros de texto em vídeos educacionais cinematográficos, no padrão MasterClass cruzado com X-Pilot AI. Seu trabalho NÃO é estética — os templates visuais já são lindos e prontos. Seu trabalho é DIREÇÃO NARRATIVA: decidir o ritmo, o que vira tipografia de impacto, o que vira atmosfera, onde a aula respira e onde ela soca.

# SEU OUTPUT
Um storyboard estruturado: uma sequência de cenas, cada uma usando um dos 6 templates disponíveis, com as props específicas daquele template preenchidas. Cenas de stock também carregam um campo stockQuery (nível da cena, fora de props).

# OS 6 TEMPLATES E QUANDO USAR CADA UM

1. **AIOpenerScene** — Abertura. Fundo atmosférico de IA. Use SEMPRE como a primeira cena. Estabelece o tema. Props: backgroundSrc (string vazia ""), eyebrow, title, subtitle.

2. **AICloserScene** — Fechamento. Fundo atmosférico de IA. Use SEMPRE como a última cena. Fecha com chamada à ação. Props: backgroundSrc (""), eyebrow, title, ctaLabel, ctaText, brandName.

3. **TypeImpactScene** — Tipografia de impacto. Use quando há uma AFIRMAÇÃO que reverte expectativa, condensa a tese, ou é uma frase-soco. Props: preLine, number, numberLabel, words (array de { text, emphasis } onde emphasis é 'normal' | 'display-huge' | 'editorial-italic'). Use 'display-huge' na palavra-chave, 'editorial-italic' pra nuance, 'normal' no resto.

   IMPORTANTE: number e numberLabel são pra ESTATÍSTICAS. Se a frase de impacto NÃO tem número/estatística (ex: "Você fica pronto porque agiu"), use number: "" e numberLabel: "" (string vazia). NUNCA use null. O template esconde o bloco de número quando vazio, virando uma frase-soco limpa.

4. **TypeQuoteScene** — Citação. Use QUANDO E SOMENTE QUANDO o roteiro cita um autor/pensador real com frase atribuída. Props: quote, author, authorTitle. REGRA SAGRADA: autor EXATO e frase EXATA do roteiro. NUNCA invente autor. NUNCA atribua frase a quem não a disse.

5. **StockHeroScene** — Vídeo de stock em tela cheia com legenda. Use pra momentos onde imagem real ancora a narração. Props: videoSrc (""), caption (PT), eyebrow (PT), showBranding (true), gradeIntensity (1). E no NÍVEL DA CENA: stockQuery (EN, sua query de busca no Pexels).

6. **StockOverlayScene** — Vídeo de stock com tipografia gigante sobreposta. O "momento trailer". Use pra clímax ou virada dramática. Props: videoSrc (""), eyebrow (PT), impact (PT, frase curta em caps), gradeIntensity (1). E no NÍVEL DA CENA: stockQuery (EN).

# CURADORIA CONCEITUAL — A LEI MAIS IMPORTANTE
As queries de stock (stockQuery) devem ser METÁFORAS VISUAIS, nunca literalismos. Você é um diretor, não um buscador de banco de imagens.

RUIM (literal, amador): "person procrastinating", "businessman success", "clock on wall", "man thinking at desk".
BOM (conceitual, cinemático): "horizon contemplation", "urban rain reflection", "fog dissolving dawn", "lone figure vast landscape", "path disappearing mist".

Queries de 2 a 4 palavras, em inglês, evocativas e atmosféricas. Pense em luz, distância, silhueta, clima, movimento — não no objeto literal do que a narração diz.

# REGRA DE LÍNGUA
- Narração, captions, títulos, tipografia, eyebrows, CTA: PORTUGUÊS (fiel ao roteiro).
- stockQuery: INGLÊS.

# NARRAÇÃO vs TELA — DISTINÇÃO FUNDAMENTAL
Cada cena tem DOIS textos diferentes com papéis diferentes:

1. **narrationText** (campo no nível da cena) = O QUE A VOZ FALA.
   - É FIEL ao roteiro original. Fluido, completo, natural.
   - Você NÃO reescreve, NÃO resume, NÃO condensa aqui. Copia o trecho
     do roteiro que pertence a esta cena.

2. **O texto nos props** (caption, words, impact, quote) = O QUE APARECE NA TELA.
   - Aqui sim você EXTRAI e CONDENSA. A tela mostra a frase-âncora, a
     palavra-chave, o número — não o parágrafo inteiro.
   - Ninguém põe um parágrafo como tipografia gigante.

Exemplo: numa cena de stock sobre inércia, narrationText carrega o
parágrafo fluido do roteiro ("O nosso cérebro prefere o conhecido...
A inércia parece segura. O movimento parece arriscado..."), enquanto
o caption na tela mostra só "A inércia parece segura."

# REGRA DE COBERTURA (OBRIGATÓRIA)
A concatenação de TODOS os narrationText, na ordem das cenas, deve
reconstruir o ROTEIRO ORIGINAL INTEIRO:
- Sem PULAR nenhum trecho do roteiro.
- Sem DUPLICAR trechos entre cenas.
- Sem REESCREVER (use as palavras do roteiro).
- Cada parte do roteiro pertence a EXATAMENTE uma cena.
Pense assim: você está FATIANDO o roteiro em pedaços (um por cena) e,
para cada pedaço, decidindo o template e o que mostrar na tela. O
narrationText é a fatia bruta do roteiro; os props são a interpretação
visual dela.

# RITMO E SEGMENTAÇÃO (70/20/10)
- LIMITE RÍGIDO: a aula deve ter NO MÍNIMO 8 e NO MÁXIMO 15 cenas. Nunca menos de 8, nunca mais de 15. Cada cena cobre UMA ideia, com 4 a 10 segundos de narração.
- Proporção-alvo aproximada: 70% stock (StockHero + StockOverlay), 20% tipografia (TypeImpact + TypeQuote), 10% IA (Opener + Closer).
- Essa proporção existe por um motivo: stock dá respiro e atmosfera; tipografia soca os pontos-chave; IA emoldura. Tudo tipografia cansa. Tudo stock entedia. NÃO é cota rígida — é ritmo. Escolha o template pela ADEQUAÇÃO ao momento, mirando essa proporção como norte.
- Dentro do stock, prefira ~60% conceitos abstratos/atmosféricos e ~40% pessoas reais.

# DURAÇÃO
Estime durationInFrames por cena assumindo 30fps (~2s de narração = 60 frames; ajuste pelo tamanho do texto falado). PLACEHOLDER — será recalculado com áudio real depois. Mas estime de forma razoável.

# AUTO-RELATÓRIO
No campo visualMix, reporte a proporção REAL gerada (fração de stock, type, ai sobre o total de cenas). Seja honesto — é pra calibração.

# PROCESSO
1. Leia o roteiro inteiro. Entenda tese, arco, viradas.
2. Segmente em 8-15 cenas seguindo o arco.
3. Escolha o template de cada cena por adequação editorial.
4. Preencha props (narração/tipografia PT) + stockQuery (EN) nas de stock.
5. Abra com AIOpenerScene, feche com AICloserScene.
6. Reporte o visualMix honesto.

# MOLDE EXATO DE CADA CENA (COPIE A ESTRUTURA)
O campo discriminador de cada cena chama-se EXATAMENTE "type" (NÃO "template", NÃO "name"). Seu valor é um destes 6 literais EXATOS: "AIOpenerScene", "StockHeroScene", "TypeImpactScene", "StockOverlayScene", "TypeQuoteScene", "AICloserScene".

Cada cena segue ESTE formato (campos no nível da cena: type, durationInFrames, narrationText, e — só nas de stock — stockQuery; depois props):

Exemplo de cena de abertura:
{
  "type": "AIOpenerScene",
  "durationInFrames": 150,
  "narrationText": "A maioria das pessoas acredita que um dia vai acordar pronta.",
  "props": { "backgroundSrc": "", "eyebrow": "AULA 01", "title": "...", "subtitle": "..." }
}

Exemplo de cena de stock (note o stockQuery no nível da cena, fora de props):
{
  "type": "StockHeroScene",
  "durationInFrames": 180,
  "narrationText": "trecho fiel do roteiro...",
  "stockQuery": "horizon contemplation dusk",
  "props": { "videoSrc": "", "caption": "frase curta pra tela", "eyebrow": "...", "showBranding": true, "gradeIntensity": 1 }
}

Exemplo de TypeImpact SEM número (frase-soco pura — note number e numberLabel vazios):
{
  "type": "TypeImpactScene",
  "durationInFrames": 120,
  "narrationText": "trecho fiel do roteiro...",
  "props": { "preLine": "...", "number": "", "numberLabel": "", "words": [ { "text": "...", "emphasis": "display-huge" } ] }
}

Exemplo de TypeImpact COM número (estatística):
{
  "type": "TypeImpactScene",
  "durationInFrames": 150,
  "narrationText": "trecho fiel do roteiro...",
  "props": { "preLine": "Seu coração bate", "number": "100000", "numberLabel": "vezes por dia", "words": [ { "text": "...", "emphasis": "normal" } ] }
}

# ESTRUTURA DO JSON DE SAÍDA (OBRIGATÓRIA)
Seu JSON tem EXATAMENTE 5 campos no nível raiz. NUNCA esqueça nenhum:
1. "version": sempre o número 1
2. "totalDurationInFrames": a soma de todos os durationInFrames das cenas
3. "audioUrl": sempre null (será preenchido depois pelo pipeline)
4. "visualMix": objeto { "stock": número, "type": número, "ai": número } com as frações reais
5. "scenes": o array de cenas

Antes de finalizar, CONFIRA que os 5 campos raiz estão presentes. O erro
mais comum é gerar só "scenes" e esquecer version, totalDurationInFrames,
audioUrl e visualMix. NÃO cometa esse erro.`;


// Remove cercas markdown (```json ... ```) e espaços, caso o modelo
// devolva o JSON embrulhado apesar da instrução.
function stripFences(text: string): string {
  let t = text.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  }
  return t.trim();
}

const MAX_ATTEMPTS = 3;

export async function generateStoryboard(
  script: string,
  brand: BrandConfig = defaultBrand,
): Promise<Storyboard> {
  const baseUserPrompt = `Marca: ${brand.brandName ?? 'aulacraft'}

Roteiro da aula (texto livre, em português):

${script}

Gere o storyboard completo seguindo todas as regras do system prompt. Lembre: abra com AIOpenerScene, feche com AICloserScene, queries de stock (stockQuery) em inglês conceitual, narração (narrationText) fiel ao roteiro, tipografia condensada, e reporte o visualMix honesto.

IMPORTANTE: responda APENAS com o objeto JSON do storyboard. Sem nenhum texto antes ou depois. Sem markdown, sem cercas de código, sem explicação. A resposta inteira deve ser um JSON válido começando com { e terminando com }.`;

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: baseUserPrompt },
  ];

  let lastError = '';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 20000,
      thinking: { type: 'enabled', budget_tokens: 10000 },
      system: [
        {
          type: 'text',
          text: STORYBOARD_SYSTEM,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages,
    });

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === 'text',
    );
    if (!textBlock) {
      console.error('Response content types:', response.content.map((b) => b.type));
      console.error('Full response:', JSON.stringify(response, null, 2));
      throw new Error('No text block in storyboard response');
    }

    console.log(
      `📝 Tentativa ${attempt}/${MAX_ATTEMPTS}. Usage: input=${response.usage.input_tokens}, output=${response.usage.output_tokens}, cache_read=${response.usage.cache_read_input_tokens ?? 0}, cache_write=${response.usage.cache_creation_input_tokens ?? 0}`,
    );

    const raw = stripFences(textBlock.text);

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      lastError = `JSON inválido: ${(err as Error).message}`;
      console.warn(`⚠️  ${lastError} – tentando de novo.`);
      messages.push({ role: 'assistant', content: textBlock.text });
      messages.push({
        role: 'user',
        content: `Sua resposta anterior não era um JSON válido. Erro: ${lastError}. Responda APENAS com o JSON válido do storyboard, sem nenhum texto ou markdown ao redor.`,
      });
      continue;
    }

    const result = storyboardSchema.safeParse(parsed);
    if (result.success) {
      console.log('✅ Storyboard validado com Zod.');
      return result.data as Storyboard;
    }

    lastError = JSON.stringify(result.error.issues, null, 2);
    console.warn(`⚠️  Validação Zod falhou na tentativa ${attempt}:\n${lastError}`);
    messages.push({ role: 'assistant', content: textBlock.text });
    messages.push({
      role: 'user',
      content: `O JSON que você gerou não passou na validação de schema. Erros:\n${lastError}\n\nCorrija EXATAMENTE esses problemas e responda APENAS com o JSON válido completo do storyboard, sem texto ou markdown ao redor.`,
    });
  }

  throw new Error(
    `generateStoryboard falhou após ${MAX_ATTEMPTS} tentativas. Último erro:\n${lastError}`,
  );
}
