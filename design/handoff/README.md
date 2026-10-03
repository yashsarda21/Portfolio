# The Arena — Yash Sarda Portfolio · Developer Handoff

> "You aren't just viewing my portfolio. You're playing against me."

A portfolio for Software Engineer **Yash Sarda**, designed as a night-time sports arena. Visitors explore a stadium hub and play 5–15 second games against Yash in cricket, tennis and badminton. Every game reveals real portfolio content, whether the visitor wins, loses or skips. Yash wins about 99% of the time, and the rare loss unlocks a hidden achievement.

A recruiter must be able to understand **who, what, where, which stack, what was built and how to contact** within **1–2 minutes**. The Quick View page is one tap away on every screen.

---

## 1. What's in this package

| Folder | Contents |
|---|---|
| `README.md` | This document: flows, screens, rules, motion and build notes |
| `tokens/tokens.css` | Colours, type, spacing and easing as CSS custom properties |
| `content/content.json` | **All real content** from the resume, structured for the build. Render from this file and don't hard-code copy. |
| `design-source/` | The source of all 23 artboards (`*.dc.html`) and their layout (`canvas.json`). These are the live design canvas files. Read them for exact pixel values, copy and keyframes. They need the canvas runtime to render, so open the shared canvas link to see them. |
| `assets/` | Portrait (original + transparent cut-out), resume PDF and the character-rig sprite strips |
| `tools/rig.py` | The script that rendered the intro's head-turn frames from the portrait. Re-run it if the photo changes (see §8). |

---

## 2. Visual direction — "Night Match"

A floodlit stadium at 9pm, shot like a TV broadcast and built like a system. It should feel premium, cinematic and dark, never arcade-like or cartoonish.

| Token | Value | Use |
|---|---|---|
| Pitch Black | `#05070A` | Page ground |
| Stand | `#0E141B` (66% + 14px blur for glass) | Panels |
| Floodlight | `#F2F4F5` | Primary text |
| Scout Grey | `#A3ADB7` | Labels, secondary |
| **Volt** | `#D7FF3F` | The **only** accent. It means either "act here" or "you earned this". |
| Live Red | `#FF4D3D` | 6–8px "live" dot only, never a fill |
| Gold | `#D4B26A` | Trophy Room only |
| Venue tints | Turf `#0E3322` · Hard court `#0C2236` · Hall `#24180E` | Used as light (radial glows), not as flat fills |

**Typography: two voices plus a narrator**

- **Big Shoulders Display** (600–900, uppercase, letter-spacing +4–14%) is the competitor: scoreboards, venue names and big numbers.
- **JetBrains Mono** (400–700, 11–13px, letter-spacing +14–24%) is the engineer: labels, stats and commentary tags.
- **Archivo** (400–700) is the narrator: body copy and forms. *Italic is used only for live commentary.*

**Signature components**

- **Score bug:** sits top centre in every game. A white name chip, dark score cells and a volt status chip.
- **Commentary lower-third:** bottom left. A volt `COMM` tag plus one italic line, held for 4s. Only one line shows at a time.
- **CTA:** a parallelogram skewed −12° with a counter-skewed label. The primary is volt with dark ink; the secondary is glass.
- **Skip chip:** a glass pill bottom right reading "SKIP TO …". Always visible during games and at least 44px tall.
- **Segmented stat bar:** 10 segments that show an evidence level, never a fake percentage.
- **Scoreboard texture:** a 4px LED dot grid plus scanlines. The character is composited *into* this texture rather than placed on top of it.

**Principles**

1. Information is never locked behind a game.
2. Broadcast, not arcade: Hawk-Eye-style tracers and tracking rings, no mascots or coins.
3. Light is the hierarchy: what matters is lit, and everything else sits in the dark stands.
4. Confident, not cocky: commentary is dry and short.
5. Two minutes to clarity.

---

## 3. Site map and flow

```
Landing (Main) ──ENTER THE ARENA──▶ Player Intro (Intro) ──▶ Arena Hub
      │                                                         │
      └──VIEW PORTFOLIO──▶ Quick View (Scouting Report) ◀── "Quick View" on every screen

Arena Hub
 ├─ Cricket Ground ─ Bowl at Me (game) ─▶ Career Stats
 ├─ Centre Court   ─ Return of Serve    ─▶ Match Highlights
 ├─ Badminton Hall ─ Smash or Clear     ─▶ Player Attributes
 ├─ Trophy Room + Training Academy
 ├─ Player Card (resume)
 └─ Team Up (contact)
Any game (~1%) ─▶ Giant Killer easter egg ─▶ Locker Room (hidden section)
```

Every venue card has both **PLAY** and **SKIP →**. The left rail on the hub is a full index linking straight to every section.

**Suggested routes:** `/` · `/intro` · `/arena` · `/arena/cricket` · `/career` · `/arena/tennis` · `/highlights` · `/arena/badminton` · `/attributes` · `/trophies` · `/card` · `/team-up` · `/locker-room` · **`/scout`** (Quick View, the link to put on the resume and in emails).

---

## 4. Screen inventory

The canvas artboard file is in brackets.

| # | Screen | Purpose and key behaviour |
|---|---|---|
| 01 | Visual direction (`Direction`) | Reference board for palette, type, the broadcast kit and the principles |
| 02 | Landing (`Main`) | Dark stadium, then the floodlight banks flicker on one by one, then the scoreboard boots with **YASH SARDA / SOFTWARE ENGINEER**, then "Think you can beat me?". Two CTAs: **ENTER THE ARENA** (interactive, about 3 min) and **VIEW PORTFOLIO** (recruiter view, 90s). Crowd-audio toggle and Skip Intro. |
| 02b | Opening storyboard (`Opening`) | Six frames with timecodes plus audio, light, camera and UI lanes. Starts with a "ticket gate" click so audio can play under browser autoplay rules. |
| 02c | **Player Introduction** (`Intro`) | About 6s. A silhouette entrance, then a rendered head turn, chin lift and nod, while the name assembles from scoreboard pixels. Full timeline in §6. |
| 03 | Arena Hub (`Hub`) | "Choose your venue": three venue cards on a slight 3D arc, a facilities row, a left index rail, a matchday progress bar (1 of 3 venues) and the hidden-achievement teaser |
| 04 | Cricket — Bowl at Me (`Cricket-Play`) | **Working prototype.** The visitor bowls and Yash bats. See §5. |
| 05 | Tennis — Return of Serve (`Tennis-Play`) | The visitor picks the open side. Each return puts a project card courtside. Up to 3 returns. |
| 06 | Badminton — Smash or Clear (`Badminton-Play`) | Hold and release a power meter (Drop, Clear, Smash). Each rally charges one skill group. |
| 07 | Career Stats (`Cricket-Career`) | A batting scorecard (Innings, Team, Role, Span, Status: NOT OUT or DEBUT). Click a row to see its ball-by-ball achievements and the "shots played" stack. |
| 08 | Match Highlights (`Tennis-Highlights`) | A tournament draw (Quarter-final, Semi-final, The Final = flagship). A replay panel, then Serve (problem), Rally (approach) and Winner (result), plus shot data, stack and a GitHub link. |
| 09 | Player Attributes (`Badminton-Attributes`) | Four skill groups, each mapped to a shot: Backend = Smash, Frontend = Drop shot, Data = Defence, Craft = Court vision. Each skill shows its **evidence level** (§7). |
| 10 | Trophy Room + Training Academy (`Trophy-Room`) | A glass cabinet holding 5 spot-lit trophies plus the locked Giant Killer, a selected-trophy detail panel and PICT education |
| 11 | Player Card (`Player-Card`) | A holographic FIFA-style card with real stats (750+, 8.94, 99.5, 200+, 10K+, 75+). Buttons: View Player Card (PDF), Download PDF, Copy scouting link. |
| 12 | Team Up (`Team-Up`) | A challenge form: choose a format (Sign a Player, Doubles, Friendly Rally), then name, email and message. Direct links to Email, LinkedIn, GitHub and coding profiles. |
| 13 | Game system (`Game-System`) | Spec board covering the game loop, game table, how the 1% is tuned, commentary lines and fair-play rules |
| 13b | Giant Killer (`Easter-Egg`) | "OKAY… YOU GOT ME. That doesn't happen often." Achievement toast, flipped scoreboard, then the Locker Room unlock. |
| 14 | Motion (`Motion`) | Camera moves, easing tokens and micro-interactions (§6) |
| — | Quick View (`QuickView`) | **A fluid, responsive page**, plain HTML with no WebGL needed. Hero, career, highlights, attributes, trophies, academy and Team Up. |
| 15 | Mobile ×4 + Responsive (`Mobile-*`, `Responsive`) | 390px landing, fixtures hub with 5-tab bar, one-thumb game, scouting report; the desktop/tablet/mobile/reduced-motion behaviour matrix |

---

## 5. Game system — "Play Against Me"

**Loop:** Enter venue (1.1s tunnel push), then Play (5–15s, one input), then Reveal (on **every** input), then Verdict (2s), then Continue (full page, rematch or next venue). **Skip** is always one click away.

| Venue | Game | Desktop | Mobile | Time | Reveals | How Yash (almost always) wins |
|---|---|---|---|---|---|---|
| Cricket | **Bowl at Me**: 3 balls, length meter | Space / click to release | Tap | ~10s | 1 career "innings" per ball (3rd ball = academy) | Bad ball = SIX, decent ball = FOUR, perfect yorker = dot ball. On ball 3, even a perfect yorker is flicked for four, unless the 1% roll lands. |
| Tennis | **Return of Serve**: up to 3 returns | ← → or click a side | Swipe | ~12s | 1 project per return | Serve speed rises; the 3rd return meets a winner that clips the line |
| Badminton | **Smash or Clear**: 4 rallies | Hold & release | Press & hold | ~10s | 1 skill group per rally | He reads every smash; only a perfectly weighted drop at 20–19 gets through |

**Cricket reference logic** (working code in `design-source/Cricket-Play.dc.html`):

```js
// cursor ping-pongs across the meter every 1.1s; perfect = centre ±3.5%, good = ±12%
const p = triangleWave((now - t0) / 1100);
const q = |p - .5| < .035 ? 'perfect' : |p - .5| < .12 ? 'good' : 'miss';
// balls 1–2: perfect → DOT, good → FOUR, miss → SIX
// ball 3: if all three were perfect AND Math.random() < 0.12 → BOWLED HIM (visitor wins)
//         else perfect/good → FOUR, miss → SIX
```

**Tuning the 1%:** P(win) = P(perfect on every input) × luck roll ≈ 8% × 12% ≈ 1%. A win always means the visitor really did play perfectly.

**Rules of fair play**

- Skip and Quick View are visible on every game screen and at least 44px tall.
- No game runs longer than 15s, and replays are never forced.
- After 2 losses, offer "Watch the highlight instead".
- Games are hidden from screen readers (`aria-hidden`), and revealed content is announced in an `aria-live` region.
- With reduced motion on, the game is replaced by a 3s auto-rally followed by the reveal.
- Keep the record ("YASH 99 · YOU 1") and the achievements in `localStorage`. The site works without them.

**Easter egg:** on any visitor win, route to Giant Killer. Unlock the Locker Room (`/locker-room`), add the trophy to the visitor's cabinet, and prefill Team Up with "I beat you."

---

## 6. Motion

**Easing**

| Name | Curve | Duration | Used for |
|---|---|---|---|
| Follow-through | `cubic-bezier(.22,1,.36,1)` | 600–1200ms | Camera, panels, reveals |
| Snap | `cubic-bezier(.2,.9,.1,1)` | 160–240ms | Hovers, presses, score digits |
| Swing | `cubic-bezier(.65,0,.35,1)` | 400–500ms | Ball arcs, broadcast wipe |

**Camera moves:** Crane In (landing, 1.2s) · Idle Orbit (hub, ±6° over 40s; stops on cursor move) · Tunnel Push (hub to venue, 1.1s, hides the scene load) · **Broadcast Wipe** (game to reveal: a volt bar at 18° over 480ms, with the YS mark flashing mid-wipe).

**Micro-interactions**

- Buttons get a floodlight sweep across them on hover (300ms) and shrink 3% when pressed.
- Cards lift 8px and tilt up to 6° on hover, and their border turns volt.
- Stats count up over 900ms using tabular digits.
- Trophies get a spotlight drop (400ms), then the selected one turns slowly on a turntable (12s).
- Particles are dust in the light beams only, at most 60 specks at 15% opacity, and switched off on mobile.

**Player Introduction timeline** (`Intro`, total about 6s)

| t (s) | Beat |
|---|---|
| 0.2–0.95 | Four floodlight banks flicker on, 250ms apart |
| 0.8 | Scoreboard powers up (border and box-shadow) |
| 0.95–1.9 | **Silhouette entrance:** `translateX(-1180px) rotateY(30deg) scale(.9)` to rest, with blur 10px to 0. A volt rim drop-shadow, 2 tinted trailing copies, light trails and particles riding behind. |
| 1.88 | **Impact:** board edge flashes volt, a shockwave bar fires, and 0.32s of clip-path glitch slices |
| 1.85–3.85 | **Performance (48 rendered frames, 24fps):** starts turned 18° with chin down, turns into camera (overshoots to −3.5°), key light builds as he turns into it, chin lifts (−4.5°), one confident nod (+3.5°), then settles. Silhouette-to-lit filter runs over 1.85–2.65s. |
| 2.78 | Horizontal lens flare across the eye line, with soft eye glints |
| 2.85–3.75 | About 90 scoreboard pixels fly into the name area. **YASH SARDA** letters lock in out of order (3 entry variants, 55ms stagger). |
| 3.95–4.55 | **SOFTWARE ENGINEER** is revealed by a white leading bar |
| 4.3–4.7 | **PLAYER 01 • ENGINEER • BUILDER • COMPETITOR** ticks in piece by piece |
| 5.0 | The whole stadium flashes and the floodlights flare |
| 5.4 / 5.7 / 5.9 | **WELCOME TO MY ARENA**, then **ENTER THE ARENA →** (pulsing glow), then commentary: "The player has entered the arena." |
| 3.9 → ∞ | Idle: breathing (scale 1.009 over 3.6s), and a light sweep masked to the character every 6s |

---

## 7. Content rules (use `content.json`)

- **Skills show evidence, not self-ratings.** There are three levels:
  - `shipped` (9/10 segments, volt): used in production at Deutsche Bank.
  - `built` (7/10, white): used in projects or academic work.
  - `kit` (5/10, grey): on the resume but not yet tied to a role.
  Some skills replace the level label with a custom tag ("750+ SOLVED", "75+ TESTS", "BLOGS").
- **Status vocabulary:** NOT OUT = current role · DEBUT = first innings (internship) · ACADEMY = education.
- **Experience length:** shown as "since Jul 2024" rather than a year count, so it never goes stale. Compute it at runtime if you need a number.
- **Commentary:** keep it short, dry and a little self-aware, never boastful. The full list is in `content.json → commentary`.

---

## 8. Assets

| File | Spec | Use |
|---|---|---|
| `assets/yash-portrait.webp` | 1397×1126, original background | Reference / fallback |
| `assets/yash-portrait-cutout.png` | 1397×1126, transparent | Cards, any compositing |
| `assets/character-rig/turn_0/1/2.webp` | Each a strip of **16 frames × 700×564**, transparent (11200×564) | The intro performance. Display at 560×451 with `background-size: 8960px 451px`. Play each strip with `steps(16, jump-none)` over 0.667s from `0` to `-8400px`. Chain 0, then 1, then 2 by switching opacity at 2.517s and 3.183s. |
| `assets/character-rig/rest.webp` | 700×564, transparent | Final pose; also the mask for the idle light sweep, plus the Player Card and Attributes portrait |
| `assets/Yash-Sarda-Resume.pdf` | — | View/Download Player Card. **Note: it includes a phone number.** Swap in a public version if needed. |
| `tools/rig.py` | Python | Re-renders the rig. It cuts the subject out with ISNet (rembg's `isnet-general-use.onnx`), estimates depth with Depth-Anything ViT-S (ONNX), then warps yaw and pitch through an inverted displacement field with depth-based key and rim relighting. Turns stay clean up to about ±18°. |

**Production upgrade:** swap the sprite strips for a short **WebM (VP9 with alpha)** or **HEVC with alpha** clip (Safari) of the same performance for smaller files. For bigger moves (crossed arms, a smile, a full look-around), generate an image-to-video clip from the portrait and drop it into the same slot. All the surrounding effects stay as they are.

---

## 9. Build notes

**Suggested stack:** Next.js (or Astro) + React Three Fiber / Three.js for the 3D stadium, GSAP for the timelines, and CSS for the UI layer. Lazy-load each venue scene. **Quick View is server-rendered HTML** and must work with JS and WebGL turned off.

| | Desktop ≥1200 | Tablet 768–1199 | Mobile <768 | Reduced motion |
|---|---|---|---|---|
| Renderer | Full WebGL, dynamic floodlights | WebGL lite, baked lighting | 2.5D layered parallax, no WebGL | Static plates, crossfades |
| Intro | 6.5s + sound gate | 4s | 2s (lights + name), sound off | Instant scoreboard |
| Navigation | 3D hub + index rail | Hub + drawer | Fixtures list + 5-tab bar | Same, no camera moves |
| Games | Keyboard/mouse, ±35ms window | Touch + keys | One thumb, ±60ms window, haptics | 3s auto-rally then reveal |
| Effects | Dust, glass blur, tilt | Blur only | Solid panels, no particles | None |

**Budgets:** landing text visible in under 1.5s · 3D scene 3MB or less, lazy-loaded per venue · 60fps on desktop, 30fps on tablet.

**Accessibility:**
- Use real `<button>`, `<a>` and `<label>` elements, with an `aria-label` on icon buttons.
- Text contrast is at least 4.5:1. The dimmest text colour is `#7D8893` on `#05070A`.
- No global key handlers outside active games.
- Respect `prefers-reduced-motion`.

---

## 10. Open items

- [ ] Screen recordings or screenshots for the 3 projects (the replay panels have placeholder slots)
- [ ] Source links per project, if public (currently pointing to the GitHub profile)
- [ ] Locker Room content: the hidden section's page itself still needs designing
- [ ] Optional: a public resume PDF without the phone number
- [ ] Crowd audio bed and SFX (floodlight thud, bat crack, net cord, shuttle smash)
- [ ] Final decision on the experience label (resume says 1.7 yrs; the design uses "since Jul 2024")
