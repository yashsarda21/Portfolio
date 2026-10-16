# Phase 8, cycle 2 — 3D Tennis — Design

**Date:** 2026-10-16 · **Owner:** Yash Sarda · **Status:** Draft for review

**Parent spec:** [`2026-10-03-arena-portfolio-design.md`](2026-10-03-arena-portfolio-design.md). This document changes only the tennis game (`/arena/tennis`). Where it differs from the parent's §8, §8.2 and §11.13 (G5, G7, G12) for tennis, this document wins. **Cycle 1:** [`2026-10-15-phase-8-cricket-3d-design.md`](2026-10-15-phase-8-cricket-3d-design.md) built the shared 3D groundwork this game reuses. Its decisions B1–B6 and B8–B10 carry over unless this document says otherwise. Badminton is cycle 3.

---

## 1. Goal (in plain words)

Turn "Return of Serve" into a proper game of tennis in 3D. Yash serves one real service game against you on a floodlit centre court. The score runs 15, 30, 40, GAME. Each point is a short rally, and Yash always wins the game, but you can earn up to two points.

**The owner's two biggest asks:**
1. **Keep it simple.** Use the fewest moving parts and no extras. When in doubt, leave it out.
2. **Every shot looks smooth and clean, like a real tennis match.** This covers Yash's shots and yours. It is the measure the moves are judged by (§5).

**Done means:**
1. Tennis always plays in 3D on desktop and phones, after a short loader.
2. One real service game is played to GAME YASH (§3). The saved score, the Full Time grade and the reveals keep working.
3. The serve, forehand, backhand and footwork look like real tennis. Yash approves the moves on their own before the game is built on them (§5.4), and again in the finished game.
4. Lighthouse gates hold on the first load of `/arena/tennis`: desktop performance at least 90, phone at least 80, with the 3D numbers reported only (cycle 1 §9.1).
5. Yash picks every new sound by ear from 2–3 free options each (§6.5).
6. Yash plays it and approves the feel.

## 2. Decisions from the brainstorm (2026-10-16)

| # | Question | Decision |
|---|---|---|
| T1 | What the visitor does | A proper game of tennis: real points (15, 30, 40, GAME). Yash serves, and you play the points. |
| T2 | Your points | You can win **at most 2 points** (you reach 30 at most). The closest game is 40–30 and there is never deuce. Yash always wins the game (B1). |
| T3 | Rally length | **At most 4 shots per point, counting the serve:** Yash's serve, your return, Yash's shot, your shot. |
| T4 | How you win a point | **Skill.** You win the point if you play both your shots well (right side, in time) and you have fewer than 2 points. Once you have 30, your best shot lands **just OUT**: Hawk-Eye shows it, and the point is Yash's. |
| T5 | Reveals | On **Yash's** points: 15 unlocks QF, 30 unlocks SF, 40 unlocks FINAL. At GAME, all three are on the big screen. Every game shows all three, because Yash always reaches 40. |
| T6 | Controls | **Pick the open side**, the same keys as today: ← / →, a click on a side, or a tap or swipe on the phone. Your player runs to the ball by himself; you choose where your shot goes. The open side is the one away from Yash. |
| T7 | Handedness | Yash plays right-handed. Your player is right-handed too. |
| T8 | 2D backup | **Today's 2D tennis game stays exactly as it is** (3 serves, today's rules). It is used only for reduced motion, no WebGL, or a failed download (cycle 1 §6.2). |
| T9 | Smoothness | Shots must look smooth and clean, like a real match (§5). The moves get their own owner checkpoint. |
| T10 | Sounds | Yash chooses each new sound from 2–3 free recordings (§6.5). |

## 3. The game

### 3.1 One point (at most 4 shots)

1. **The routine** (about 2.5 s; shorter on the first point).
   - Yash walks to the baseline: the right of the centre mark on even points (the deuce court) and the left on odd points (the ad court), as in real tennis.
   - He bounces the ball two or three times. The crowd goes quiet. Your player sets in the ready stance.
2. **The serve.** Yash tosses with his left hand, sweeps the racket behind him and serves. The serve bounces in the service box diagonally opposite.
3. **Your return (input 1).**
   - The moment Yash hits, he drifts to one side of his court. The other side is the **open side**, shown three ways: by where he stands, by a soft volt glow on that half of his court, and by the lit aim button.
   - Your player split-steps, then moves to the ball by himself, forehand or backhand.
   - You press ← or → for where your return goes.
4. **Yash's shot (shot 3).** After a good return, Yash runs to it and hits back. He drifts to one side again and a new open side appears.
5. **Your shot (input 2).** You pick again, with a little more time than on the serve (the rally ball is slower).
6. **The end of the point.** The call, the commentary (desktop) and the applause. The score updates and any project unlocks. The players walk back to their places for the next point while the call shows.

### 3.2 How a point ends

Every point ends within 4 shots. "Late" means no pick by the time the ball reaches your player. "Early" means a pick before Yash's hit.

| What happened | Shots | Point | Call | What you see |
|---|---|---|---|---|
| Input 1 late | 1 | Yash | **ACE.** | The serve goes past your outstretched racket. |
| Input 1 early | 1 | Yash | **TOO EARLY.** | You swing too soon; the serve goes past you. |
| Input 1 wrong side | 3 | Yash | **WRONG SIDE.** | Your return goes straight to Yash; his shot is a winner into the open court. |
| Input 2 late | 3 | Yash | **TOO LATE.** | Yash's shot goes past you as you stretch for it. |
| Input 2 early | 3 | Yash | **TOO EARLY.** | You swing too soon; Yash's shot goes past you. |
| Input 2 wrong side | 4 | Yash | **WRONG SIDE.** | He had that side covered: you go for too much and your shot hits the net. |
| Both good, you have under 30 | 4 | **You** | **WINNER.** | Your shot lands in the open court, out of his reach. |
| Both good, you already have 30 | 4 | Yash | **OUT.** | Your shot lands just beyond the line. A Hawk-Eye mark shows the bounce a few centimetres out. |

**Good** means the right side in time. **Perfect** means the right side within the first 40% of the window (`PERFECT_SHARE`, as today). A perfect shot is hit a little harder and deeper, but it decides nothing more than a good one.

### 3.3 The game

- **The score bug** shows real tennis points: YASH first (as today), then 0, 15, 30, 40.
- **The status** reads `POINT n` while play is on, `GAME POINT` when Yash is at 40, and `GAME YASH` at the end.
- **4 to 6 points.** With no input at all, Yash wins on four aces, 40–0. The best you can do is win 2 points, for 40–30.
- **It gets harder.** Your time to react shrinks as Yash's score rises, and his serve gets faster on the speed gun:

| Yash's score before the point | 0 | 15 | 30 | 40 |
|---|---|---|---|---|
| Serve: window from his hit to your contact | 1000 ms | 900 ms | 800 ms | 700 ms |
| His rally shot: window | 1100 ms | 1000 ms | 900 ms | 800 ms |
| Serve speed on the gun | 178 km/h | 184 km/h | 190 km/h | 196 km/h |

  - On the phone every window is 25% longer (`TOUCH_STRETCH`, as today). The ball in the scene simply flies 25% slower there.
  - **The window is the ball's flight time**, from Yash's contact to your player's contact. What you see is what is judged.
- **Length.** About 25 s (four aces) to about 50 s (six full points), plus the arrival beat and the verdict.
- **The end.** After the last point, the call holds for `VERDICT_MS` (2 s), then the end buttons appear, as today. Yash gives a small fist pump at GAME.
- **What is saved** (as soon as GAME is known):
  - the score `GAME YASH`, as today
  - the perfect share: your perfect inputs ÷ your inputs, as Full Time already reads it (F4)

### 3.4 Reveals

- Yash's points unlock the projects in round order (`getHighlights`): QF at 15, SF at 30 and FINAL at 40.
- Each unlock shows as today:
  - the courtside card on the stage, with the cards alternating sides and the third moving up
  - the reveal chip on the phone
  - the LED marquee line
  - the progress bars, which now count unlocked projects
- At GAME the marquee reads ALL THREE ON THE BIG SCREEN.
- Your own points unlock nothing; they only change the score.

### 3.5 Controls

| Action | Keyboard | Mouse / touch |
|---|---|---|
| Send your shot left | ← | Click the LEFT aim button (stage); tap the ← half or swipe left (phone) |
| Send your shot right | → | Click the RIGHT aim button (stage); tap the → half or swipe right (phone) |

- **One input per shot.** The first pick after Yash's hit counts; key repeats and double taps do nothing more (G3's key rules stand).
- **Desktop.** The two aim buttons sit together low in the centre of the stage, above the progress bars, because the 3D court does not line up with the 2D board's spots. The open one is lit. On the phone, the thumb zone's big ← / → halves stay as they are.
- **Copy.** All new labels and lines come from `ui` content (parent §1).

### 3.6 What stays exactly as today

- The page frame, SKIP and Quick View, the breadcrumb, the instructions panel, the score bug's look, the courtside cards, the LED marquee, the end buttons, the announcer and the saved record.
- **The 2D game is untouched:** `TennisScreen`, its referee, its view and its tests. It plays only as the backup (T8).
- **While the 3D game is on screen,** the 2D court art and the tracers, tracking ring and serving tag drawn at board spots are hidden. The serving line (`YASH · SERVING · 190 KM/H`) moves to a fixed HUD spot as the speed gun.

## 4. Rules (pure, 3D only)

- **Where it lives.** The 3D game's rules live in their own small file, `tennis/3d/match.ts`, a plain module with no React and no three.js. The 2D referee is not changed (T8).
- **The state:**
  - Yash's points, your points, and the points played
  - each input's quality and call
  - the point in play (its open sides, drawn at random when each of Yash's hits happens, as `newServe` draws today)
- **`playPoint`.** It takes the point's inputs (1 or 2 picks, each `{ side, atMs }` measured from Yash's hit, as today) and returns the point's result: the winner, the call, the shots played (1, 3 or 4), and what unlocked.
- **Unit-tested guarantees:**
  - Yash wins every game.
  - You never pass 30.
  - No point has more than 4 shots.
  - A point is yours only if both inputs are good or perfect and you had fewer than 2 points.
  - The projects unlock at Yash's 15, 30 and 40, in round order.
  - The windows and speeds follow the §3.3 table.
- **Reused constants.** `PERFECT_SHARE` and `TOUCH_STRETCH` are imported from the 2D referee, not copied.

## 5. Shots that look real (owner requirement)

The moves are the heart of this game. They are built and approved before the game is wired to them.

### 5.1 The moves

| Move | Who | Made from |
|---|---|---|
| Ready stance (knees bent, racket in front, small sway) | both | key poses, looped |
| Split-step (a small hop as the opponent hits) | both | key poses |
| Side shuffle and recovery to the middle | both | key poses |
| Run to the ball | both | the free Jog / Sprint clips, matched to ground speed |
| Walk back between points | both | the free Walk clip |
| Ball bounces before the serve | Yash | key poses |
| Serve (toss, trophy position, racket drop, contact at full reach, follow-through landing inside the court) | Yash | key poses |
| Forehand (unit turn, backswing, forward swing, contact in front, follow-through over the shoulder) | both | key poses |
| Backhand, two-handed (the same phases) | both | key poses |
| Stretch and miss (beaten by the ball) | you | key poses |
| Fist pump at GAME | Yash | key poses |

No new model files are needed. `moves.glb` already holds idle, walk, jog and sprint, and every tennis move is made in code with the existing `poseClip`.

### 5.2 What "smooth and clean" means here (each is checked)

1. **Whole-body poses.** Every stroke has 6–8 key poses that follow the real phases of the stroke. Feet, hips, trunk turn, both shoulders and arms, and the head all move; it is never the arm alone. The head stays on the ball through contact.
2. **No snaps.** The poses are joined by the smooth curves cycle 1 built (monotone cubic, 30 keys a second, easing in and out, no overshoot). Run, swing and recovery hand over through crossfades (`CROSSFADE_S` or longer), so no pose ever jumps.
3. **The racket meets the ball.** Each stroke has a measured contact time and a measured sweet-spot position (like cricket's `SHOT_CONTACT`). The swing is started so contact lands exactly when the ball arrives, and the ball's path passes through the racket's sweet spot at that moment. On a miss, the ball visibly passes the racket.
4. **Feet that don't slide.** A player's run is planned to reach the hitting spot about 0.15 s before contact, then plant. The run clip's stride matches the ground speed. After the shot, the player recovers with a side shuffle toward the middle.
5. **The right stroke for the ball.** Forehand when the ball comes to the player's right (both players are right-handed), backhand when it comes to the left, chosen from where the ball will be at contact.
6. **A real-looking racket.** The racket is built in code and held in the right hand, with the left hand added on the two-handed backhand. Its head follows the swing's arc, and the strings face the ball at contact.
7. **Real ball flight** (§5.3).

### 5.3 Ball flight (our own maths, no engine)

- Gravity, plus a little extra dip for topspin on rally shots; serves fly flat. Every shot clears the net (0.914 m in the middle) by at least 0.15 m.
- The hard-court bounce keeps about 75% of the up-and-down speed and about 60% of the forward speed.
- Each shot is solved from where it is hit, where it must bounce and how long it must take (the window). The solver checks net clearance and that the bounce is in (or, for OUT, a few centimetres out).
- The ball keeps a small shadow on the court. The Hawk-Eye mark is a small ellipse left at the bounce of an OUT ball until the next point.

### 5.4 The moves checkpoint (owner)

When the moves are built, and before the game is wired to them, Yash sees each move on its own in a dev-only Pose Lab story (as cricket had), and a short screen recording of a full four-shot point. He approves them or asks for changes. That task runs on an Opus builder at high effort (owner allowance).

## 6. Technical design

### 6.1 Reused from cycle 1 (unchanged)

- `three` and `@react-three/fiber` (no new libraries)
- `useThreeGate` and the loader
- `GameCanvas`, the two settings (stage and column), `athlete` and `kitMaterial`
- `poseClip`, and `track` / `sampleTrack` (the scene is a pure function of time; a point is a shotlist)
- the sound system with its mute toggle, and the speed gate

### 6.2 Lifted from cricket into `three/` (no copied code)

Pieces tennis needs that are cricket-only today move into `src/features/games/three/`. Cricket switches to them with no visible change, and its tests stay green:
- **The download once per visit** (today's `pending` / `progressTo` in `CricketGame`) becomes `loadOnce`.
- **The 3D screen plumbing** in `Cricket3DScreen` moves to a shared hook: shown, drawn, the show timeout, the stadium hum while on screen, and the boundary-wrapped scene element.
- **The shared stadium parts** in `Stadium.tsx`: the instanced crowd, the floodlight rig, and the shared asset loading for body, skin and moves (the cricket-only parts stay in cricket).
- **Optional shorts length in `Kit`.** Cricket keeps trousers to the ankle; tennis ends the shorts above the knee, with skin below and white shoes. One uniform, one shader program.

### 6.3 New for tennis

- `src/features/games/tennis/3d/`:
  - `match.ts`: the rules (§4)
  - `court.ts`: court sizes, players' places, the camera
  - `ball.ts`: the flight solver (§5.3)
  - `rally.ts`: plans one point's shots from the rules' result (where each ball goes, which stroke, the run paths; random variety drawn once at the point's start, so it is remount-safe)
  - `moves.ts`: the key poses (§5.1)
  - `sequence.ts`: a point's shotlist and cues
  - `props.ts`: the rackets, ball, net and posts
  - `Arena.tsx`: the court, lines, stands, crowd, lights and the volt glow on the open side
  - `Players.tsx`
  - `scene.tsx`: the lazy entry, with `loadTennisAssets` and `TennisScene`
  - `PoseLab.stories.tsx`: dev only
- `tennis/Tennis3DScreen.tsx`: the game loop.
- `tennis/TennisGame.tsx`: chooses 3D or the 2D backup, as `CricketGame` does.
- A 3D view builder beside `buildTennisView`, sharing its pieces (chrome, cards, marquee, end).
- `TennisPage`, `TennisStage` and `TennisColumn` gain a `three` prop, as cricket's did.
- `app/routes/arena.tennis.tsx` renders `TennisGame`.
- **The look.**
  - **Court:** a dark blue hard court (`--ref-court-hard`) with white lines, the net and posts, the stands with the instanced crowd, and floodlights.
  - **Players:** only two, Yash and you; no ball kids or umpire. Yash wears the dark kit with volt trims; you wear a light kit. Both wear shorts.
- **The camera.** The broadcast view: high behind your baseline, looking down the court. It pans gently with the ball and stays in the TV view throughout; there are no cuts and no replays. At GAME it pushes slowly toward Yash. Like cricket, it is framed separately for the stage and the column.
- **Bundle.** three.js and the scene come only through the dynamic import, never in a first load (the smoke test's `THREE.WebGLRenderer` check covers `/arena/tennis` too). The model files are cricket's, so a visitor who played cricket already has them cached.

### 6.4 Desktop and phone

These are cycle 1's settings (§6.3 there): the pixel ratio cap 2 / 1.5, one shadow-casting floodlight or soft blobs, the full or half crowd, and a framing per layout. A short buzz (`navigator.vibrate`) marks each of your hits on the phone.

### 6.5 Sound (owner picks by ear)

- **How the options are chosen.** For each new sound, a builder gathers **2–3 CC0 recordings** (freesound HQ previews, as cycle 1 did) into a listening folder named `hit-1.mp3`, `hit-2.mp3` and so on. Yash listens and picks. Only his picks are trimmed, normalised, shipped in `public/audio/` and credited in `CREDITS.md`.

| Sound | When | Options |
|---|---|---|
| `hit` | every racket contact (serve slightly louder) | 3 recordings of a tennis ball off strings |
| `bounce` | the ball on the hard court | 3 recordings |
| `applause` | after each point (polite tennis applause) | 2–3 recordings (today's `crowd.mp3` can be one) |
| `ooh` | the OUT call | today's `ooh.mp3` plus 1–2 new ones |
| `hush` | the quiet hum under the 3D game | today's `murmur.mp3` plus 1–2 tennis-crowd ones |
| `cheer` | GAME | today's `cheer.mp3` (reused) |

- **Rhythm in sound.** The crowd hushes for the serve routine, there is silence through the rally except the hits and bounces, and applause comes after the point.
- **Loading.** The recordings are fetched ahead and decoded on the first gesture. Until then, or if a file fails to load, the code-made sound plays (the `net` / `bounce` recipes), as cycle 1 does.

### 6.6 Edge cases

- **Tab hidden.** The point in play is dropped and replayed fresh from the routine, and the score does not change (G2). The scene pauses.
- **Resize across 1200px.** The game continues; the canvas and settings follow from the next point.
- **Leaving the page** disposes everything; the cached files stay.
- **Rematch** is instant, and the score goes back to 0–0.
- **Accessibility:**
  - The canvas is `aria-hidden`.
  - Each point's call, the new score and any unlock are announced, for example "Winner. 0–15." or "Ace. 15–0. Highlight 01 unlocked: …".
  - The aim buttons are real buttons with 44px targets and accessible names saying which side is open.
  - Keys work everywhere (A8).

## 7. Copy (derived, flagged for the copy review)

- **Loader:** `PREPARING THE COURT`.
- **Calls:**
  - reused: `ACE.`, `TOO EARLY.`, `WRONG SIDE.`
  - new: `TOO LATE.`, `WINNER.` (volt), `OUT.`
- **Status:** `POINT n`, `GAME POINT`, and `GAME YASH` (reused).
- **How:** "Pick the open side as he hits."
- **Progress:** `HIS POINTS UNLOCK THE HIGHLIGHTS`.
- **Commentary** (desktop, one line per point):

| Moment | Line |
|---|---|
| Yash's point that unlocks a project | "Another project shipped. He's not letting up." (drawn, reused) |
| Your point | "Your point. He'll remember that." |
| OUT | "Hawk-Eye says out. By a whisker." |
| Game point | "Game point. He's done this before." (from the drawn "Match point" line) |
| An ace or a miss | "Ace. The project ships anyway." (reused) |
| GAME | "Game, Yash. Still undefeated." |

- These go into `docs/launch/copy-review.md`.

## 8. Testing (lean)

- **Unit:**
  - `match.ts`: the §4 guarantees.
  - `ball.ts`: net clearance, in and out by the right margin, flight time equals the window.
  - `rally.ts`: the ball is at the racket's sweet spot at each contact, the right stroke for the side, and runs arrive before contact.
- **Browser (e2e), on the fake clock:**
  - 3D on desktop and on the phone: the loader, then the canvas; a full game to the end; GAME YASH saved; the reveals show.
  - With perfect inputs the score reaches 40–30.
  - With no input, four aces.
- **The 2D backup.** The existing tennis tests keep running with WebGL off and stay green unchanged.
- **Lighthouse.** `/arena/tennis` first load is gated (WebGL off): desktop at least 90, phone at least 80. The 3D runs are reported only.
- **Yash:**
  - approves the moves (§5.4)
  - picks the sounds (§6.5)
  - plays the game on his laptop and phone

## 9. Out of scope (this cycle)

- Badminton (cycle 3).
- Deuce, sets, a visitor-win ending, the visitor serving.
- Replays, camera cuts, slow motion, ball kids, an umpire, line judges' voices.
- Player faces or likeness.
- Any paid asset or tool.
- Changes to the 2D tennis game.
