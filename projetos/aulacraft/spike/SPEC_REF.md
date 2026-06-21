# AulaCraft — MVP Specification

> **Status:** Reviewed + Opus deep audit applied 2026-05-21. Lock before coding. Update with decisions, not cleanup.

---

## 1. Product

### Vision
Course creators paste a script or outline → AulaCraft outputs a polished lesson video (MP4) with AI narration, visual track, motion graphics overlays, and background music — ready to upload to any course platform.

### Target customer (v1)
Educational content creators who:
- Produce lesson content (courses, corporate training, YouTube educational, internal training)
- Lack time/budget for screen recording + editing workflow
- Care about consistent, professional-looking lesson video quality
- Primary seed market: course creators on Hotmart, Teachable, Kajabi, Thinkific, Kiwify, Cademí

**NOT targeting:** agencies (multi-client), enterprise teams (multi-seat), YouTube AdSense faceless operators.

**Marketing caution:** copy and paid ads speak to course creators specifically. The tool is broader, but the message is focused.

**Name note:** "Aula" is pt-BR — resonates in seed market but is opaque for US/EU users. Evaluate brand localization before US-focused Product Hunt launch.

### Positioning
> "NotebookLM is for understanding what you read. AulaCraft is for producing what you teach."

### Visual style
Clean & Professional with intentional motion — generous whitespace, strong typography (Inter or Geist), brand kit accent colors, animations that feel precise. Reference: Framer, Linear, Notion product videos. No bouncy transitions. Output should look like a designer made it.

### v1 Moats (must-have in MVP, non-negotiable)
1. **Brand kit** — logo + palette + intro/outro clips applied consistently to every lesson
2. **Course-specific templates** — 3 templates in v1: `module_intro`, `chapter_break`, `lesson_summary`
3. **Brand consistency across series** — all lessons in a course share the same brand kit + voice + music
4. **Series generation** — paste a 10-lesson outline → queue generates all with consistency (throttled)
5. **Background music** — royalty-free music library with auto-ducking under narration

### v1.1 Roadmap (explicit, NOT in MVP)
- `practice_exercise` template
- `cinematic_lesson` template (Pro exclusive)
- Voice cloning

### Music library evolution (post-MVP)
- **v1 (MVP):** 15 curated tracks from YouTube Audio Library + FMA CC0 — free, safe for SaaS sub-licensing
- **v1.5 (~MRR $1k):** Commission 20-30 custom tracks from composers on Soundbetter (~$5-8k one-time, work-for-hire = full ownership + sub-license rights)
- **v2 (~MRR $5k):** Evaluate Mubert API for Pro tier — AI-generated unique music per video, sub-licensable, ~$0.10-0.30/min (absorbable in Pro margin)

---

## 2. Core User Journey

```
Sign up (Google OAuth) → Activate plan → Create course → Upload brand kit →
Add lesson (topic / outline / script) → [Claude generates script] → [optional review] →
30s preview → [approve] → Generate full → Poll status → Download MP4 → Upload to platform
```

### Key rules
- **Script review is optional** — user can skip straight to preview/generate
- **Two entry modes, one flow:**
  - Has script: paste → skip AI generation → preview → generate
  - Has topic/outline: paste → Claude expands → optional review → preview → generate
- **30s preview is mandatory before full render** — renders first section only (~$0.05 COGS). Prevents regeneration loops.
- Both paths converge at the same Generate step

---

## 3. Feature Scope

### IN v1

| Feature | Notes |
|---|---|
| Auth (Google OAuth) | Supabase Auth. Required for free tier. |
| Email/password auth | Paid plans only |
| Disposable email blocking | `disposable-email-domains` npm. Day 1. |
| IP rate limit on generation | Max 2 videos/IP/month on free tier. Next.js middleware. |
| Device fingerprinting | FingerprintJS. Post-launch if abuse detected. |
| `FREE_TIER_ENABLED` kill switch | Env var to disable free signups in <5min if needed. |
| `GENERATION_ENABLED` kill switch | Separate env var to stop ALL generation if cost runaway detected. |
| Daily COGS monitoring + alerts | Vercel Cron sums daily costs from `generation_jobs`. Email alert if >$X/day threshold. |
| External billing alerts | Configured on fal.ai dashboard + Google Cloud Console (Gemini) + AWS (Lambda). |
| Content moderation | OpenAI Moderation API on script before generation. Blocks NSFW/harmful content. |
| GDPR data export | `/api/account/export` returns ZIP (profile + brand kits + lessons + video URLs). |
| GDPR data deletion | `/api/account/delete` — right to erasure, async cleanup of R2 assets. |
| Brand kit (logo, palette, intro/outro clips, music track) | R2 storage. Schema derived from template props. |
| Background music library | 15 curated tracks from YouTube Audio Library (commercial-safe, no attribution required) + FMA CC0 tracks. Hosted in R2. User picks 1 per brand kit. Auto-ducking under narration (-25dB). License source documented per track in `MUSIC_LICENSES.md`. |
| 3 course templates | `module_intro`, `chapter_break`, `lesson_summary` |
| Script input (paste raw text) | Plain textarea |
| Claude-powered script expansion | Topic/outline → narration script. Optional step. |
| 30s preview render | First section only, draft quality. Approve before full render. |
| Gemini 3.1 Flash TTS narration | 30 voices, pick per course or per lesson |
| fal.ai AI hero shots | flux-schnell (Free/Starter), flux-pro (Creator/Pro) |
| Remotion Lambda rendering | Compose audio + visuals + motion graphics + music → MP4 |
| Cloudflare R2 storage | Signed URLs, 30-day expiry, on-access refresh, auto-delete lifecycle |
| Re-download from dashboard | Always available. Generates fresh signed URL. |
| Video duration cap | Free: 3min / Starter: 8min / Creator: 15min / Pro: 25min |
| Course model (ordered list of lessons) | Up to 30 lessons per course |
| Series batch generation | Throttled: max 3 lessons processing simultaneously per user (Inngest concurrency limit) |
| **Pro: Priority queue** | Pro renders processed first via Inngest priority. Creator/below in standard queue. |
| **Pro: 4K rendering option** | Pro can opt for 4K render (1080p default). +1 video credit per 4K render. |
| **Pro: API access** | Public REST endpoint for Pro to trigger generation externally. API key per user. |
| Job retry with asset reuse | Failed jobs can retry from failure step, reusing already-generated assets (script, narration, images). |
| Auto-refund on permanent failure | If retries exhausted: video credit refunded, orphan assets cleaned up. |
| Lemon Squeezy billing (self-serve) | Free + 3 paid plans, Founder pricing, MoR handles tax |
| AulaCraft watermark on free videos | Bottom-right corner, 60% opacity, AulaCraft logo + "aulacraft.com" text. Locked position. |
| Download MP4 | From signed R2 URL |
| Inngest job queue | Multi-step async pipeline with per-step retry + concurrency limit + priority |
| Usage limits per plan | Enforced server-side via Supabase |
| Product analytics | PostHog free tier. 5 key events: signup → brand_kit_created → first_preview → first_video_ready → upgrade |
| Upgrade prompt on limit hit | When cap reached: generate button shows "Upgrade or wait until [date]". |
| Cancel / refund policy | Cancel anytime in dashboard. Prorated refund within first 7 days. |
| Hotmart integration | **v1 conditional** — validate API in **Week 1**. If supported: ships in Phase 5. Pro plan only. If not: v1.5. |

### OUT v1 (explicit deferral)

| Feature | Reason |
|---|---|
| `practice_exercise` template | v1.1 — cut to reduce Phase 3 scope |
| `cinematic_lesson` template | v1.1 — most complex template, Pro exclusive |
| Voice cloning | Deepfake liability + scope. v1.2 Pro upgrade. |
| Teachable / Kajabi / Kiwify integrations | v1.5 after Hotmart ships |
| Team / multi-seat | v2 |
| Custom music upload | v2 (use library only in v1) |
| Analytics dashboard (per-lesson stats) | v3 |
| Custom domain / white-label | v3 |
| ElevenLabs upgrade | After $5k MRR |
| pt-BR UI localization | v2 |
| Subtitles / closed captions | v2 |
| Custom Remotion templates (user-uploaded) | v3 |
| SMS OTP verification | Too much friction for $0 tier |
| Credit card required for free | Kills PLG conversion |

---

## 4. Plans & Pricing

### Founder pricing (first 100 paying customers, 24 months)

| Plan | Launch | Regular | Videos/mo | Max duration | Templates | Brand kits | Series | Hotmart | Priority | 4K | API |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Free | $0 | $0 | 2 (watermarked) | 3min | 1 | — | No | No | No | No | No |
| Starter | $19/mo | $39/mo | 20 | 8min | 2 | 1 | No | No | No | No | No |
| Creator | $49/mo | $79/mo | 40 | 15min | 3 | 3 | Yes (≤15) | No | No | No | No |
| Pro | $99/mo | $149/mo | 100 | 25min | 3 + v1.1 cinematic | Unlimited | Yes (≤30) | Yes | **Yes** | **Yes** | **Yes** |

- Founder badge displayed in dashboard for first 100 paying customers
- Founder pricing locked for **24 months** (not lifetime)
- Hard usage limit — no surprise overages
- 4K render costs 1 extra video credit (so 100 videos in 4K = 50 actual renders)
- Free tier: Google OAuth only

### Unit economics (Pro at regular price $149, conservative: 80 videos avg, mix 1080p/4K)
- Gemini TTS: ~$0.03/min × 12 min × 80 = $28.80
- fal.ai (flux-pro): ~$0.05/image × 6 × 80 = $24
- Remotion Lambda: ~$0.04/video (mix of cold/warm, 1080p/4K) × 80 = $3.20
- R2 storage: ~$0.20
- Music API (Pixabay): free
- PostHog + Inngest free tiers
- **Total COGS: ~$56 → margin ~62%** at $149

### Margin check (Founder Creator, worst case: all 40 videos at 15min)
- COGS: ~$0.75/video × 40 = $30 → margin on $49 = **38%**. Acceptable as CAC.

---

## 5. Data Model (Supabase)

### `profiles` (extends `auth.users`)
```sql
id                        uuid PK references auth.users(id)
plan                      text  -- 'free' | 'starter' | 'creator' | 'pro'
is_founder                boolean default false
videos_used               int   default 0
videos_cap                int   default 2
billing_anchor            timestamptz
billing_timezone          text default 'UTC'
lemon_squeezy_customer_id text
api_key_hash              text  -- Pro only, bcrypt
created_at                timestamptz default now()
```

### `brand_kits`
```sql
id                uuid PK
user_id           uuid FK profiles.id
name              text
logo_url          text
primary_color     text
secondary_color   text
font_family       text
intro_clip_url    text
outro_clip_url    text
music_track_id    text  -- references curated library
default_voice_id  text
created_at        timestamptz
```

### `courses`
```sql
id            uuid PK
user_id       uuid FK profiles.id
brand_kit_id  uuid FK brand_kits.id
name          text
platform      text  -- 'hotmart' | 'teachable' | 'kajabi' | 'thinkific' | 'kiwify' | 'cademi' | 'other'
created_at    timestamptz
```

### `lessons`
```sql
id                    uuid PK
course_id             uuid FK courses.id
user_id               uuid FK profiles.id
title                 text
script                text
template_type         text  -- 'module_intro' | 'chapter_break' | 'lesson_summary'
voice_id              text
order_index           int
resolution            text default '1080p'  -- '1080p' | '4k' (Pro only)
status                text  -- 'draft' | 'previewing' | 'preview_ready' | 'queued' | 'narration' | 'visuals' | 'rendering' | 'uploading' | 'ready' | 'error' | 'refunded'
error_message         text
preview_url           text
r2_key                text
signed_url            text
signed_url_expires_at timestamptz
duration_seconds      int
has_watermark         boolean default false
created_at            timestamptz
updated_at            timestamptz
```

### `generation_jobs`
```sql
id                  uuid PK
lesson_id           uuid FK lessons.id
job_type            text  -- 'preview' | 'full'
priority            int default 0  -- higher = processed first (Pro = 10, others = 0)
inngest_event_id    text
started_at          timestamptz
finished_at         timestamptz
steps               jsonb  -- [{step, status, started_at, finished_at, error, asset_url}]
failed_at_step      text  -- 'script' | 'tts' | 'visuals' | 'render' | 'upload' | null
retry_count         int default 0
cogs_usd            numeric(10, 4)  -- accumulated cost for monitoring
remotion_render_id  text
```

### `cost_alerts` (daily aggregate for monitoring)
```sql
date              date PK
total_cogs_usd    numeric(10, 4)
total_jobs        int
alert_sent        boolean default false
```

---

## 6. API Routes (Next.js App Router)

| Method | Route | Description |
|---|---|---|
| POST | `/api/brand-kits` | Create brand kit |
| GET | `/api/brand-kits` | List user's brand kits |
| PATCH | `/api/brand-kits/:id` | Update brand kit |
| DELETE | `/api/brand-kits/:id` | Delete brand kit |
| POST | `/api/brand-kits/:id/upload` | Upload logo/intro/outro → R2 |
| GET | `/api/music-tracks` | List curated music library |
| POST | `/api/courses` | Create course |
| GET | `/api/courses` | List courses |
| GET | `/api/courses/:id` | Get course + lessons |
| POST | `/api/courses/:id/generate-all` | Enqueue all lessons (throttled) |
| POST | `/api/lessons` | Create lesson |
| GET | `/api/lessons/:id` | Get lesson + status |
| POST | `/api/lessons/:id/preview` | Enqueue 30s preview render |
| POST | `/api/lessons/:id/generate` | Enqueue full render (requires preview approved) |
| POST | `/api/lessons/:id/retry` | Retry from failed step, reusing prior assets |
| GET | `/api/lessons/:id/status` | Poll generation status |
| POST | `/api/lessons/:id/expand-script` | Claude: topic/outline → narration script |
| POST | `/api/lessons/:id/redownload` | Generate fresh signed URL |
| POST | `/api/account/export` | GDPR data export (returns ZIP) |
| DELETE | `/api/account/delete` | GDPR right to erasure |
| GET | `/api/account/api-key` | Pro: get/rotate API key |
| POST | `/api/v1/lessons/generate` | **Public API** — Pro only, requires API key header |
| POST | `/api/webhooks/lemon-squeezy` | Payment + subscription events |
| POST | `/api/inngest` | Inngest serve endpoint |
| GET | `/api/cron/daily-cogs` | Vercel Cron — aggregate daily cost + alert |

### Generation pipeline — preview (Inngest, fast path)
```
Step 1: Validate + moderation (OpenAI Moderation API on script)
Step 2: Gemini TTS — first section only → MP3
Step 3: fal.ai flux-schnell — 1 image for first section
Step 4: Remotion Lambda — render first 30s (with music duck) → MP4 preview
Step 5: Upload preview to R2, update lesson.preview_url
```

### Generation pipeline — full render (Inngest, multi-step, with retry resilience)
```
Step 1: Validate (user under cap, GENERATION_ENABLED=true, increment videos_used)
Step 2: Claude API — section titles + visual prompts per section [retry 3x]
Step 3: Gemini TTS — full script → MP3 → R2 [retry 3x, fallback OpenAI tts-1]
Step 4: fal.ai — hero images per section [retry 3x per image]
Step 5: Remotion Lambda — full render with music ducking → MP4 [retry 2x]
Step 6: Upload MP4 to R2, generate signed URL (30-day)
Step 7: Update lesson (status='ready'), record cogs_usd in generation_jobs

On permanent failure (all retries exhausted):
  - lesson.status = 'refunded'
  - profile.videos_used -= 1
  - Cleanup orphan R2 assets (preview, intermediate audio/images)
  - Email user with retry CTA
```

Inngest config:
- `concurrency: { limit: 3, key: "event.data.userId" }` per-user throttle
- `priority: { run: "event.data.priority" }` Pro queue jumping

---

## 7. External Integrations

| Service | Purpose | SDK | Env vars |
|---|---|---|---|
| Supabase | Auth, DB, Realtime | `@supabase/supabase-js` | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Google Gemini | TTS narration | `@google/generative-ai` | `GEMINI_API_KEY` |
| OpenAI | TTS fallback + Moderation API | `openai` | `OPENAI_API_KEY` |
| fal.ai | AI hero shots | `@fal-ai/client` | `FAL_KEY` |
| Music library (R2-hosted) | 15 pre-curated tracks (YouTube Audio Library + FMA CC0) | — | — (static files in R2) |
| Remotion Lambda | Video rendering (1080p + 4K) | `@remotion/lambda` | `REMOTION_AWS_ACCESS_KEY_ID`, `REMOTION_AWS_SECRET_ACCESS_KEY`, `REMOTION_REGION` |
| Cloudflare R2 | Video storage | `@aws-sdk/client-s3` | `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`, `R2_ACCOUNT_ID` |
| Lemon Squeezy | Billing + MoR | REST API + webhooks | `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_WEBHOOK_SECRET` |
| Claude API | Script expansion | `@anthropic-ai/sdk` | `ANTHROPIC_API_KEY` |
| Inngest | Job queue + retries + concurrency + priority | `inngest` | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` |
| PostHog | Product analytics | `posthog-js` | `NEXT_PUBLIC_POSTHOG_KEY` |
| Resend (or similar) | Transactional email (alerts, refund notices) | `resend` | `RESEND_API_KEY` |
| FingerprintJS | Device fingerprinting (post-launch) | `@fingerprintjs/fingerprintjs` | — (client-side) |
| Vercel | Hosting + Cron | — | Auto via `vercel` CLI |

### Cost monitoring config
- Vercel Cron daily at 00:00 UTC: aggregate `generation_jobs.cogs_usd` for previous day
- If daily total > `$COST_ALERT_THRESHOLD_USD` (env var, start at $20/day): send email to founder
- External alerts: fal.ai dashboard alert at $50/week, Google Cloud budget alert at $100/month, AWS budget alert at $30/month
- Founder kill switch flow: `GENERATION_ENABLED=false` deploy → all `/api/lessons/:id/generate` and `/api/lessons/:id/preview` return 503

### TTS abstraction layer
Wrap TTS behind a `TTSProvider` interface. Gemini primary, OpenAI tts-1 fallback. Both tested in Phase 4 — fallback must be validated, not just documented.

```ts
interface TTSProvider {
  synthesize(text: string, voiceId: string): Promise<Buffer>
}
```

---

## 8. Remotion Templates

All templates: 1920×1080 (or 3840×2160 for Pro 4K), 30fps, H.264. No CSS animations — all motion via `useCurrentFrame()` + `interpolate()`. Music ducking: narration channel mixed at 0dB, music ducked to -25dB when narration is active (offsetClock detection).

### Template access by plan

| Template | Free | Starter | Creator | Pro |
|---|---|---|---|---|
| `module_intro` | ✓ | ✓ | ✓ | ✓ |
| `chapter_break` | — | ✓ | ✓ | ✓ |
| `lesson_summary` | — | — | ✓ | ✓ |
| `practice_exercise` | — | — | — | v1.1 |
| `cinematic_lesson` | — | — | — | v1.1 |

### Shared props
```ts
type SharedProps = {
  script: string
  sections: { title: string; text: string; imageUrl: string }[]
  audioUrl: string          // narration MP3
  musicUrl?: string         // background music track (from brand kit)
  hasWatermark: boolean
  isPreview: boolean
  resolution: '1080p' | '4k'
  brandKit: {
    logoUrl: string
    primaryColor: string
    secondaryColor: string
    fontFamily: string
    introClipUrl?: string
    outroClipUrl?: string
  }
  durationInFrames: number
}
```

### Templates must support
- Latin extended + pt-BR characters + basic emoji (pt-BR test in Phase 2)
- Watermark overlay when `hasWatermark: true` (fixed position, locked styling)
- Audio mixing: narration + music with auto-ducking

---

## 9. Build Sequence

Total estimate: **15-18 weeks at 10-15h/week**.

### Phase 1 — Foundation (weeks 1-3, ~40h)
- [ ] Next.js 14 App Router scaffold (TypeScript, Tailwind, shadcn/ui)
- [ ] Supabase + Google OAuth (free tier) + email/password (paid only)
- [ ] Disposable email blocking middleware
- [ ] `FREE_TIER_ENABLED` + `GENERATION_ENABLED` kill switches
- [ ] DB schema migration (all tables incl. `cost_alerts`)
- [ ] Lemon Squeezy: Free + 3 plans + Founder pricing (24mo) + webhook + enforcement
- [ ] `is_founder` flag (first 100 paying customers)
- [ ] Dashboard shell (plan badge, Founder badge, usage meter, duration cap display)
- [ ] PostHog integration + 5 key events instrumented
- [ ] R2 bucket setup + upload utility
- [ ] Resend setup (transactional email)
- [ ] GDPR endpoints: `/api/account/export` + `/api/account/delete`
- [ ] TERMS + PRIVACY pages (AI content disclaimer, moderation clause, GDPR rights)
- [ ] **Hotmart API investigation (1h)** — validate content management endpoints. Decision: Phase 5 or v1.5.

### Phase 2 — Remotion Templates + Music (weeks 4-6, ~38h)
- [ ] Remotion project setup (separate package)
- [ ] **Music curation (4-6h manual):** download 15 tracks from YouTube Audio Library + FMA CC0
- [ ] Upload tracks to R2 + create `music_tracks` table in Supabase (id, name, mood, duration, r2_url, license_source)
- [ ] Create `MUSIC_LICENSES.md` documenting source + license + download date for each track (save license screenshots in `docs/music-licenses/`)
- [ ] Audio mixing utility (narration + music + ducking at -25dB)
- [ ] `module_intro` template
- [ ] `chapter_break` template
- [ ] `lesson_summary` template
- [ ] Watermark overlay component (locked styling: bottom-right, 60% opacity, logo + url)
- [ ] Preview mode (`isPreview: true` renders first section only)
- [ ] 4K render config (Pro only, conditional on `resolution` prop)
- [ ] Latin extended + pt-BR character test
- [ ] Lambda deployment + test renders with hardcoded props
- [ ] Props contract locked (SharedProps finalized)

### Phase 3 — Brand Kit (weeks 7-8, ~18h)
- [ ] Brand kit form (logo upload, color pickers, font picker, music selector)
- [ ] Intro/outro clip upload → R2
- [ ] Brand kit preview using actual Remotion props
- [ ] Brand kit selector on course create

### Phase 4 — Generation Pipeline (weeks 9-13, ~55h)
- [ ] Inngest setup + `/api/inngest` serve endpoint + concurrency + priority config
- [ ] OpenAI Moderation API on script (Step 1 of both pipelines)
- [ ] TTSProvider interface + Gemini primary + OpenAI fallback (both tested live)
- [ ] Gemini TTS: script → MP3 → R2
- [ ] Claude API: script → sections + visual prompts
- [ ] fal.ai: visual prompts → hero images (flux-schnell/flux-pro by plan)
- [ ] **Preview pipeline** (fast path, 30s, draft quality)
- [ ] **Full render pipeline** with retry-from-step + asset reuse
- [ ] Permanent failure handler: refund credit + cleanup orphan assets
- [ ] IP rate limit middleware
- [ ] Supabase Realtime status updates
- [ ] Re-download endpoint
- [ ] `/api/lessons/:id/retry` endpoint
- [ ] `generation_jobs.cogs_usd` tracking per step
- [ ] **Daily COGS cron** + alert email via Resend
- [ ] External billing alerts configured (fal.ai, GCP, AWS)
- [ ] **Render 2-3 demo videos** — apply demo-first criteria (see Section 10)

### Phase 5 — Course, Series & Pro Features (weeks 14-15, ~30h)
- [ ] Course CRUD
- [ ] Lesson ordering (manual index)
- [ ] `/api/courses/:id/generate-all` batch queue with per-user concurrency
- [ ] Series UI: course view with all lesson statuses
- [ ] Voice + brand kit inheritance
- [ ] **Pro: Priority queue** (Inngest priority key based on plan)
- [ ] **Pro: 4K rendering toggle in lesson form**
- [ ] **Pro: API key generation + `/api/v1/lessons/generate` public endpoint** (rate limited)
- [ ] **Hotmart integration** (if API validated in Phase 1 — OAuth + course structure pull + publish flow)

### Phase 6 — Beta & Launch (weeks 16-18, ~30h)
- [ ] Script expansion flow (optional review step)
- [ ] Onboarding wizard (brand kit + first preview in <5min)
- [ ] Deploy landing at aulacraft.com with embedded demo video (gated by demo-first criteria)
- [ ] Product Hunt prep (assets, tagline, hunter outreach, name localization decision)
- [ ] Channel video showing AulaCraft generating a real lesson

---

## 10. Demo-First Constraint (operational criteria)

Do not deploy the landing page until ALL conditions met:

1. **Render 3 real demo videos** with actual scripts (not placeholder Lorem ipsum). Each from a different template.
2. **Send to 5 people from pt-BR channel audience via direct message** (DM, not call, not interview).
3. **Single question:** "If this were a tool at $39/mo, would you consider paying for it?"
4. **Threshold: 3 out of 5 positive** → deploy landing.
5. **If <3 positive:** stop, identify what's lacking (script? visuals? music? motion?), iterate templates, repeat.

This validation does not violate the no-interviews rule — it's a binary product reaction, not consultative discovery.

---

## 11. Go-to-Market (first 90 days post-launch)

| Channel | Tactic | Goal |
|---|---|---|
| YouTube channel (pt-BR seed) | Video showing AulaCraft generating a real lesson. CTA to landing. | First 20-50 signups |
| Product Hunt | Launch day. EN copy. Demo video as hero. | Spike + credibility |
| Watermark passive acquisition | Every free video carries AulaCraft watermark + URL. | Organic long-tail |
| Reddit lurking → content | r/onlinecourses, r/Hotmart, r/learnprogramming — answer questions, no spam | SEO + brand awareness |
| Build in public | Weekly post on X/YouTube Shorts showing progress | Pre-launch audience + accountability |

No cold outreach, no sales calls, no community management. Paid ads only after validating organic conversion rate.

---

## 12. Tech Stack Summary

```
Frontend:     Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
Backend:      Next.js API Routes (serverless on Vercel)
Auth & DB:    Supabase (Auth + Postgres + Realtime)
Job queue:    Inngest (multi-step, retry, per-user concurrency, priority)
Narration:    TTSProvider → Gemini 3.1 Flash TTS (primary) / OpenAI tts-1 (fallback)
AI Visuals:   fal.ai (flux-schnell: Free/Starter | flux-pro: Creator/Pro)
Music:        15 pre-curated tracks (YouTube Audio Library + FMA CC0), hosted in R2
Video render: Remotion + @remotion/lambda (us-east-1, 1080p + 4K)
Storage:      Cloudflare R2 + on-access signed URL refresh
Script AI:    Claude API
Moderation:   OpenAI Moderation API (on every script)
Analytics:    PostHog (free tier, 5 funnel events)
Email:        Resend (transactional + cost alerts)
Billing:      Lemon Squeezy (MoR, 24mo Founder pricing)
Cost monitor: Vercel Cron daily aggregate + external billing alerts
Abuse:        disposable-email-domains + Google OAuth + IP rate limit + 2 kill switches
Deploy:       Vercel
```

---

## 13. Resolved Decisions

| Decision | Resolution |
|---|---|
| Billing provider | Lemon Squeezy (MoR) |
| Founder pricing duration | 24 months |
| Voice provider | Gemini behind TTSProvider, OpenAI fallback |
| Storage | Cloudflare R2 |
| fal.ai model | flux-schnell (Free/Starter), flux-pro (Creator/Pro) |
| Remotion Lambda region | us-east-1 |
| Job queue | Inngest (concurrency + priority) |
| Signed URL refresh | On-access + dashboard re-download |
| Hotmart API validation | Week 1 investigation |
| Free tier abuse | Disposable email + Google OAuth + IP rate limit + kill switch |
| Pricing strategy | Free (watermarked) + Founder pricing (24mo) for first 100 |
| Video duration cap | Free 3min / Starter 8min / Creator 15min / Pro 25min |
| Preview before full render | Mandatory 30s preview |
| Series throttle | Max 3 concurrent jobs per user |
| Script review | Optional |
| MVP templates | 3 templates: module_intro, chapter_break, lesson_summary |
| practice_exercise + cinematic_lesson | v1.1 |
| Voice cloning | v1.2 |
| Content moderation | OpenAI Moderation API on every script |
| Product analytics | PostHog free tier from Day 1 |
| Background music | 15 manually curated tracks from YouTube Audio Library + FMA CC0, hosted in R2 (NOT Pixabay — their license forbids SaaS distribution). Auto-ducking -25dB. License documented per track in MUSIC_LICENSES.md. Migration plan: commission custom tracks ($5-8k) when MRR > $1k. |
| Pro plan exclusive features | Priority queue + 4K + Public API (all v1) |
| Job retry strategy | Retry from failed step, reuse prior assets, auto-refund on permanent failure |
| Cost monitoring | Daily Vercel Cron + external billing alerts + GENERATION_ENABLED kill switch |
| GDPR compliance | Export + delete endpoints in Phase 1 |
| Demo-first criteria | 3 demos × 5 DMs × 3/5 threshold |
| Watermark design | Bottom-right, 60% opacity, logo + aulacraft.com |
| Music upload by user | Out of v1 (library only) |

---

## 14. Sustainability & Persistence (founder-level)

Past pattern: prior internet business attempts without sustained success. Watch for month-6 cliff.

### Pre-launch
- **Public milestone** — announce launch date on pt-BR channel before Phase 4 starts. Public commitment increases completion rate 30-40%.
- **Build in public** — 1 short post per week (X or YouTube Shorts) showing progress. Creates pre-launch audience and accountability loop.
- **Weekly check-in** — every Sunday, 15min review: hours logged, blockers, scope creep, motivation level (1-10). If motivation <5 for 3 weeks in a row → reassess scope, not abandon.

### Post-launch kill criteria (decided NOW to avoid sunk cost in 90 days)
- **<10 paying customers at day 90 post-launch** → pivot or kill. Do not continue another quarter hoping for change.
- **<$200 MRR at day 180** → kill cleanly, document lessons, move on.
- **>$500 MRR at day 180** → continue, double down on top-performing acquisition channel.

These thresholds exist to prevent zombie projects from consuming years. The decision is made now, in cold blood, before emotional investment skews judgment later.

---

## 15. Princípio de modelos externos (IA, APIs, infra)

Quando o Aulacraft depender de modelo externo (fal.ai pra imagem, Gemini pra TTS, Claude pra storyboard, futuras integrações), a regra é:

**Usar o que funciona e é recente.**

Concretamente:

1. **Modelos novos entregam resultado melhor por padrão.** Não economizar em endpoint pra ganhar centavos por aula — o custo de uma aula é tão baixo que diferença de 30% no preço do modelo é irrelevante perto da diferença de qualidade visual.

2. **Revisar modelo escolhido a cada novo template/feature.** Não assumir que o modelo que estava certo 3 meses atrás continua certo. O mercado de IA generativa muda rápido — checar o que é estado-da-arte agora, não o que era estado-da-arte quando o código foi escrito.

3. **Preferir famílias estáveis a modelos exóticos.** Se for trocar de modelo, preferir migração dentro da mesma família (FLUX 1 → FLUX 2) a trocar de provider/arquitetura. Mantém consistência estética entre assets do mesmo produto.

4. **Testar antes de trocar.** Nunca migrar modelo "no escuro" — gerar o mesmo prompt em 2-3 modelos, comparar lado a lado, e decidir com a imagem em mãos.
