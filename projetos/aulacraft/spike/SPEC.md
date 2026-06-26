# Aulacraft — Specification

> **Documento mestre único.** Fonte da verdade do produto. Substitui o `SPEC.md` v3 (2026-05-24).
> Última atualização: 2026-06-25 (v4 — reconciliação com o MVP real)
> Status: reconciliado com as decisões de produto e com o pipeline construído no spike.

## Como ler este documento (selos de fase)

Cada feature carrega um selo:

- **`[v1]`** — faz parte do MVP. É o que está sendo construído agora.
- **`[v2+]`** — visão de futuro. Fica documentada aqui (este é o mapa completo do produto), mas NÃO entra no MVP. Não construir sem decisão explícita.

Princípio: nada é apagado do mapa. O que não é MVP é etiquetado `[v2+]`, não removido. Assim o documento descreve o produto inteiro, com o horizonte visível, sem fingir que tudo é v1.

### Resumo do MVP (o que `[v1]` significa em uma frase)

Um gerador de **vídeos educacionais avulsos** (não cursos), para **infoprodutor brasileiro**, pago por **pacotes de crédito em BRL via Kiwify** (pré-pago, sem assinatura), onde o cliente cola um **roteiro pronto**, escolhe marca e voz, e recebe um MP4 cinematográfico.

---

## Índice

**Parte I — DNA do Produto** (o porquê)
1. Produto em uma frase
2. Público-alvo
3. Diferencial competitivo (moat)
4. Estética visual (DNA do produto)
5. Anti-patterns visuais
6. Princípio de modelos externos
7. Posicionamento e naming

**Parte II — Produto** (o quê)
8. Core user journey
9. Feature scope (v1 / v2+)
10. Monetização (créditos Kiwify)
11. Unit economics

**Parte III — Implementação** (o como)
12. Pipeline técnico
13. Identidade visual (sistema de design)
14. Templates Remotion
15. Data model (Supabase)
16. API routes
17. External integrations
18. Tech stack

**Parte IV — Operação** (o quando e o se)
19. Build sequence (fases)
20. Demo-first constraint
21. Go-to-market
22. Resolved decisions
23. Sustainability & kill criteria
24. Anti-patterns de execução

**Apêndice A — Visão v2+** (features rebaixadas, com racional)

---

# PARTE I — DNA DO PRODUTO

> A Parte I é atemporal: descreve o porquê do produto e não muda com a fase. Vale igual no v1 e no v2+.

## 1. Produto em uma frase

> **Aulacraft transforma um script de texto em vídeo educacional cinematográfico no estilo MasterClass + X-Pilot, pronto pra ser vendido como infoproduto.**

---

## 2. Público-alvo

**Cliente do Aulacraft** = infoprodutor brasileiro premium que vende cursos entre R$ 500 e R$ 10.000.

> `[v1]` Mercado-alvo do MVP: **Brasil apenas**. Copy, checkout (Kiwify), moeda (BRL) e voz (PT-BR) são todos calibrados pro BR. Expansão US/EU é `[v2+]`.

### Nichos-alvo (em ordem de prioridade pro seed market)

- Marketing digital
- Finanças pessoais / investimentos
- Empreendedorismo / vendas
- Liderança / mindset
- Lançamentos / copy
- Tráfego pago
- Desenvolvimento pessoal
- Espiritualidade / autoconhecimento

### Plataformas de hospedagem onde o cliente já vende

Hotmart (primária), Kiwify, Cademí, Teachable, Kajabi, Thinkific.

### Referências de criadores BR que o cliente quer parecer

Thiago Nigro (Primo Rico), Pablo Marçal, Erico Rocha, Flávio Augusto, Joel Jota.

### NÃO é cliente do Aulacraft

- Professor de ensino fundamental (faz aula real, não infoproduto)
- Cursos técnicos de anatomia/medicina/engenharia (precisa de ilustração técnica)
- Criadores de Reels viral curto (Submagic resolve)
- Agências (multi-cliente, multi-seat)
- Times corporativos enterprise
- YouTube AdSense faceless operators

### Marketing caution

Copy e ads paid falam especificamente com infoprodutor BR. A ferramenta é mais ampla mas a mensagem é focada.

---

## 3. Diferencial competitivo (moat)

**Não existe concorrência direta.** O mercado tem:

- **Submagic / Opus Clip** → cortam vídeo já existente em shorts virais. Não geram do zero.
- **HeyGen / Synthesia** → avatar IA + b-roll. Uncanny valley + commodity.
- **Pictory / Invideo** → text-to-video genérico, qualidade slideshow-medium.
- **Runway / Sora / Veo** → modelos brutos de vídeo IA. Caro, sem produto educacional.

**Aulacraft = a única plataforma que entrega vídeo cinematográfico-editorial premium gerado de texto, calibrado pro mercado de infoprodutos BR.**

### Moat técnico

**Curadoria conceitual automatizada.** A IA do Aulacraft não escolhe imagens literais ("rico = homem de terno"), escolhe **metáforas visuais** ("riqueza = pessoa olhando horizonte ao entardecer"). Isso é o que separa "amador automático" de "premium automático".

### Moats de produto

- `[v1]` **Brand kit** — logo + paleta + nome aplicados consistentemente em toda aula
- `[v1]` **Templates calibrados pra soft-skill BR** — 6 templates construídos (ver Seção 14)
- `[v2+]` **Brand consistency across series** — toda aula de um curso compartilha brand kit + voz + música
- `[v2+]` **Series generation** — paste outline de 10 aulas → fila gera todas com consistência (throttled)
- `[v2+]` **Background music cinematográfica** — biblioteca curada com auto-ducking sob narração

> Nota: o moat do MVP é curadoria conceitual + brand kit + templates calibrados. Séries e música são moats fortes, mas de fase v2+ — entram quando o MVP estiver validado.

### Roadmap explícito (v2+)

- Template `practice_exercise`
- Template `cinematic_lesson` (mais complexo)
- Voice cloning (deepfake liability — tratar com cuidado)

---

## 4. Estética visual (DNA do produto)

### Inspiração-fonte (em ordem de peso)

1. **MasterClass trailers** (peso 60%) — autoridade cinemática, ritmo respirado
2. **X-Pilot AI** (peso 30%) — tipografia editorial mista, layout assimétrico, glow controlado
3. **Cortes editados BR premium** (peso 10%) — energia, ritmo, conexão Hotmart

### Características visuais OBRIGATÓRIAS

- **Fundo escuro dominante** (cenas claras existem mas são minoria, pra contraste)
- **Tipografia editorial mista** — display condensada GRANDE + sans neutra pequena + serifa em itálico pra ênfase + mono geométrica pra números
- **B-roll cinematográfico** com color grade teal & orange dessaturado
- **Frases de impacto isoladas** em cenas inteiras (sem b-roll, só texto-bomba)
- **Cortes propositais** — duração de cena sincronizada com cadência da narração
- `[v2+]` **Música cinematográfica suave** de fundo (não EDM, não trap, não corporate motivacional)
- **Lower thirds elegantes** quando aparece referência (autor de citação, fonte de dado)
- **Vinheta sutil** nos cantos pra ar cinema
- **Glow controlado** em palavras-chave (nunca fundo retangular cru)
- `[v2+]` **Sound design**: whoosh sutil em transições, impacto baixo em frases-chave
- **Layout assimétrico** — texto ancorado em bordas, não centralizado geometricamente
- **Disparidade brutal de escala** — contraste 40px vs 220px, não 32px vs 48px
- **Vazio proposital** — pelo menos 30% do frame respirando sem nada

### Gramática visual aprendida (extraída do `TypeImpactScene` aprovado)

Toda cena do Aulacraft deve combinar ao menos 4 destas 6 regras:

1. **Layout em zonas, não centralizado.** Elementos ancorados em borda (esquerda/direita, topo/baixo).
2. **3 fontes coexistindo na mesma cena.** Nunca uma só.
3. **Hierarquia por contraste extremo de tamanho.** Estrutura vs impacto.
4. **Detalhe-âncora editorial.** Elemento pequeno (traço + label caps com letterspacing) que sinaliza "produto premium, não slide".
5. **Âmbar = ênfase. Cinza médio = estrutura. Creme = volume.** Cores com papel sistêmico, não decorativo.
6. **Vazio proposital.** Mínimo 30% do frame respirando.

---

## 5. Anti-patterns visuais

Lista oficial do que NUNCA aparece em vídeo gerado pelo Aulacraft:

- Avatar IA falando
- Ilustração técnica de objeto físico (coração, motor, célula)
- Blobs iridescentes / gradientes neon "AI generated"
- Cor saturada estilo Duolingo/gamificação
- Comic-sans / fontes "fofas"
- Layout simétrico tipo PowerPoint
- Stock genérico "business handshake LinkedIn"
- Pessoa IA gerada
- Transição com flash branco / cortes rápidos tipo TikTok
- Música EDM / corporate motivacional
- Per-scene accent color mudando (destrói identidade)
- Decoração visual sem propósito (blobs, gradientes neon)

---

## 6. Princípio de modelos externos (IA, APIs, infra)

Quando o Aulacraft depender de modelo externo (fal.ai pra imagem, Gemini pra TTS, Claude pra storyboard, futuras integrações), a regra é:

**Usar o que funciona e é recente.**

Concretamente:

1. **Modelos novos entregam resultado melhor por padrão.** Não economizar em endpoint pra ganhar centavos por aula — o custo de uma aula é tão baixo que diferença de 30% no preço do modelo é irrelevante perto da diferença de qualidade visual.

2. **Revisar modelo escolhido a cada novo template/feature.** Não assumir que o modelo certo 3 meses atrás continua certo. O mercado de IA generativa muda rápido — checar o estado-da-arte atual, não o estado-da-arte de quando o código foi escrito.

3. **Preferir famílias estáveis a modelos exóticos.** Se trocar de modelo, preferir migração dentro da mesma família (FLUX 1 → FLUX 2) a trocar de provider/arquitetura. Mantém consistência estética entre assets do mesmo produto.

4. **Testar antes de trocar.** Nunca migrar modelo "no escuro" — gerar o mesmo prompt em 2-3 modelos, comparar lado a lado, decidir com a imagem em mãos.

---

## 7. Posicionamento e naming

### Positioning

> "NotebookLM é pra entender o que você lê. Aulacraft é pra produzir o que você ensina."

### Tagline candidate

> "Seu estúdio cinematográfico de aulas, automatizado."

### Naming

"Aula" é pt-BR — ressoa no seed market BR, mas é opaco pra US/EU. Reavaliar brand localization antes de qualquer expansão internacional `[v2+]`.

---

# PARTE II — PRODUTO

## 8. Core user journey

### `[v1]` Jornada do MVP

```
Cadastro (conta primeiro) → Comprar pacote de créditos (checkout Kiwify, Pix) →
Webhook credita o saldo → Criar brand kit (cores + logo + nome + voz default) →
Colar roteiro pronto + escolher brand + escolher voz → Gerar vídeo (consome 1 crédito) →
Acompanhar status → Baixar MP4 → Subir na plataforma do cliente (Hotmart/Kiwify/etc)
```

### Regras-chave `[v1]`

- **Conta primeiro, compra depois.** O cliente cria conta no Aulacraft; depois compra créditos. O webhook da Kiwify casa pelo email da conta existente.
- **Roteiro pronto.** No MVP o cliente cola o roteiro já escrito. O Aulacraft transforma esse roteiro em storyboard e vídeo. (Expansão de tópico→roteiro do zero é `[v2+]`.)
- **Pago antes de gerar.** Sem créditos, sem geração. 1 crédito = 1 vídeo.
- **1 voz por vídeo.** Default vem do brand kit; pode ser sobrescrita por vídeo.

### `[v2+]` Jornada estendida (futuro)

- Expansão de script: cliente cola só um tópico/outline → Claude escreve o roteiro → review opcional.
- Preview de 30s antes do render completo (anti-loop de regeneração).
- Course / série: criar curso, adicionar N aulas ordenadas, gerar todas em lote.

---

## 9. Feature scope

### IN v1 (MVP)

| Feature | Notes |
|---|---|
| Auth (conta primeiro) | Supabase Auth. Email/senha + Google OAuth. |
| Brand kit | Logo, paleta (3 cores), nome da marca, voz default. R2 storage. |
| 4 vozes curadas (2M + 2F) | Gemini TTS. Validadas em PT-BR pelo time. Rótulos amigáveis mapeando nomes do Gemini. Default no brand kit, override por vídeo. |
| 6 templates Remotion | Ver Seção 14. |
| Script input (roteiro pronto) | Textarea. Cliente cola o roteiro. |
| Storyboard generator (Claude) | Roteiro → storyboard.json (regra 70/20/10). Fundação do produto. |
| Gemini TTS narração | Charon + 3 outras vozes curadas |
| fal.ai FLUX 2 [pro] | Fundos AI das cenas tipo `AIOpenerScene` / `AICloserScene` |
| Pexels API | Stock cinematográfico pras cenas tipo `StockHeroScene` |
| Whisper | Timestamps por palavra. **Fundação — fica no v1** (sincronia/legibilidade do pipeline). |
| Color grade automático | Teal & orange dessaturado via Remotion nos clips stock |
| Auto-shrink de texto | Templates encolhem fonte pra texto longo caber (corrigido no spike) |
| workDir isolado por job | Cada geração roda em diretório próprio (jobs/{id}) |
| Remotion render | Local no spike; Lambda na produção SaaS |
| Cloudflare R2 storage | Vídeo final, signed URLs |
| Download MP4 | From signed R2 URL |
| Re-download | Sempre disponível, gera signed URL fresca |
| Créditos pré-pagos (Kiwify) | 3 pacotes BRL. Webhook `compra_aprovada` credita. Ver Seção 10. |
| Consumo de crédito | 1 crédito debitado por vídeo gerado |
| Brazilian market | BR-only: BRL, PT-BR, Kiwify, Pix |

### OUT v1 → ver Apêndice A (Visão v2+)

Resumo do que foi rebaixado pra `[v2+]` (detalhe e racional no Apêndice A):

| Feature | Fase |
|---|---|
| Cursos / módulos | v2+ |
| Séries (geração em lote) | v2+ |
| Plano Pro (priority queue, 4K, API pública) | v2+ |
| Assinatura mensal (MRR) | v2+ |
| Free tier + anti-abuso (email descartável, rate limit IP, fingerprint, kill switches de free) | v2+ |
| Marca d'água | v2+ (não há free tier no v1, todo mundo paga) |
| Background music + ducking | v2+ |
| Preview de 30s | v2+ |
| Expansão de tópico→roteiro (Claude) | v2+ |
| Moderação de conteúdo (OpenAI Moderation) | v2+ (risco conhecido, adiado por decisão) |
| GDPR/LGPD export+delete endpoints | v2+ (LGPD quando houver base de usuários) |
| Inngest (fila multi-step com prioridade) | v2+ |
| Templates `StockSplitScene`, `AITransitionScene` | v2+ (nunca construídos) |
| Cap de duração por plano / 4K | v2+ |
| ElevenLabs upgrade | v2+ (após tração) |
| Voice cloning | v2+ |
| pt-BR UI já é default (não é localização) | — |

---

## 10. Monetização (créditos Kiwify)

### `[v1]` Modelo: pacotes de crédito pré-pagos em BRL

Sem assinatura. Sem mensalidade. O cliente compra um pacote de créditos e gasta conforme gera. **1 crédito = 1 vídeo gerado.**

| Pacote | Preço | Vídeos | Preço/vídeo |
|---|---|---|---|
| Inicial | R$ 47 | 3 | ~R$ 15,67 |
| Médio | R$ 127 | 10 | R$ 12,70 |
| Grande | R$ 297 | 30 | R$ 9,90 |

### Regras de crédito

- **Créditos são vitalícios.** Não expiram. (Evita atrito de suporte e risco de CDC sobre expiração de pré-pago.)
- **Pago antes de gerar.** O débito acontece na geração do vídeo.
- **Sem free tier no v1.** Ninguém gera sem ter comprado. Isso elimina todo o aparato anti-abuso que protegia o tier grátis.
- **Sem marca d'água.** Todo cliente pagou; entrega limpa.

### Fluxo de compra `[v1]`

1. Cliente (já com conta) escolhe um pacote → vai pro **checkout do Kiwify** (hospedado pela Kiwify, Pix nativo).
2. Pagamento aprovado → Kiwify dispara webhook **`compra_aprovada`** pro Aulacraft.
3. Aulacraft recebe o webhook, identifica o cliente **por email**, e credita: `credits_balance += N`.
4. Registra a transação em `credit_transactions` (auditoria + resolução de disputa).
5. Cliente gera vídeo → debita 1 crédito.

### Por que Kiwify (e não Lemon Squeezy / Stripe / Mercado Pago)

- Infoprodutor BR já confia na Kiwify (é onde ele vende).
- Pix nativo, sem fricção de cartão internacional.
- Webhook `compra_aprovada` → conceder crédito é padrão comprovado.
- Taxa ~9% (8,99% + R$2,49) não mata a margem dado o COGS baixíssimo.
- Lemon Squeezy/Stripe: descartados pro MVP BR (cartão USD, sem Pix nativo confiável).
- Mercado Pago: `[v2+]` — checkout integrado pra reclamar margem quando escalar.

---

## 11. Unit economics

### `[v1]` Custo por vídeo (MVP, sem overhead pesado de SaaS)

| Item | Custo aprox. |
|------|-------|
| Gemini TTS | ~$0.001 |
| Claude storyboard (com cache) | ~$0.04 |
| Stock (Pexels free) | ~$0.05 |
| fal.ai FLUX 2 (2-3 imagens) | ~$0.10 |
| Remotion render (Lambda) | ~$0.04 |
| R2 storage | ~$0.01 |
| **Total por vídeo** | **~$0.25-0.35** |

### Margem no modelo de crédito

Convertendo grosso a R$5/USD, o custo por vídeo é ~R$1,25-1,75. No pacote mais barato (R$47/3 = R$15,67/vídeo), descontada a taxa Kiwify (~R$3,90 no pacote), a margem bruta por vídeo fica confortável (acima de 80%). No pacote grande (R$9,90/vídeo) a margem segue saudável. Volume baixo no início = COGS irrelevante.

> `[v2+]` Monitoramento de COGS diário (cron + alertas) entra quando o volume justificar. No MVP, os alertas nativos do fal.ai/GCP cobrem o risco.

---

# PARTE III — IMPLEMENTAÇÃO

## 12. Pipeline técnico

### Inputs `[v1]`

1. **Roteiro** (texto pronto, colado pelo cliente)
2. **Brand config** (cores + logo + nome do curso — opcional, fallback Aulacraft default)
3. **Voz** (escolhida pelo cliente entre as 4 curadas; default do brand kit)

### Pipeline real (construído e validado no spike) `[v1]`

```
script.txt (roteiro pronto)
   │
   ▼
[1] generate-storyboard (Claude Sonnet) ─► storyboard.json
     - Decide tipo de cada cena (proporção 70/20/10)
     - narrationText fiel ao roteiro (AICloser compõe CTA próprio)
     - Stock: extrai conceito visual (não literal), gera query EN
     - Tipografia: extrai frase-bomba
     - IA: define prompt abstrato pro FLUX 2
   │
   ▼
[2] resolve-assets (Pexels + fal.ai) ─► storyboard.resolved.json (+ stock/, ai/)
     - Stock: Pexels API → mp4 clips
     - IA: fal.ai FLUX 2 [pro] → imagens abstratas
   │
   ▼
[3] resolve-audio (Gemini TTS + ffmpeg) ─► narration.mp3 + audioUrl
     - TTS por cena (voz escolhida)
     - mede duração (ffprobe) → define durationInFrames da cena
     - concatena narração das cenas
   │
   ▼
[4] render (Remotion) ─► lesson.mp4
     - publicDir = workDir do job (assets isolados por job)
     - aplica templates por tipo de cena
     - render h264 1920×1080
```

> **Nota sobre Whisper `[v1]`:** Whisper (transcrição com timestamps por palavra) é fundação do projeto e permanece no escopo v1. No pipeline atual a duração de cena é derivada do áudio medido; o Whisper sustenta a sincronia fina e a precisão de timestamps conforme o pipeline evolui. Não remover.

> **Diferença vs SPEC antigo:** o pipeline antigo era TTS → Whisper → storyboard. O pipeline construído gera o storyboard **a partir do roteiro** (storyboard-first), e o áudio depois. O `narrationText` de cada cena sai do roteiro; a duração de cena vem do mp3 medido. Isso é mais enxuto e já está validado.

### Isolamento de job `[v1]`

Cada geração roda num **workDir próprio** (`jobs/{id}/`): storyboard, assets (stock/ai), narração e output ficam todos dentro do diretório do job. O `render` usa `publicDir = workDir`, então jobs não colidem e o diretório legado nunca é tocado. (Refatorado e validado no spike — TIJOLO 1.)

### Proporção de cenas (regra do storyboard generator) `[v1]`

- **70% cenas STOCK** — b-roll cinematográfico de Pexels com color grade. Mix conceito abstrato + pessoa real.
- **20% cenas TIPOGRAFIA** — frase-bomba isolada em tela inteira, sem b-roll. Momento MasterClass.
- **10% cenas IA** — abertura e encerramento. FLUX 2 pra fundos abstratos. NUNCA pessoa gerada.

> Limite: 8 a 15 cenas por vídeo. Cada cena cobre uma ideia, 4-10s de narração.

---

## 13. Identidade visual (sistema de design)

### Arquitetura: Brand vs System

**`system` (definido pelo Aulacraft, inviolável):**
- Tipografia, escalas de tamanho, espaçamentos, regras de motion, princípios de layout, tratamento de imagem (glow, vinheta, color grade)

**`brand` (definido pelo cliente/curso, customizável):**
- 3 cores principais (background, accent primary, accent secondary)
- Logo (PNG opcional)
- Nome da marca/curso
- `[v1]` Voz default (entre as 4 curadas)

### Fallback padrão do Aulacraft

```
backgroundDark:   #0B0F1E   (azul-marinho profundo cinematográfico)
backgroundLight:  #F5F1EA   (creme suave pra cenas alternativas)
accentPrimary:    #F59E0B   (âmbar dourado — autoridade + conhecimento)
accentSecondary:  #FB7185   (coral suave — emoção, humanidade)
textOnDark:       #F5F1EA
textOnLight:      #0B0F1E
```

### Tipografia (fixa, não customizável)

- **Display** (frases-bomba, títulos de cena): `Bebas Neue` — sans condensada ousada
- **Body** (UI, captions, body text): `Inter` — sans neutra
- **Editorial** (lower thirds, citações, autores, ênfase): `Fraunces` — serifa moderna
- **Mono** (números, estatísticas): `Space Mono` — mono técnica

Carregadas via `@remotion/google-fonts`.

### Tokens implementados (`src/theme/`)

- `system.ts` — DNA do produto, inviolável
- `brand.ts` — config customizável por curso (com fallback default)
- `index.ts` — `composeTheme(brand)` que funde os dois
- `fonts.ts` — bootstrap de fontes

---

## 14. Templates Remotion

Todos 1920×1080, 30fps, H.264. Sem CSS animations — todo motion via `useCurrentFrame()` + `interpolate()`.

> `[v1]` São **6 templates construídos**. Todos auto-encolhem texto longo pra caber no frame (correção validada no spike). Os templates `StockSplitScene` e `AITransitionScene`, citados no SPEC antigo, **nunca foram construídos** → `[v2+]`.

### `[v1]` Categoria STOCK

**`StockHeroScene`** — B-roll cinematográfico fullscreen com color grade teal & orange, vinheta nos cantos, caption sincronizada, opcional lower third pra citação/autor. *Construído.*

**`StockOverlayScene`** — B-roll fullscreen com tipografia GIGANTE sobreposta (Bebas Neue) + glow. Estilo trailer MasterClass. *Construído.*

### `[v1]` Categoria TIPOGRAFIA

**`TypeImpactScene`** — Frase-bomba estruturada com palavras de ênfases diferentes (`normal` / `display-huge` / `editorial-italic`). Layout assimétrico, número Space Mono dominante. Animação palavra-a-palavra, glow âmbar. **Referência aprovada da gramática visual.** Auto-shrink implementado. *Construído.*

**`TypeQuoteScene`** — Citação com atribuição. Texto Fraunces italic grande, autor pequeno Inter + linha fina. *Construído.*

### `[v1]` Categoria IA

**`AIOpenerScene`** — Abertura cinematográfica. Fundo FLUX 2 abstrato, título com entrada cinemática, subtítulo. *Construído.*

**`AICloserScene`** — Encerramento com CTA. Mesmo padrão estético da abertura. Narração própria (CTA composto, não sai do roteiro). *Construído.*

### `[v2+]` Templates futuros

- `StockSplitScene` — B-roll em metade + tipografia na outra. Nunca construído.
- `AITransitionScene` — Transição entre seções com imagem abstrata em movimento. Nunca construído.
- `practice_exercise`, `cinematic_lesson` (Pro) — roadmap.

### Shared schema (storyboard) `[v1]`

Cada cena tem `type`, `durationInFrames`, `narrationText` (não-vazio, validado por Zod `.min(1)`), e `props` específicas do template. As cenas de stock têm `stockQuery`. A validação roda com retry — se o Claude devolver cena inválida, regenera.

---

## 15. Data model (Supabase)

> `[v1]` Data model enxuto pro modelo de crédito. Sem `courses` (vídeos são avulsos), sem `plan`/assinatura (créditos no lugar). As tabelas/colunas `[v2+]` ficam marcadas.

### `profiles` (extends `auth.users`) `[v1]`
```sql
id                  uuid PK references auth.users(id)
credits_balance     int default 0      -- saldo de créditos (1 crédito = 1 vídeo)
created_at          timestamptz default now()
-- [v2+] plan, is_founder, billing_anchor, api_key_hash (quando houver assinatura/Pro)
```

### `credit_transactions` `[v1]` (nova)
```sql
id                  uuid PK
user_id             uuid FK profiles.id
kiwify_order_id     text               -- id da transação Kiwify (idempotência)
package             text               -- 'inicial' | 'medio' | 'grande'
credits_granted     int
amount_brl          numeric(10,2)
created_at          timestamptz default now()
```

### `brand_kits` `[v1]`
```sql
id                  uuid PK
user_id             uuid FK profiles.id
name                text
logo_url            text
background_dark     text   -- hex
accent_primary      text   -- hex
accent_secondary    text   -- hex
brand_name          text
default_voice_id    text   -- uma das 4 vozes curadas
created_at          timestamptz
-- [v2+] intro_clip_url, outro_clip_url, music_track_id
```

### `videos` `[v1]` (era `lessons`; sem curso, é avulso)
```sql
id                    uuid PK
user_id               uuid FK profiles.id
brand_kit_id          uuid FK brand_kits.id
title                 text
script                text                -- roteiro pronto colado
voice_id              text                -- voz escolhida (override do brand kit)
status                text                -- 'draft' | 'queued' | 'storyboard' | 'assets' | 'audio' | 'rendering' | 'ready' | 'error'
error_message         text
storyboard_json       jsonb
r2_key                text
signed_url            text
signed_url_expires_at timestamptz
duration_seconds      int
created_at            timestamptz
updated_at            timestamptz
-- [v2+] course_id, order_index, resolution (4K), preview_url, has_watermark
```

### `[v2+]` Tabelas futuras
- `courses` — quando houver agrupamento em curso/série
- `generation_jobs` detalhado + `cost_alerts` — quando houver Inngest + monitoramento de COGS

---

## 16. API routes (Next.js App Router)

### `[v1]` Rotas do MVP

| Method | Route | Description |
|---|---|---|
| POST | `/api/brand-kits` | Create brand kit |
| GET | `/api/brand-kits` | List user's brand kits |
| PATCH | `/api/brand-kits/:id` | Update brand kit |
| DELETE | `/api/brand-kits/:id` | Delete brand kit |
| POST | `/api/brand-kits/:id/upload` | Upload logo → R2 |
| GET | `/api/voices` | Lista as 4 vozes curadas (rótulos amigáveis) |
| POST | `/api/videos` | Create video (roteiro + brand + voz) |
| GET | `/api/videos` | List user's videos |
| GET | `/api/videos/:id` | Get video + status |
| POST | `/api/videos/:id/generate` | Enfileira geração (debita 1 crédito) |
| GET | `/api/videos/:id/status` | Poll status |
| POST | `/api/videos/:id/redownload` | Fresh signed URL |
| GET | `/api/credits` | Saldo de créditos do usuário |
| POST | `/api/webhooks/kiwify` | Webhook `compra_aprovada` → credita saldo |

### `[v2+]` Rotas futuras
Courses CRUD, generate-all (séries), preview, expand-script, retry-from-step, account export/delete (LGPD), API pública Pro, Inngest serve, cron de COGS.

### Geração `[v1]`

```
1. Valida (usuário tem crédito > 0) → debita 1 crédito
2. generate-storyboard (Claude) → storyboard.json [retry na validação Zod]
3. resolve-assets (Pexels + fal.ai FLUX 2)
4. resolve-audio (Gemini TTS voz escolhida + ffmpeg)
5. render (Remotion Lambda) → MP4
6. Upload R2, signed URL, status='ready'

Em falha permanente: status='error', estorna o crédito debitado.
```

---

## 17. External integrations

### `[v1]` Integrações do MVP

| Service | Purpose | Env vars |
|---|---|---|
| Supabase | Auth, DB | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Google Gemini | TTS narração (4 vozes) | `GEMINI_API_KEY` |
| fal.ai | FLUX 2 [pro] pras cenas AI | `FAL_KEY` |
| Pexels | Stock cinematográfico | `PEXELS_API_KEY` |
| Claude API | Storyboard generator | `ANTHROPIC_API_KEY` |
| Remotion Lambda | Render | `REMOTION_AWS_*`, `REMOTION_REGION` |
| Cloudflare R2 | Storage do vídeo | `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`, `R2_ACCOUNT_ID` |
| Kiwify | Pagamento (Pix) + webhook | `KIWIFY_WEBHOOK_SECRET` |
| Resend | Email transacional | `RESEND_API_KEY` |
| Vercel | Hosting | — |

### `[v2+]` Integrações futuras
OpenAI (TTS fallback + Moderation), Lemon Squeezy/Mercado Pago, Inngest, PostHog, FingerprintJS, ElevenLabs, Whisper hospedado (se sair do local).

---

## 18. Tech stack

```
Frontend:     Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
Backend:      Next.js API Routes (Vercel)
Auth & DB:    Supabase (Auth + Postgres)
Storyboard:   Claude Sonnet (via Claude API)
Narração:     Gemini TTS (4 vozes curadas, voz Charon validada)
AI Visuals:   fal.ai FLUX 2 [pro]
Stock:        Pexels API (free tier inicial)
Vídeo render: Remotion 4.0.464 + @remotion/lambda (produção); render local no spike
Storage:      Cloudflare R2 + signed URLs
Pagamento:    Kiwify (Pix, webhook compra_aprovada)
Email:        Resend
Deploy:       Vercel

[v2+]: Inngest (fila), PostHog (analytics), OpenAI (moderação + TTS fallback),
       Whisper hospedado, Mercado Pago (checkout integrado), 4K render.
```

> Stack do spike (gerador, já construído): Remotion 4.0.464, TypeScript, Gemini TTS (Charon), Claude Sonnet (storyboard), fal.ai FLUX 2 [pro], Pexels. Monorepo, render local validado end-to-end.

---

# PARTE IV — OPERAÇÃO

## 19. Build sequence

> `[v1]` O MVP é muito menor que o build de 15-18 semanas do SPEC antigo, porque cortou assinatura, cursos, séries, Pro, música, Inngest, free tier e todo o anti-abuso. O gerador (spike) já está construído e validado.

### Spike — gerador de vídeo `[CONCLUÍDO]`

- [x] Faxina do projeto (legado arquivado)
- [x] 6 templates Remotion construídos e validados
- [x] `TypeImpactScene` aprovado como referência da gramática
- [x] Storyboard generator (Claude) com validação Zod + retry
- [x] Pipeline end-to-end: storyboard → assets (Pexels + FLUX 2) → áudio (Gemini TTS) → render
- [x] Primeiro vídeo real renderizado e aprovado
- [x] workDir isolado por job (TIJOLO 1)
- [x] Fix de texto cortado (auto-shrink)
- [x] Fix de narrationText vazio (Zod .min(1) + prompt da AICloser)
- [x] Código versionado + backup no GitHub

### `[v1]` SaaS — bricks restantes pro MVP

- [ ] Supabase: auth (conta primeiro) + schema (profiles.credits_balance, brand_kits, videos, credit_transactions)
- [ ] Kiwify: webhook `compra_aprovada` → credita saldo (idempotente por order_id)
- [ ] 4 vozes curadas: testar candidatas Gemini em PT-BR, escolher 2M+2F, parametrizar TTS (voz desce do brand kit / request)
- [ ] Render local → Remotion Lambda
- [ ] Página fina: cadastro → comprar créditos → brand kit → colar roteiro + escolher voz → gerar → baixar
- [ ] R2 + signed URLs + re-download
- [ ] Estorno de crédito em falha permanente
- [ ] Deploy Vercel

### `[v2+]` Fases futuras
Cursos/séries, plano Pro (priority/4K/API), música + ducking, preview 30s, expansão de tópico, moderação, Inngest, LGPD endpoints, analytics. Detalhe no Apêndice A.

---

## 20. Demo-first constraint

> `[v1]` Vale igual: NÃO deploy de landing/aquisição até validar com vídeos reais.

1. **Render 3 vídeos demo reais** com roteiros de verdade (não Lorem ipsum). Cada de template/tema diferente.
2. **Enviar pra 5 pessoas da audiência pt-BR via DM.**
3. **Pergunta única:** "Se isto fosse uma ferramenta paga, você consideraria comprar créditos?"
4. **Threshold: 3 de 5 positivos** → segue pro go-to-market.
5. **Se <3 positivos:** parar, identificar o que falta (roteiro? visual? voz? motion?), iterar, repetir.

Não é discovery consultivo — é reação binária de produto.

---

## 21. Go-to-market (primeiros 90 dias pós-launch)

| Canal | Tática | Goal |
|---|---|---|
| Canal YouTube pt-BR (seed) | Vídeo mostrando Aulacraft gerando aula real. CTA pra landing. | Primeiros signups |
| Build in public | Post semanal (X/Shorts) mostrando progresso | Audiência pré-launch + accountability |
| Reddit/comunidades BR | r/empreendedorismo, grupos de infoproduto — responder, não spammar | SEO + brand awareness |

> `[v2+]` Product Hunt (EN), watermark passive acquisition (precisa de free tier), paid ads.

No cold outreach, no sales calls no MVP. Paid só depois de validar conversão orgânica.

---

## 22. Resolved decisions

| Decisão | Resolução | Fase |
|---|---|---|
| Gateway de pagamento | **Kiwify** (Pix, webhook compra_aprovada) | v1 |
| Modelo de cobrança | **Créditos pré-pagos BRL** (R$47/3, R$127/10, R$297/30) | v1 |
| Unidade de crédito | 1 crédito = 1 vídeo, **vitalício** | v1 |
| Free tier | **Não** no MVP (mata o anti-abuso inteiro) | v1 |
| Marca d'água | **Não** (todo mundo paga) | v1 |
| Conta vs compra | **Conta primeiro**, compra depois (webhook casa por email) | v1 |
| Mercado | **Brasil apenas** | v1 |
| Produto | **Vídeos avulsos** (sem curso/módulo/série) | v1 |
| Voz | **4 vozes curadas (2M+2F)**, validadas em PT-BR; default no brand kit + override por vídeo | v1 |
| Templates | **6 construídos** (StockSplit + AITransition = v2+) | v1 |
| Storyboard generator | **Claude Sonnet**, roteiro→storyboard, regra 70/20/10, Zod .min(1) + retry — fundação | v1 |
| Whisper | **Fica** (fundação do pipeline) | v1 |
| Modelo fal.ai | **FLUX 2 [pro]** pra tudo | v1 |
| Storage | Cloudflare R2 | v1 |
| Render | Remotion Lambda (produção); local validado no spike | v1 |
| Estética | MasterClass 60% + X-Pilot 30% + cortes BR 10%. NÃO Linear/Framer | v1 |
| Tokens | system + brand, fontes fixas (Bebas/Inter/Fraunces/Space Mono) | v1 |
| Assinatura mensal (MRR) | Adiada | v2+ |
| Cursos / séries | Adiados | v2+ |
| Plano Pro (priority/4K/API) | Adiado | v2+ |
| Música + ducking | Adiada | v2+ |
| Preview 30s | Adiado | v2+ |
| Expansão tópico→roteiro | Adiada | v2+ |
| Moderação de conteúdo | Cortada do MVP (risco conhecido, decisão consciente) | v2+ |
| LGPD export/delete | Adiada (implementar quando houver base) | v2+ |
| Mercado Pago (checkout integrado) | Adiado (reclamar margem ao escalar) | v2+ |

---

## 23. Sustainability & kill criteria (founder-level)

Padrão passado: tentativas anteriores de negócio sem sucesso sustentado. Cuidado com o "month-6 cliff".

### Pré-launch
- **Milestone público** — anunciar no canal pt-BR antes de começar o build do SaaS.
- **Build in public** — 1 post/semana mostrando progresso.
- **Check-in semanal** — 15min: horas, blockers, scope creep, motivação (1-10). Motivação <5 por 3 semanas → reavaliar escopo, não abandonar.

### Pós-launch kill criteria (decididos AGORA, em cold blood)
- **<10 clientes pagantes no dia 90** → pivot ou kill.
- **Receita irrelevante no dia 180** → kill cleanly, documentar lições, seguir.
- **Tração clara no dia 180** → continuar, dobrar no canal de aquisição top.

Thresholds existem pra prevenir zombie projects consumindo anos. Decisão feita antes do investimento emocional enviesar o julgamento.

---

## 24. Anti-patterns de execução

### De produto
- Construir templates antes de ter brief de produto
- Usar roteiro de teste de tópico errado
- Confiar em imagem IA pra realismo (pessoa, objeto físico)
- Stock genérico literal (queremos curadoria conceitual)
- Decoração visual sem propósito
- Per-scene accent color mudando
- Inventar design ao invés de seguir referência concreta
- **Mudar escopo sem registrar** — toda mudança de escopo vem pra este SPEC primeiro

### De execução com Claude Code
- Specs exatas, código literal, zero "invente"
- Investigar antes de refatorar ("me mostre o que tem antes de mexer")
- Validar com `npx.cmd tsc --noEmit --jsx react` após mudança
- Refatorar 1 arquivo por vez, com evidência (diff/tsc/git) entre cada
- Nunca aceitar "feito" sem evidência empírica real (terminal, diff, git)
- Falar pt-BR, direto, sem emoji
- Não propor variações não pedidas, não "refatorar de quebra", não adicionar features extras

### De documentação
- Um único documento vivo (este SPEC). Mudança de produto vem aqui primeiro.
- Cada feature carrega selo de fase (v1/v2+). Nada de feature órfã sem fase.

---

# APÊNDICE A — Visão v2+

> Estas features fazem parte da visão completa do Aulacraft, mas estão **fora do MVP**. Ficam aqui pra que o documento seja o mapa inteiro do produto — não pra serem construídas sem decisão explícita. A ordem não é cronológica; é agrupada por tema.

## A1. Monetização avançada
- **Assinatura mensal (MRR)** — planos recorrentes além dos pacotes de crédito.
- **Mercado Pago / checkout integrado** — sair do checkout hospedado Kiwify pra reclamar margem (taxa menor) ao escalar.
- **Free tier** — 1 vídeo grátis com marca d'água pra trial. Reabre todo o aparato anti-abuso abaixo.

## A2. Anti-abuso (só faz sentido com free tier)
- Bloqueio de email descartável, rate limit por IP, device fingerprinting, kill switches de free signup. Tudo isso protegia o tier grátis de custo descontrolado — sem free tier, é desnecessário.

## A3. Produto: curso e série
- **Cursos / módulos** — agrupar vídeos numa estrutura ordenada.
- **Séries (geração em lote)** — colar outline de N aulas → fila gera todas com consistência de brand/voz (throttled).
- **Brand consistency across series** — mesmo brand kit + voz + música em toda a série.

## A4. Plano Pro
- Fila prioritária (priority queue), render 4K, API pública (endpoint REST + API key por usuário).

## A5. Áudio e legendas
- **Música de fundo** — biblioteca curada + auto-ducking -25dB sob narração. Licenciamento documentado.
- **Legendas dinâmicas** (palavra-a-palavra sincronizada com a fala) — é o uso clássico do Whisper além da sincronia de cena.
- **Voice cloning** — clonar a voz do próprio infoprodutor (deepfake liability, tratar com cuidado).
- **Mais vozes** — abrir o catálogo Gemini além das 4 curadas, ou upgrade ElevenLabs.

## A6. Pipeline e geração
- **Expansão de tópico→roteiro** — cliente cola só um tópico/outline e o Claude escreve o roteiro do zero (com review opcional). Diferente do storyboard generator, que é v1.
- **Preview de 30s** — renderizar a primeira seção antes do full, pra evitar loops de regeneração.
- **Inngest** — fila multi-step com retry por passo, concorrência por usuário e prioridade.
- **Retry-from-step elaborado** — reusar assets de passos que já rodaram.

## A7. Conformidade e operação
- **Moderação de conteúdo** (OpenAI Moderation API no roteiro antes de gerar). **Risco conhecido e adiado por decisão consciente:** sem moderação, um roteiro problemático é gerado com a infra/contas do Aulacraft (fal.ai, Gemini). No MVP, o público (infoprodutor sério) torna o risco baixo, mas ele existe e está registrado.
- **LGPD (export + delete de dados)** — direito de exportar e apagar dados. Implementar quando houver base de usuários. (No MVP, com pouquíssimos usuários, atender um pedido na mão é viável.)
- **Monitoramento de COGS** — cron diário agregando custo + alertas. No MVP os alertas nativos do fal.ai/GCP cobrem.
- **Analytics de produto** (PostHog, funil de eventos).

## A8. Templates futuros
- `StockSplitScene`, `AITransitionScene` (nunca construídos), `practice_exercise`, `cinematic_lesson` (Pro).

## A9. Mercado
- **Expansão US/EU** — exige localização de brand/naming ("Aula" é opaco fora do BR), billing em USD, GDPR (lei europeia), vozes em EN. Todo o MVP é BR-only por design.

---

*Fim do documento. Este SPEC v4 é a fonte única da verdade. Qualquer mudança de produto vem aqui primeiro, com selo de fase.*
