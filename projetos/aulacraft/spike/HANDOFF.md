> ⚠️ DEPRECATED — Produto pivotou de "conteúdo visualizável/anatomia" pra "soft-skill cinematográfico" em 2026-05-24. Ver BRIEF_AULACRAFT_V2.md.

# AulaCraft Spike — Handoff Document

> Documento de entrega completa do estado do spike do AulaCraft.
> Última atualização: **2026-05-23**.
> Destinatário: agente novo (ou Claude em sessão nova) assumindo o spike.

---

## 1. Contexto do produto

**AulaCraft** é um SaaS em fase de validação (lifecycle: spike → MVP → produção). Objetivo: gerar vídeos educacionais explicativos para criadores de cursos online (público-alvo: instrutores Hotmart / Teachable / Kajabi).

**Premissa central:** instrutor envia um script em texto, AulaCraft gera o vídeo completo (narração TTS, ilustrações geradas, motion graphics, música, captions). Output final = MP4 1920×1080 pronto pra upload na plataforma de curso.

**Spec do produto (locked):** `C:\Users\lucas\projetos\aulacraft\SPEC.md`

**Nicho restringido importante:** o produto **só funciona pra conteúdo visualizável** — anatomia, ciências, engenharia, biologia, física. NÃO serve pra cursos de soft skills, marketing, coaching, conteúdo abstrato. Lição aprendida na hard way no spike (descobrimos depois de 5 iterações usando script genérico "Como Estruturar uma Aula Online" que não tinha nada concreto pra ilustrar).

---

## 2. Estado atual do spike

**Localização:** `C:\Users\lucas\projetos\aulacraft\spike\`

**Versão atual:** v7.1 — em processo de refatoração pra usar design system centralizado.

**Topic de teste atual:** "How the human heart pumps blood" (50.04s narration, 158 palavras, 7 scenes geradas pelo Claude).

**Output mais recente:** `output/demo.mp4` (51.1s, 16.3 MB, h264 1080p). Renderizado em 2026-05-23 18:33 já com o `CanvaTitleScene` refatorado.

**Pipeline funcionando end-to-end:**
Script → Gemini TTS → Whisper (timestamps) → Claude Sonnet 4.6 (storyboard JSON) → Remotion (render local).

---

## 3. Arquitetura

### Pipeline de geração

```
assets/script.txt
        │
        ▼  (regen-narration.ts)
[Gemini TTS Charon] ──► assets/narration.mp3
        │
        ▼  (regen-narration.ts continua: ffmpeg mix)
[ffmpeg + music.mp3] ──► assets/mixed_audio.mp3
        │
        ▼  (scripts/transcribe.py — Whisper venv local)
[OpenAI Whisper] ──► assets/narration.json {duration, words:[{word,start,end}]}
        │
        ▼  (generate-storyboard.ts)
[Claude Sonnet 4.6 + design system prompt + json_schema output] ──► assets/storyboard.json
        │
        ▼  (render-local.ts)
[Remotion bundle + render] ──► output/demo.mp4
```

### Storyboard schema (entrada do render)

`assets/storyboard.json` produzido pelo Claude contém:
```ts
{
  totalDurationSeconds: number,
  scenes: [{
    id: string,
    template: 'title-card' | 'hero-3d' | 'annotated-3d' | 'flow-diagram' | 'stat-card' | 'closing-card',
    startTime: number, endTime: number,
    caption: string,            // sempre presente, vai no rodapé
    accentColor: string,        // hex (legado, não mais usado no template novo)
    // props específicas por template:
    title?, subtitle?, entities?: [{name,sublabel,color}],
    focus?, highlights?: AnatomyPart[], annotations?: [{label,part}],
    flowSteps?: [{label,color}],
    statValue?, statLabel?, statSuffix?,
  }]
}
```

`AnatomyPart` é hardcoded pra anatomia do coração: `'whole'|'right-atrium'|'left-atrium'|'right-ventricle'|'left-ventricle'|'aorta'|'lungs'`. Pra trocar de tópico, vai precisar generalizar.

### Render path

`render-local.ts`:
1. Lê `storyboard.json` + audio
2. `bundle()` Remotion (com `publicDir: ASSETS_DIR`)
3. `selectComposition()` → `LessonSummary` (definido em `Root.tsx` via `<Composition id="LessonSummary">`)
4. `renderMedia()` h264 1920×1080

`LessonSummary.tsx`:
- Itera `storyboard.scenes[]`
- Pra cada cena, cria `<Sequence from={startTime*fps} durationInFrames={duration*fps}>`
- Despacha pra template via `<RenderScene>` switch no `scene.template`

---

## 4. Estrutura de pastas

```
spike/
├── package.json              # deps: remotion, @remotion/{three,bundler,renderer,lambda}, anthropic, fal-ai, gemini
├── tsconfig.json             # NB: não tem "jsx" — use --jsx react flag manualmente em tsc
├── .env                      # API keys
├── remotion.config.ts
├── HANDOFF.md                # este arquivo
├── PROJECT_AUDIT.txt         # auditoria estrutural mais antiga, mantida pra contexto
│
├── assets/                   # tudo aqui é servido como publicDir pelo Remotion
│   ├── script.txt            # input
│   ├── narration.mp3
│   ├── mixed_audio.mp3
│   ├── music.mp3
│   ├── narration.json        # Whisper timestamps
│   ├── storyboard.json       # output do Claude
│   ├── heart_anatomy.png     # fal.ai (anatomia 4 chambers)
│   ├── heart_lungs.png       # fal.ai (heart + lungs)
│   ├── blob_1/2/3.png        # fal.ai (decorativos iridescentes — usados no canva_v7 antigo)
│   └── image_1/2/3.png       # ❌ NÃO USADOS — pode deletar
│
├── src/
│   ├── index.ts              # registerRoot(RemotionRoot)
│   ├── Root.tsx              # <Composition id="LessonSummary" .../>
│   │
│   ├── theme/
│   │   └── tokens.ts         # ⭐ ÚNICA fonte de verdade visual (cores/fontes/sizes)
│   │
│   ├── components/
│   │   └── SceneFrame.tsx    # ⭐ wrapper mestre de cena (mode, caption, safe area, animação)
│   │
│   ├── compositions/
│   │   ├── LessonSummary.tsx # orquestrador de cenas
│   │   ├── canva_v7.tsx      # 6 templates — só CanvaTitleScene refatorado
│   │   └── _archive/         # 8 arquivos das v1-v6 (motion/three3d/heart3d/scenes_v6/etc.)
│   │
│   ├── tts.ts                # Gemini TTS wrapper
│   ├── images.ts             # fal.ai wrapper (flux-pro)
│   ├── music.ts              # ffmpeg mix wrapper
│   ├── storyboard.ts         # Claude API wrapper + json_schema
│   │
│   ├── pipeline.ts           # pipeline antigo (deploy S3 + Lambda) — BLOQUEADO por AWS quota
│   ├── render-local.ts       # ⭐ render local (usado atualmente)
│   ├── generate-storyboard.ts# script entry pra gerar storyboard
│   ├── regen-narration.ts    # script entry pra re-gerar TTS+mix
│   └── regen-images.ts       # script entry pra re-gerar assets via fal.ai
│
├── scripts/
│   └── transcribe.py         # roda Whisper (.whisper-venv) → narration.json
│
└── output/
    └── demo.mp4              # render mais recente
```

---

## 5. Design system (NOVO — pivot crítico de 2026-05-23)

Depois de 7 iterações fracassadas (v1 slideshow → v7 Canva ad-hoc), o user pivotou pra abordagem disciplinada: **especificações exatas + execução literal + zero improvisação**.

### Regra de ouro

**ZERO valor visual hardcoded em templates.** Toda cor, fonte, tamanho, padding, gap, radius, duração de animação DEVE vir de `theme/tokens.ts`. Templates que violarem essa regra serão reprovados.

### `src/theme/tokens.ts` — única fonte de verdade

```ts
theme.colors.light    // background creme #F5F1EA, textPrimary #1A1A1A, etc.
theme.colors.dark     // background grafite #0E0E10, espelho do light
theme.colors.accent   // primary terracota #C8553D, secondary azul #3D5A80, success, warning

theme.fonts.display   // Fraunces (serif moderna pra títulos)
theme.fonts.body      // Inter (sans pra corpo)
theme.fonts.mono      // JetBrains Mono (números/stats)

theme.fontSize        // display 180 / h1 120 / h2 84 / h3 60 / bodyLarge 48 / body 36 / small 28 / stat 320
theme.fontWeight      // light 300 → black 900
theme.lineHeight      // tight 1.1 / snug 1.25 / normal 1.5 / relaxed 1.7

theme.spacing         // grid 8pt: xs 8 / sm 16 / md 24 / lg 40 / xl 64 / xxl 96 / xxxl 160
theme.safeArea        // horizontal 160 / vertical 120 (margem pra conteúdo principal)
theme.radius          // none 0 / sm 8 / md 16 / lg 24 / xl 40 / pill 9999

theme.motion.duration // em frames @ 30fps: instant 6 / fast 12 / base 18 / slow 30
theme.motion.spring   // gentle (damping 20, stiff 80) / bouncy (10, 100) / stiff (25, 200)

theme.video           // fps 30, width 1920, height 1080
```

Types exportados: `ThemeMode = 'light' | 'dark'`, `AccentColor`.

### `src/components/SceneFrame.tsx` — wrapper mestre

Toda cena DEVE estar envolta em `<SceneFrame>`. Ele cuida de:
- Background color (`theme.colors[mode].background`)
- Safe area (padding interno = `theme.safeArea`)
- Animação de entrada (spring gentle no opacity + scale 0.98→1.0)
- Animação de saída (fade nos últimos 12 frames)
- Caption strip embaixo (sempre Inter medium centralizado, cor `textSecondary`)
- Branding opcional (logo "aulacraft" no canto)

```tsx
<SceneFrame mode="light" caption={scene.caption}>
  {/* conteúdo da cena — todo usando theme.* */}
</SceneFrame>
```

**Templates não renderizam mais:** fundo, padding de borda, caption próprio, blobs decorativos, topographic background. SceneFrame ou theme cuidam.

---

## 6. Templates de cena (estado de refatoração)

`canva_v7.tsx` tem 6 templates. Mapeamento:

| Template | Status | Notas |
|---|---|---|
| `CanvaTitleScene` | ✅ **Refatorado** | Usa SceneFrame mode=light + theme. Fraunces serif, chips pill com dot colorido + name + sublabel. Sem blobs/topo. |
| `CanvaAnnotatedHeartScene` | ❌ Hardcoded antigo | Heart image + pin annotations sobre fundo navy + blobs + topo. Annotations posicionadas em coordenadas chutadas (não batem com imagem real). |
| `CanvaFlowDiagramScene` | ❌ Hardcoded antigo | Pills com setas magenta sobre fundo navy. |
| `CanvaStatScene` | ❌ Hardcoded antigo | Número gigante 360px sobre fundo navy + ponto magenta. |
| `CanvaHeroHeartScene` | ❌ Hardcoded antigo | Heart image centralizada com glow magenta + heart beat scale. |
| `CanvaClosingScene` | ❌ Hardcoded antigo | Título grande + subtitle sobre fundo navy. |

**Componentes auxiliares no canva_v7.tsx (legados, ainda exportados):**
- `TopographicBackground` — pattern de linhas curvas SVG
- `AtmosphericBlobs` — 2 PNGs iridescentes nos cantos
- `CanvaCaption` — caption strip serif italic com ponto magenta
- `CanvaSceneWipe` — transição diagonal magenta entre cenas

Esses componentes **não devem ser usados nos templates refatorados** — viraram código de transição até todos os 6 templates migrarem.

---

## 7. Como executar

**Setup inicial (já feito):**
- Node + npm instalados
- Python 3.10 + Whisper venv em `C:\Users\lucas\.whisper-venv\`
- ffmpeg disponível em PATH
- `.env` com `GEMINI_API_KEY`, `FAL_KEY`, `PIXABAY_API_KEY`, `REMOTION_AWS_*`, `ANTHROPIC_API_KEY`

**⚠️ PowerShell + npm:** sempre usar `npm.cmd` / `npx.cmd` (não `npm` / `npx` direto — `npm.ps1` está bloqueado no sistema do user).

**Comandos comuns:**

```powershell
# Render local (rota usada atualmente — Lambda quota pendente)
cd C:\Users\lucas\projetos\aulacraft\spike
npm.cmd run render

# Re-gerar narração (após mudar script.txt)
npx.cmd ts-node src/regen-narration.ts

# Re-transcrever via Whisper (após nova narração)
C:\Users\lucas\.whisper-venv\Scripts\python.exe scripts/transcribe.py

# Re-gerar storyboard via Claude
npx.cmd ts-node src/generate-storyboard.ts

# Re-gerar imagens via fal.ai (custo ~$0.05-0.10)
npx.cmd ts-node src/regen-images.ts

# Validar TS após qualquer mudança
npx.cmd tsc --noEmit --jsx react

# Preview interativo Remotion (se quiser olhar frames sem renderizar)
npx.cmd remotion preview src/index.ts

# Checar AWS Lambda quota
npx.cmd remotion lambda quotas
```

**⚠️ tsconfig.json NÃO tem `jsx` setado** — sempre passar `--jsx react` ao `tsc` na linha de comando.

---

## 8. Dependências externas (custo)

| Serviço | Uso | Custo |
|---|---|---|
| Gemini TTS Charon | narração | ~$0.001 por vídeo |
| Whisper (local) | timestamps | $0 (venv local) |
| Claude Sonnet 4.6 | storyboard | ~$0.15 por vídeo (com prompt cache: re-rodadas na mesma janela 5min ~$0.04) |
| fal.ai flux-pro | imagens hero | ~$0.02 por imagem (5 imagens/vídeo = $0.10) |
| Remotion render local | render | $0 (CPU local, 3-8 min/vídeo) |
| Remotion Lambda | render scaled | **BLOQUEADO** — AWS quota pendente desde 2026-05-22 |

**Total por vídeo no spike:** ~$0.25 + tempo de render.

**Custo escalado MVP:** rever quando AWS desbloquear + storyboards forem re-rodados sem cache.

---

## 9. Decisões críticas tomadas (não desfazer sem motivo forte)

1. **Stack Remotion** (não Hyperframes, não AI video gen). Hyperframes é Apache 2.0 mas single-machine only — não escala. Remotion tem Lambda production-ready. Hyperframes pode entrar como hybrid pra clips específicos no futuro.

2. **Conteúdo visualizável apenas.** Coração, sistema solar, célula, motor, química — coisas com forma física pra ilustrar. NÃO soft skills / marketing / coaching.

3. **Mono + 1 accent por cena.** ❌ Rejeitado depois de v4 rainbow disaster. Paleta restrita coesa o vídeo inteiro.

4. **Caption SEMPRE presente embaixo.** ❌ Tentei remover na v5 (typography como motion graphic) e foi rejeitado.

5. **Mix dark + light backgrounds.** Vídeo all-dark fica monotone. SceneFrame suporta `mode='light'|'dark'`.

6. **Design tokens centralizados (theme/tokens.ts) + wrapper mestre (SceneFrame).** Pivot de 2026-05-23 depois de 7 iterações ad-hoc fracassadas. Templates DEVEM usar isso. Zero hardcoded.

7. **Asset preparation antes de codar.** Lição da v7: gerei imagens via fal.ai com fundo retangular dark próprio e usei direto — ficou um retângulo desfigurado na cena. Próxima vez: remover background (rembg) + verificar onde os elementos visíveis estão antes de posicionar annotations.

---

## 10. Anti-patterns documentados (NÃO repetir)

- ❌ Slideshow estático com fade — "sem graça" (v1-v3)
- ❌ Rainbow hue-rotate background + particles + camera shake — "festa de aniversário infantil" (v4)
- ❌ Tipografia restrita em charcoal vazio — "sem graça" (v5)
- ❌ Wireframe 3D Iron Man HUD do conteúdo principal — "sem capricho, sem layout" (v6)
- ❌ Spheres 3D primitivas tentando representar anatomia — "boneco de balão" (v6)
- ❌ Decoração de Canva (blobs + topo) jogada em template sem integração — "elementos sem sentido" (v7)
- ❌ Per-word kinetic typography sem captions — palavras viram motion graphic mas perde clareza (v5)
- ❌ Per-scene accent color mudando — destrói identidade visual (v4)
- ❌ Inventar design ao invés de seguir spec exato (todas iterações)

---

## 11. Pendências imediatas

**Pronto pra próxima ação (aguardando user):**

1. **Refatorar os 5 templates restantes** do `canva_v7.tsx` pro novo sistema (theme + SceneFrame). User decidiu fazer 1 por vez com instruções explícitas. Ordem provável:
   - CanvaAnnotatedHeartScene (mais complexo — tem imagem + annotations + leader lines)
   - CanvaFlowDiagramScene
   - CanvaStatScene
   - CanvaHeroHeartScene
   - CanvaClosingScene

2. **Asset preparation discipline** — antes de usar qualquer imagem do fal.ai, processar (remover background, validar posições visíveis). Atual `heart_anatomy.png` tem fundo retangular dark.

3. **Generalizar AnatomyPart enum** quando trocar de tópico (hoje é hardcoded pra coração).

**Bloqueado externamente:**
- AWS Lambda quota approval (pedido 10→5000 em 2026-05-22).

**Tech debt aceitável (não fazer agora):**
- Version mismatch `@remotion/three@4.0.465` vs resto `4.0.464`. Não quebra render, pinear depois.
- `assets/image_1.png` / `image_2.png` / `image_3.png` não usados — podem deletar.
- `tsconfig.json` sem `"jsx": "react"` — sempre passar flag manual no tsc.

---

## 12. Estilo de trabalho do user (CRITICAL)

Aprendizado de 7 iterações: **o user não quer Claude adivinhando design**. Quando recebo spec exata (theme tokens + estrutura de componente + regras numeradas), eu executo bem. Quando tento inventar, falha consistentemente.

**Comportamento esperado:**
- ✅ Seguir instruções literalmente
- ✅ Confirmar entendimento ANTES de codar quando algo for ambíguo (pedir clarificação, NÃO inventar)
- ✅ Validar com `tsc --noEmit --jsx react` após cada mudança
- ✅ Reportar exatamente o que foi feito (arquivos tocados, validação resultado)
- ❌ NÃO propor variações não pedidas
- ❌ NÃO refatorar código adjacente "de quebra"
- ❌ NÃO adicionar features extras "úteis"
- ❌ NÃO inventar valores visuais (cor, tamanho, etc.) — sempre vem de spec do user

**User trabalha em pt-BR.** Resposta direta, sem rodeio, sem emojis a menos que pedido.

**User é YouTuber + dev iniciando** — conhece bem retenção/engagement de vídeo, conhece menos detalhe técnico de React/Remotion. Explicar trade-offs técnicos com clareza sem jargão excessivo.

---

## 13. Memória persistente do agente

Caso esteja usando Claude/agente com memory system em `~/.claude/projects/.../memory/`:

Entradas relevantes pro AulaCraft (já criadas):
- `project_saas_faceless_premium.md` — produto / decisões locked
- `feedback_aulacraft_motion_graphics_bar.md` — slideshow não passa
- `feedback_aulacraft_cartoon_animation_bar.md` — régua "dança visual sincronizada com áudio"
- `feedback_aulacraft_visualizable_content.md` — só visualizável (anatomia/ciências)
- `project_aulacraft_visual_direction.md` — X-Pilot + Visla hybrid (parcialmente superseded pelo novo design system)
- `feedback_aulacraft_workflow_disciplinado.md` — pivot pra spec exato
- `reference_aulacraft_design_system.md` — theme/tokens + SceneFrame
- `reference_aulacraft_spike_state.md` — pointer pra este HANDOFF.md
- `reference_hyperframes_oss.md` — Hyperframes single-machine only
- `environment_powershell_npm.md` — usar `npm.cmd`/`npx.cmd`

---

## 14. Onde começar (próximo agente / sessão)

1. Ler **este HANDOFF.md** inteiro
2. Ler `src/theme/tokens.ts` (~135 linhas) — internalizar sistema
3. Ler `src/components/SceneFrame.tsx` (~135 linhas) — entender wrapper mestre
4. Ler `src/compositions/canva_v7.tsx` linhas 209-336 — entender `CanvaTitleScene` (referência do estilo refatorado)
5. Ler `src/compositions/LessonSummary.tsx` — entender orquestração
6. Validar build: `npx.cmd tsc --noEmit --jsx react` (deve passar exit 0)
7. (Opcional) Render atual: `npm.cmd run render` → abrir `output/demo.mp4`
8. Aguardar instrução do user pra próximo template a refatorar
