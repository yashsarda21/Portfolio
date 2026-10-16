# Phase 8, cycle 1 — 3D Cricket — Design

**Date:** 2026-10-15 · **Owner:** Yash Sarda · **Status:** Draft for review

**Parent spec:** [`2026-10-03-arena-portfolio-design.md`](2026-10-03-arena-portfolio-design.md). This document changes only the cricket game (`/arena/cricket`). Where it differs from the parent's §8, §8.1 and §11.13 for cricket, this document wins. Tennis and badminton are not touched in this cycle; each gets its own design later (cycle 2 tennis, cycle 3 badminton).

---

## 1. Goal (in plain words)

Turn "Bowl at Me" into a proper playable 3D mini-game. You bowl three balls at Yash in a floodlit 3D stadium; Yash bats like a real player and always wins, but it must feel like a real contest, not a fixed one.

**Owner's biggest ask: keep it simple.** Fewest moving parts, no extras. When in doubt, leave it out.

**Done means:**
1. Cricket always plays in 3D on desktop and phones, after a short loader (2 to 3s on a good connection).
2. The rules and results stay exactly as today (§4.3), so Full Time, saving and the reveals keep working.
3. Players move naturally (real motion clips plus code-made cricket shots), the ball flies with real speed and bounce, and the camera follows the ball.
4. The rhythm of bowling shows: walk back, run-up, release, crowd clapping along.
5. Lighthouse gates hold on `/arena/cricket`: desktop performance at least 90, phone at least 80 (parent §11.13 G17 and P7).
6. Yash plays it and approves the feel.

## 2. Decisions from the brainstorm (2026-10-15)

| # | Question | Decision |
|---|---|---|
| B1 | Win rule | Yash always wins the match. No visitor-win ending (parent §11.14 stands). |
| B2 | Player look | Stylised broadcast-style athletes in site kit colours with real motion. Not photo-real, not block mannequins. |
| B3 | Devices | 3D on desktop and phones. Phones use a lighter setting (§6.3). |
| B4 | Game length | About 30 to 45s per game. Replaces the parent's 15s bound for this game. Skip and Quick View are always visible. |
| B5 | Build split | Three separate cycles: (1) 3D groundwork + cricket, (2) tennis, (3) badminton. Each game designed on its own; only plumbing is shared. |
| B6 | Assets | **Free only, now and later.** No paid packs or tools. Licences must allow a public website (CC0 preferred). |
| B7 | Balls | 3 balls (Yash has 3 career pieces to show), and the rhythm must still show. |
| B8 | Motion source | Option A: a free CC0 athlete body and everyday moves (idle, walk, jog, sprint, crouch) from Quaternius; the cricket moves (batting shots, bowling action, keeper take, fielder dive) built in code from key poses. |
| B9 | 2D or 3D | Always 3D, with a loader while it downloads. The existing 2D game is kept only for: reduced motion, no WebGL, or a failed download (§6.2). |
| B10 | Physics | No physics engine. The ball's flight is our own small maths (§5). |

## 3. What the visitor sees

### 3.1 One ball (about 8 to 10s)

1. **Walk back.** The bowler walks back to the mark; the fielders reset; Yash takes guard. (Ball 1 starts straight at step 2.)
2. **Aim.** The camera is the classic TV view from behind the bowler. You pick a **line**: OFF, MIDDLE (default) or LEG (§3.2).
3. **Run-up.** Press BOWL. The bowler runs in, strides speeding up; the crowd claps on each stride and goes quiet just before release.
4. **Release.** The timing meter (SHORT · YORKER · FULL TOSS, as drawn) sweeps **once** across the last 1.1s of the run-up; its centre is the bowler's final leap. Press again to release. Early = short ball, centre = yorker, late = full toss. No press by the end of the sweep = released as a full toss (a miss).
5. **The ball.** It flies at the speed your timing earned (§4.2), bounces where your length put it, and reaches Yash.
6. **Yash's shot** (§4.3). The camera follows the ball: low and racing to the rope for a FOUR, high into the crowd for a SIX, staying on the keeper's gloves for a DOT.
7. **The call** ("SIX."), the commentary line, the career piece unlocks on the stadium screen, the score updates.

### 3.2 Controls

| Action | Keyboard | Mouse / touch |
|---|---|---|
| Pick line | ← / → | Tap OFF / MIDDLE / LEG (a small 3-way control beside BOWL) |
| Start run-up | Space or Enter | BOWL button (phone: TAP TO BOWL) |
| Release | Space or Enter again | The same button again; its label reads RELEASE during the run-up |

The line can be changed until BOWL is pressed. All new labels (line names, RELEASE, the loader text) come from `ui` content, never hard-coded (parent §1).

### 3.3 Rhythm across the three balls

- Ball 1 calm. Ball 2: two fielders walk in a few steps. Ball 3: the crowd stands.
- The clap loop follows the bowler's strides (each stride = one clap), so the release press feels like part of the bowling action.

### 3.4 What stays exactly as today

- All broadcast HUD: score bug, BALL n OF 3, the left panel, the STADIUM SCREEN reveals, the timing meter, BOWL, COMM, Skip, Quick View, the big call, the end buttons, the verdict timing (`VERDICT_MS`).
- Content reveals: innings 01, 02, then the academy (G7).
- Commentary lines (G4, G12), the score format (`14* NOT OUT`), the form grade (`perfectShare`) saved for Full Time.
- Reduced motion: today's 2D auto-rally (G10), unchanged.

### 3.5 What the 3D scene replaces

In 3D the canvas takes the place of the drawn backdrop (`GameBackdrop` turf) on both layouts, under the HUD. The drawn pitch marks (tracer path, tracking rings, the YORKER / GOOD LENGTH labels, the static bat) are not shown in 3D: the 3D pitch has the yorker and good-length bands painted on it. No tags float in the 3D scene (the score bug already says who is on strike). While 3D is still loading, the 2D board is shown as today, with the loader in BOWL's place; when 3D is ready it fades in over it. The 2D board keeps all of its marks for the fallback.

## 4. Game rules

### 4.1 Unchanged referee

`cricket/referee.ts` keeps its rules and numbers: 3 balls; `lengthQuality(p, layout)` with the zones stage 0.035 / 0.12 and column 0.05 / 0.14; balls 1–2 perfect → DOT, good → FOUR, miss → SIX; ball 3 perfect or good → FOUR, miss → SIX; never out. The only input change is where `p` comes from: the meter's single sweep during the run-up (§3.1 step 4), at today's crossing speed (`CRICKET_PERIOD_MS`, 1100ms), so the perfect window is the same width in milliseconds as today.

### 4.2 Delivery (from your inputs)

| Timing quality | Speed shown (speed gun) |
|---|---|
| perfect | 142–145 km/h |
| good | 132–138 km/h |
| miss | 120–128 km/h |

- **Length:** where the ball pitches comes from `p` (early → short, centre → yorker, late → full toss; a full toss does not bounce before the bat).
- **Line:** OFF / MIDDLE / LEG, plus a small random scatter for good and miss balls.
- The speed is shown as a small mono line just above the timing meter ("143 KM/H"), from the release until the next ball. Its space is kept empty before the first ball, so nothing moves.

### 4.3 Yash's answer (the "director")

A pure function picks Yash's shot from the referee's result plus the ball's line and length. The result never changes; only how it looks does. The shot is chosen so that **what you see always matches the commentary line** (the prototype's lines, G4); only the exact direction inside a range is random (injectable random source, so tests are fixed). Yash bats **right-handed** (owner, 2026-10-15).

**The side rule (owner, 2026-10-16):** the shot goes to the side the ball was bowled. An OFF ball only ever goes to the off side (a negative bearing), a LEG ball only to the leg side; a MIDDLE ball may go either way (straight, or pulled when short). A dot is played straight back (bearing 0) on every line.

| Referee result | What you see | Commentary |
|---|---|---|
| DOT, OFF line (a perfect ball is always a yorker) | **Beaten:** a play-and-miss; the ball passes the bat and just misses off stump; the crowd goes "ooh"; the keeper takes it. | new derived line `comm.beaten`: "Beaten! Missed off stump by a whisker." |
| DOT, MIDDLE or LEG line | **Dug out:** the yorker jammed into the pitch at the last second. | `comm.dot` (as today) |
| FOUR | **Drive** along the ground through the gap (OFF → cover, MIDDLE → straight past the bowler, LEG → midwicket); the nearest fielder dives and misses. | `comm.four` / `comm.lastGood` (as today) |
| FOUR on a perfect ball 3, MIDDLE or LEG line | **Flick** off the toes through midwicket. | `comm.lastPerfect` ("Perfect yorker. Flicked off the toes anyway.") |
| FOUR on a perfect ball 3, OFF line | The yorker **squeezed out through point** (the drive's motion, along the ground, bearing −95 to −75). | new derived line `comm.lastPerfectOff`: "Perfect yorker. Squeezed through point anyway. Still not out." |
| SIX from a short ball (an early miss), MIDDLE or LEG line | **Pull** over midwicket. | `comm.six` / `comm.lastSix` (as today) |
| SIX from a short ball, OFF line | **Cut:** back and across, a slash with the arms out and the face open, up over point and third man (bearing −110 to −80). | `comm.six` / `comm.lastSix` (both fit a short ball) |
| SIX from a full toss (a late miss) | **Loft** into the crowd (OFF → long-off, MIDDLE → straight, LEG → long-on). | balls 1–2: new derived line `comm.sixFull`: "Full toss. Thank you very much."; ball 3: `comm.lastSix` |

Ball 3 is never a DOT (the referee already ensures this). The three new lines are derived copy for Yash's copy review. The 2D game keeps today's lines.

## 5. Ball flight (our own maths, no engine)

One pure TypeScript module, unit-tested, all in metres and seconds.

- Pitch 20.12m; gravity 9.81. The ball leaves the bowler's right hand where he is when he lets go (about 1.98 m up and 1.06 m in front of him, measured on the rig at the release key), not from a fixed point.
- **To the batter:** the launch is solved so the ball pitches at the chosen length and line at the delivery speed. Bounce: vertical speed × 0.45, horizontal speed × 0.9, plus a small sideways seam nudge (up to ±0.1m by the bat; none on a perfect ball, which is right on the spot). A full toss skips the bounce.
- **Off the bat:**
  - FOUR: launch angle under 5°, about 28m/s, then rolling friction; it must cross the rope (about 65m).
  - SIX: launch 30 to 40°, enough speed to land beyond the rope (about 75m).
  - DOT: dies at the batter's feet (dug out) or carries to the keeper (beaten). A beaten ball is aimed past the bat, not carried on along its line: it passes the stumps at x −0.26 (clear of off stump at the drawn size) and ends in the keeper's gloves.
- **Contact timing:** the shot clip is started so the bat meets the ball exactly at the contact moment (we control both, so this always lines up).

## 6. Technical design

### 6.1 Libraries and files

- New: `three` and `@react-three/fiber` (v9; works with React 19.3). No drei, physics, post-processing or other 3D libraries.
- Free CC0 assets from Quaternius (downloaded by Yash, 2026-10-15): the `Superhero_Male_FullBody` body from "Universal Base Characters [Standard]" and these clips from "Universal Animation Library [Standard]" (`UAL1_Standard.glb`, no root motion): `Idle_Loop`, `Walk_Loop`, `Jog_Fwd_Loop`, `Sprint_Loop`, `Crouch_Idle_Loop` (the keeper), plus `Sword_Idle` / `Sword_Attack` if they make a better base for the batting stance and shots. Both use the same 65-bone skeleton with the same bone names, so the clips play on the body directly. There is no cheer clip in the free pack.
- Shipped as `public/models/athlete.glb` (the body, no textures), `public/models/athlete-skin.jpg` (the body's colour texture, 1024px) and `public/models/moves.glb` (the chosen clips only), trimmed with glTF-Transform. **No compression that needs a decoder** (no Draco, no Meshopt) and **no images inside a GLB**: the site's CSP (`script-src` without `wasm-unsafe-eval`; `img-src` / `connect-src` without `blob:`) stays unchanged. Credits go in `public/models/CREDITS.md`, like the audio.
- **Kits are painted in code:** the free body comes almost unclothed, so a small material patch colours the shirt and trousers regions (chosen by height and reach on the body's rest pose) and keeps the skin texture elsewhere. Yash: a dark kit with a volt helmet; the bowler and fielders: a light kit with dark trousers. Pads, gloves, the bat, the helmet and the fielders' caps are simple code-built meshes attached to the body's bones.
- The stadium is built in code from simple shapes: ground, pitch, stumps, boundary rope, stands, floodlight towers, one instanced crowd.
- Players on the field: Yash, the bowler, a keeper and four fielders (seven bodies), the same count on every device.

### 6.2 Loading and the one fallback rule

1. The page renders as today (prerendered, both layouts), with a **loader** in the game area: a broadcast-style line such as "PREPARING THE PITCH" with a bar showing real download progress. BOWL is not shown until ready. Skip and Quick View stay visible.
2. The 3D code and files start downloading after first paint.
3. When ready, the loader fades and the 3D game starts.
4. **The 2D game is today's game exactly** (one press, the ping-pong meter, no line control, no run-up). **It is used only when:** reduced motion is on (decided at once, no download), WebGL is unavailable (decided at once), or the download fails or takes longer than 20s. The decision is made once per visit to the page and never changes mid-game.
5. Once loaded, the files stay cached: Rematch and coming back are instant.

### 6.3 Desktop and phone settings

Two settings only, chosen by the existing `MEDIA.lg` query:

| | Desktop (stage) | Phone / tablet (column) |
|---|---|---|
| Pixel ratio cap | 2 | 1.5 |
| Shadows | one shadow-casting floodlight | none (a soft blob under each player) |
| Crowd | full instanced crowd | half the crowd |
| Camera framing | the TV view framed to the 1440×900 stage | the same view, framed for the narrow column |

### 6.4 Code layout

- `src/features/games/three/` — the shared plumbing only (reused by tennis and badminton later):
  - `GameCanvas` (the R3F `Canvas` in the backdrop's place; the two settings; the frame loop paused while the tab is hidden)
  - the loader and the fallback decision
  - `useAthlete` (load the body once, clone per player, tint the kit, hold the clips)
  - `poseClip` (turn a list of key poses into a normal `AnimationClip`, so code-made moves blend with the free clips)
- `src/features/games/cricket/3d/`:
  - `ball.ts`: the flight maths (pure)
  - `director.ts`: the shot picker (pure)
  - `shots.ts`: the key poses for the batting shots, the bowling action, the keeper take and the fielder dive
  - the scene (ground, stands, crowd, lights, players)
  - the camera
  - the per-ball sequence (walk back, aim, run-up, release, flight, shot, follow, call)
- `CricketScreen.tsx` gains the run-up phase and the line choice; the referee, the view builder and the HUD components are reused as they are.
- Game rules stay outside React components; per-frame movement uses refs and `useFrame`, never React state (skill `react-three-fiber-game`).

### 6.5 Sound

Game sounds, through the existing audio system and mute toggle:
- made in code (`src/shell/synth.ts`, Phase 7): the ball's bounce and a clap per stride during the run-up;
- CC0 recordings Yash picked by ear (`src/shell/gameSound.ts`, `public/audio`, credited in `public/audio/CREDITS.md`): the bat on the ball, the crowd's "ooh" at a play-and-miss, the cheer for a FOUR or SIX (and every game's end), and a soft stadium hum under the 3D game only. Each is fetched ahead and decoded once a gesture has made the sound context; until then (or if a file cannot load) the code-made sound plays. The hum fades in when the 3D game is on screen and sound is unlocked and on; it fades out when sound is turned off, the tab is hidden, or the page is left.

### 6.6 Edge cases

- **Tab hidden:** a ball in progress is cancelled and bowled again fresh (as tennis does, G2); the scene pauses.
- **Resize across 1200px:** the game continues (G1); the canvas and settings follow the new layout from the next ball.
- **Leaving the page:** everything is disposed (R3F does this on unmount); the cached files stay for a return visit.
- **Accessibility:** the canvas is `aria-hidden`; calls and reveals are still announced by `GameAnnouncer`; every control is a real button with a 44px target; the keyboard works everywhere.

## 7. Testing (lean)

- **Unit:**
  - `ball.ts`: pitches at the chosen length and line; speed bands; a FOUR stays low and crosses the rope; a SIX carries the rope.
  - `director.ts`: never changes the referee result; picks only shots that fit the line and length; ball 3 is never a DOT.
  - `poseClip`: one test.
  - The meter sweep: its centre is the final leap.
- **Browser (e2e):**
  - Desktop and phone: the loader appears, then the canvas; three balls are played to the end screen and the result is saved.
  - The fallback: WebGL disabled → the 2D game plays.
  - Reduced motion: the existing auto-rally tests stay green.
- **Pixel parity:** the 2D board's existing parity tests keep running against the 2D fallback, with WebGL turned off in the test.
- **Lighthouse:** `/arena/cricket`, desktop at least 90 and phone at least 80.
- **Yash's check:** he plays it on his laptop and phone and approves the feel and the sounds.

## 8. Out of scope (this cycle)

- Tennis and badminton (cycles 2 and 3).
- Replays, multiple camera angles, slow motion, weather, an umpire, player faces or likeness.
- Any paid asset or tool.
- Changing the rules, the results or the HUD design.

## 9. As built (2026-10-16)

### 9.1 The speed gate (owner decision, 2026-10-16)

- Lighthouse gates `/arena/cricket` on the page's **first load**, as in every phase: the prerendered page and the 2D game it falls back to. The gated runs switch WebGL off (`--disable-3d-apis`, as the 2D e2e projects do): headless Chrome on a Mac with a GPU otherwise has WebGL2 (Apple M1, through Metal) and would load the 3D.
- The 3D game is measured too, and **only reported**, never gated: "desktop, 3D (software WebGL)" and "mobile, 3D (software WebGL)" run Chrome with SwiftShader. SwiftShader draws on the CPU, so it overstates what a real device's GPU costs (the main thread waits on it for every context and every shader).
- Yash checks the 3D's smoothness on his own phone before merge.

### 9.2 Lighthouse (3 runs each; perf = median, a11y / bp / SEO = worst run, CLS = worst run)

| `/arena/cricket` | run | perf | a11y | bp | SEO | FCP | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|---|
| desktop, **gated** (WebGL off) | after | 100 | 100 | 100 | 100 | 468 ms | 572 ms | 0.000 | 0 ms |
| phone, **gated** (WebGL off) | after | 92 | 100 | 100 | 100 | 2036 ms | 3156 ms | 0.000 | 0 ms |
| desktop, 3D (software WebGL) | before | 64 | 100 | 100 | 100 | 472 ms | 581 ms | 0.000 | 2068 ms |
| desktop, 3D (software WebGL) | after | 67 | 100 | 100 | 100 | 468 ms | 605 ms | 0.000 | 1172 ms |
| phone, 3D (software WebGL) | before | 42 | 100 | 100 | 100 | 2037 ms | 7789 ms | 0.081 | 2393 ms |
| phone, 3D (software WebGL) | after | 45 | 100 | 100 | 100 | 2038 ms | 7751 ms | 0.000 | 2251 ms |

Gates: desktop performance ≥ 90, phone ≥ 80, accessibility 100, best practices and SEO ≥ 90, FCP ≤ 1500 ms, CLS ≤ 0.1; every other page keeps its Phase 7 result and the budget is met. Before the fixes, the gated page measured with WebGL off scored desktop 99–100 and phone 82–83. The phone's 3D LCP (about 7.8 s) is the moment TAP TO BOWL appears, after about 925 KB arrive on Lighthouse's slow 4G. The first 3D run in each fresh Chrome is much slower (desktop 49, phone 26): SwiftShader starts up and compiles every shader cold.

### 9.3 The 3D start-up, in small steps

- The WebGL2 check makes a throwaway context. It now runs in a task of its own just after hydration (not inside it), and once per visit to the site.
- After the three files arrive, the clips are built (all 10 made clips and the 5 free ones, once, shared by the seven players) and the body's skinned bounds are measured once (each clone copies them), each in a task of its own.
- The scene then mounts **hidden** over the 2D board, and `renderer.compileAsync` compiles every shader in a task of its own before the first frame; the loader stays up until it resolves. Where the browser has `KHR_parallel_shader_compile` (Chrome on the M1 does; SwiftShader does not), the compile no longer freezes the page.
- The phone's thumb zone keeps the controls' place (unseen) while the loader shows, so nothing moves when the 3D arrives (the 0.081 layout shift is gone).
- The camera rig and `applyClips` make no new objects per frame; the shotlist's own per-frame reads (`camera()`, `sampleTrack`) still make a few small arrays, a negligible cost.
- Unused JavaScript: no cheap win. R3F imports the whole of `three` (`import * as THREE`), so naming fewer imports would not shrink the chunk.

Long tasks (Chrome CPU profile, a fresh browser each run, until 5 s after the 3D shows; "phone" = 390×844 with the CPU slowed 4×):

| Where | Before | After |
|---|---|---|
| SwiftShader, phone | hydration + WebGL check 2.6–3.3 s; scene mount 0.6 s (0.45 s making the context); first frame 1.5–2.0 s (1.1–1.3 s waiting for shaders) | hydration 0.1 s; WebGL check 2.5 s on its own; clips and bounds under 0.1 s each; mount 0.24 s; first frame 1.46 s |
| SwiftShader, desktop | 5.5 s; 2.6 s; 0.35 s (shadow shaders) | 6.3 s (the check alone); 0.5 s; 1.7 s |
| Apple M1 GPU, phone | 144–154 ms, 265–269 ms | 181–190 ms, 88–91 ms |
| Apple M1 GPU, desktop | 115–127 ms | none over 50 ms |

On SwiftShader the check's context costs seconds because the software GPU process is busy drawing the page, and SwiftShader has no parallel shader compile, so the first frame still waits for the shaders; a real GPU has neither problem. On the M1 the 3D appears about 0.3–0.4 s later on the slowed phone (the compile now finishes before the first frame), with no freeze over 0.2 s.

### 9.4 Sizes (build/client)

| File | raw | gzip -9 | brotli q5 |
|---|---|---|---|
| `assets/scene-*.js` (three + R3F + the scene, lazy) | 993,894 | 260,294 | 243,742 |
| `assets/arena.cricket-*.js` (the route) | 18,424 | 7,065 | 6,772 |
| `models/athlete.glb` | 414,616 | 248,338 | 194,425 |
| `models/moves.glb` | 153,944 | 65,296 | 61,626 |
| `models/athlete-skin.jpg` | 81,716 | 80,959 | 80,905 |

The models are sent as they are (`application/octet-stream`, like Vercel), so after first paint a first cricket visit downloads about 925 KB: the scene chunk 244 KB (brotli), the models 651 KB, gsap 27 KB and two small chunks of about 4 KB.

### 9.5 Camera (`field.ts`)

- `CAMERA.aim`: position `[0, 8, 54]`, target `[0, 0, 8]` (the TV view from behind the bowler).
- `fov`: stage 16, column 26. `followFov`: stage 34, column 46 (the lens opens as the camera leaves the TV view; fully open 10 m away).
- `tilt`: stage 0, column 4.5° (the column tips down, so the play sits above the thumb zone).

### 9.6 Clips

- All 13 cricket clips are key poses (`shots.ts`): stance, bowl, dugOut, beaten, drive, flick, pull, cut, loft, keeperWait, slipWait, keeperTake, dive. No `Sword_*` clips are used.
- Key-pose clips are smoothed (fix wave): each bone runs on a monotone cubic through its keys, keyed 30 times a second, exactly on every key (so the bat still meets the ball at `SHOT_CONTACT`), easing out of the first key and into the last, never overshooting a held key. Every bat shot has a pickup key (the toe goes back toward the keeper) and the front-foot shots a downswing key (the bat comes down from behind the hip). Yash's shot fades in over 0.2 s and hands over to the idle over 0.4 s; the keeper settles back into his squat over 0.3 s.
- The keeper waits in a wicket-keeper's squat (on the balls of his feet, knees wide, gloves together low between them, eyes on the bowler) and the slip in a ready stance (back at about 45 degrees, hands cupped low toward the batter), each with a small breathing loop; the take rises out of the squat and sinks back into it.
- The 4 free clips used (idle, walk, jog, sprint) play on the body as they are, lifted so the feet meet the floor (`CLIP_LIFT`, the lowest sole over each whole cycle): idle 0.053 m, walk 0.05, jog 0.039, sprint 0.052. `Crouch_Idle_Loop` is still in `moves.glb` but no longer played; dropping it means re-running `tools/models.mjs` on the Quaternius folder (Yash, by hand).

### 9.7 Rulings, in plain words

- Task 4 could change one line in `sequence.ts` (a type check that every sound cue is a real sound), though its file list left it out: the plan asked for that line.
- `tools/models.mjs` repeats the five free clip names, because the tool cannot import TypeScript; `rig.test.ts` fails if the two lists drift apart.
- Task 7 defines the view builder the same way `CricketScreen` does, since the snippet left it out.
- The model tool uses the dev package `@gltf-transform/extensions` rather than a hand-written extension class: same project, less of our own code, one more dev dependency.
- The free clips' feet sit a few centimetres off the floor on this body; the 3D world fixes it with a small measured lift per clip, so the model tool stays simple.
- A small pnpm patch back-ported React Three Fiber 9.8.2's one-line JSX type fix onto 9.8.1 while the release-age rule blocked 9.8.2. The fix wave moved to 9.8.2 (the rule accepted it with no exclusion) and dropped the patch.
- **The speed gate (owner, 2026-10-16):** fix the real problems (the phone's layout shift when the 3D arrives, long freezes at start-up), keep the 90 / 80 gate on the page's first load, report the full 3D numbers separately without gating them, and Yash checks the smoothness on his own phone before merge.

### 9.8 The fix wave (2026-10-16)

The owner's play-test and the independent review, in one wave:
- **What you see matches what happened.** A beaten ball passes outside off stump and ends in the keeper's gloves (I1); the ball leaves the bowler's hand where he lets go, for an early, a centre or a late press (I2).
- **Start-up and leaving.** The board's backdrop stays over a new canvas until its first frame is drawn, on arrival and after a resize across 1200px; the game takes input from the moment the scene is shown (M2). Once the files are in, the scene gets 10 s to compile and show, or the 2D game takes over, and a failed compile falls back too (M3). Coming back while the download still runs joins it (M4). Leaving or resizing lets the old renderer go (M1).
- **Sound.** One cheer on the last ball, at the rope (M5); the bat, the "ooh", the cheer and the hum are recordings (§6.5).
- **Screen readers** hear the line change ("LINE: OFF") (M9).
- Left for later, as the review allowed: the 3D lining up with the board on windows narrower than 16:10 (M6), the drawing size on very large screens (M7), focus kept across a late fall back to 2D (M8).

