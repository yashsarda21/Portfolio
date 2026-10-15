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

| Referee result | Options (each must fit the ball) |
|---|---|
| Referee result | What you see | Commentary |
|---|---|---|
| DOT, OFF line (a perfect ball is always a yorker) | **Beaten:** a play-and-miss; the ball passes the bat and just misses off stump; the crowd goes "ooh"; the keeper takes it. | new derived line `comm.beaten`: "Beaten! Missed off stump by a whisker." |
| DOT, MIDDLE or LEG line | **Dug out:** the yorker jammed into the pitch at the last second. | `comm.dot` (as today) |
| FOUR | **Drive** along the ground through the gap (OFF → cover, MIDDLE → straight past the bowler, LEG → midwicket); the nearest fielder dives and misses. | `comm.four` / `comm.lastGood` (as today) |
| FOUR on a perfect ball 3 | **Flick** off the toes through midwicket. | `comm.lastPerfect` ("Perfect yorker. Flicked off the toes anyway.") |
| SIX from a short ball (an early miss) | **Pull** over midwicket. | `comm.six` / `comm.lastSix` (as today) |
| SIX from a full toss (a late miss) | **Loft** into the crowd (OFF → long-off, MIDDLE → straight, LEG → long-on). | balls 1–2: new derived line `comm.sixFull`: "Full toss. Thank you very much."; ball 3: `comm.lastSix` |

Ball 3 is never a DOT (the referee already ensures this). The two new lines are derived copy for Yash's copy review. The 2D game keeps today's lines.

## 5. Ball flight (our own maths, no engine)

One pure TypeScript module, unit-tested, all in metres and seconds.

- Pitch 20.12m; release height about 2.2m; gravity 9.81.
- **To the batter:** the launch is solved so the ball pitches at the chosen length and line at the delivery speed. Bounce: vertical speed × 0.45, horizontal speed × 0.9, plus a small sideways seam nudge (up to ±0.1m by the bat). A full toss skips the bounce.
- **Off the bat:**
  - FOUR: launch angle under 5°, about 28m/s, then rolling friction; it must cross the rope (about 65m).
  - SIX: launch 30 to 40°, enough speed to land beyond the rope (about 75m).
  - DOT: dies at the batter's feet (dug out) or carries to the keeper (beaten).
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

New game sounds, made in code like the other game sounds (`src/shell/synth.ts`, Phase 7):
- bat crack
- ball bounce
- a clap per stride during the run-up
- an "ooh" on a play-and-miss
- the existing crowd cheer on FOUR and SIX

All of them go through the existing audio system and mute toggle. Yash listens and approves them at review.

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
