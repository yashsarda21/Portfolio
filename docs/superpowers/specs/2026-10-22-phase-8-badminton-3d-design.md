# Phase 8, cycle 3 — 3D Badminton — Design

**Date:** 2026-10-22 · **Owner:** Yash Sarda · **Status:** Draft for review

**Parent spec:** [`2026-10-03-arena-portfolio-design.md`](2026-10-03-arena-portfolio-design.md). This document changes only the badminton game (`/arena/badminton`). Where it differs from the parent's §8, §8.3 and §11.13 (G3, G6, G7, G8, G10, G11), or from §11.14 F2 and F4, for badminton, this document wins. **Cycles 1 and 2:** [`2026-10-15-phase-8-cricket-3d-design.md`](2026-10-15-phase-8-cricket-3d-design.md) built the shared 3D groundwork. [`2026-10-16-phase-8-tennis-3d-design.md`](2026-10-16-phase-8-tennis-3d-design.md) built a real rally game on it. Their decisions carry over unless this document says otherwise. Badminton is the last game of Phase 8.

---

## 1. Goal (in plain words)

Turn "Smash or Clear" into a real game of badminton in 3D. It is the end of a singles game in an indoor hall. You lead 19–17, and Yash comes back to win. Each rally is short and real: high serves, smashes, drops, dives and Yash's net play. Yash always wins the game. You can win one rally, by skill, and reach 20.

**The owner's asks, most important first:**
1. **It must look and feel real, as real as the 3D tennis.** Players move smoothly to the shuttle and hit it cleanly. The shuttle flies like a real shuttle (§5).
2. **Yash's dive.** When you play a good short shot, Yash dives full length to get it back. It is the game's highlight shot.
3. **Yash's best skills show on his best shots.** Each skill card unlocks on the shot printed on it (§3.5). This includes one or two hard jump smashes.
4. **Keep it simple.** Use the fewest moving parts and no extras. When in doubt, leave it out.

**Done means:**
1. Badminton always plays in 3D on desktop and phones, after a short loader.
2. One real game ending is played to GAME YASH: 21–19, or 22–20 after 20 all (§3). The saved score, the Full Time grade and the reveals keep working.
3. The footwork, the strokes, the jump smash and the dive look like real badminton. Yash approves the moves on their own before the game is built on them (§5.5), and again in the finished game.
4. Lighthouse gates hold on the first load of `/arena/badminton`: desktop performance at least 90, phone at least 80. The 3D numbers are reported only (cycle 1 §9.1).
5. Yash picks every new sound by ear from 2–3 free options each (§6.5).
6. Yash plays it on his laptop and phone and approves the feel.

## 2. Decisions from the brainstorm (2026-10-22)

| # | Question | Decision |
|---|---|---|
| D1 | What the visitor does | A real end of a badminton game. You play the rallies against Yash. Singles. |
| D2 | Your points | You start on 19 and can reach **20 at most**: you can win one rally. Yash always wins the game (B1). |
| D3 | How the game ends | **Real rules.** If you never reach 20, Yash wins **21–19**. If you reach 20, the game goes to 20 all (deuce), and Yash wins **22–20**. |
| D4 | How you win a rally | **Skill.** Both your picks in a rally are good (the lit button, in time). Once you are on 20, your best shot lands **just OUT** (Hawk-Eye), as in tennis, but only once a game. After that, Yash reads your good shots (§3.2), so that he still wins his rallies with his own shots (D7). |
| D5 | Controls | **Deep (↑) or short (↓)**, once each time the shuttle comes to you: **↑ SMASH** or **↓ DROP** (§3.6). The smart one is lit. Yash approved the mockup (desktop and phone). After the builder check, Yash chose **no low shots**: every pick is on a high shuttle, so the mockup's LIFT / NET state is dropped. |
| D6 | Yash's dive | When your short shot beats him, Yash dives full length to get it back (owner's idea). |
| D7 | Reveals | Each of Yash's rally wins unlocks the next skill card in content order. **He wins that rally with the shot printed on the card:** Backend with a smash, Frontend with a drop shot, Data with defence (the dive), Craft with court vision (a placement). The one exception is the single OUT rally (§3.2). |
| D8 | Smashes | Yash plays 1–2 hard jump smashes: the Backend rally, plus the final rally after 20 all. |
| D9 | Handedness | Yash is right-handed. Your player is right-handed too. |
| D10 | 2D backup | **Today's 2D badminton game stays exactly as it is** (4 rallies, the power meter). It is used only for reduced motion, no WebGL, or a failed download (cycle 1 §6.2). |
| D11 | Smoothness | Every move looks smooth and clean, like a real match (§5). The moves get their own owner checkpoint. |
| D12 | Sounds | Yash chooses each new sound from 2–3 free recordings (§6.5). |

## 3. The game

### 3.1 Words used here

- **Pick:** your one input when the shuttle comes to you, deep (↑) or short (↓).
- **Your shots:** every shuttle that reaches you for a pick is high, and you hit it from above your head. Your buttons are always **↑ SMASH** (deep and hard) and **↓ DROP** (short and soft). There are no low shots by the net for you (owner's choice after the builder check: a real net exchange is too quick for a fair pick window, and fewer moves means more polish).
- **The open part:** the part of Yash's court he is not covering. As each of his shots leaves his racket, Yash sets either **forward** (the back is open, so ↑ is the smart pick) or **back** (the front is open, so ↓ is the smart pick). Which one is drawn at random for each of his shots, as tennis draws the open side, except where §3.3 fixes it.
- **Good:** the lit button, in time. **Perfect:** the lit button within the first 40% of the window (`PERFECT_SHARE`, as tennis). A perfect shot is a little crisper, but it decides nothing more than a good one.
- **Wrong:** the dim button, in time. **Late:** no pick by the end of the window. **Early:** a pick before Yash's hit.

### 3.2 One rally (at most 2 picks, at most 6 shots)

1. **The routine** (about 2 s; shorter on the first rally).
   - The server walks to the right service box when their score is even and to the left box when it is odd. The receiver stands in the box diagonally opposite. These are real singles rules.
   - Yash serves the first rally (his score is 17, so he serves from his left box). After that, **whoever won the last rally serves**.
   - The crowd goes quiet. Both players settle into the ready stance.
2. **The serve.** Badminton serves are hit underarm, with the contact below 1.15 m (the real rule).
   - **Yash serves high and deep**, the classic singles high serve, every time.
   - **You serve automatically** (no input) in the rally after your point. It is a high serve, and Yash returns it with a high clear.
3. **Pick 1.** The high shuttle comes to you. Yash sets forward or back, the smart button lights, and you pick.
4. **What pick 1 does** (the Data rally is set up differently, §3.3):
   - **Good, on 20, once the OUT is used or on the final rally** (step 6): **he read it.** He moved before you hit, takes your shot comfortably and finishes with the card's shot. There is no pick 2. Call: **HE READ IT.** Without this, a strong player on 20 would see OUT after OUT, and Yash's skill shots would never show.
   - **Good, otherwise:** your shot beats him.
     - A drop: Yash **dives** forward and scoops it back.
     - A smash: Yash dives to the side and digs it up.
     - Either way the shuttle comes back high to the middle of your court, and you get **pick 2**.
   - **Wrong:** your shot goes where he is waiting. He finishes the rally with the card's shot (§3.5).
   - **Late or early:** your player mistimes it and hits it off the frame. The shuttle floats up weakly, and he finishes with the card's shot.
5. **Pick 2** (only after a good pick 1 that beat him; never in the Data rally). It is always a high shuttle.
   - Yash is on the floor after his dive, so the court behind him is open and ↑ SMASH is lit.
6. **What pick 2 does:**
   - **Good, and you are on 19:** **your point.** Your shot lands in the empty court. Call: **WINNER.**
   - **Good, and you are on 20:** your shot lands **just out**, a few centimetres long or wide. The Hawk-Eye mark shows it. Yash's point. Call: **OUT.** This happens at most once a game, and only while a card is left to charge (Yash's wins 1 to 4), never on the final rally at 21–20, which is always his smash. Its rally still charges the next card (as tennis's OUT point unlocked a project), and the commentary says so ("Hawk-Eye says out. Backend charged anyway.").
   - **Wrong, late or early:** your shot is weak or goes where he is. He is back up in time and finishes with the card's shot. A weak pick-2 shot always gives him time to get up from a dive (about 1 s).
7. **The end of the rally.** The call, the commentary (desktop) and the applause play. The score updates and any card unlocks. The players walk to their places for the next rally while the call shows.

### 3.3 How each rally of Yash's is won

| What happened | Shots (Yash serving) | Rally | What you see |
|---|---|---|---|
| Pick 1 wrong, late or early | 3 | Yash | His card's shot wins it at once. |
| Pick 1 good, on 20, once the OUT is used or on the final rally | 3 (5 in a smash rally) | Yash | HE READ IT: he is already there and wins with his card's shot. |
| Pick 1 good, pick 2 not good | 5 | Yash | He dives, gets up, and wins with his card's shot. |
| Both good, you are on 19 | 4 | **You** | Your shot lands in the open court while he is down. |
| Both good, you are on 20, the first time | 4 | Yash | OUT by a whisker (Hawk-Eye). The next card still charges. |

When you serve, every rally has one shot more, so a rally can have up to 6 shots.

**The Data rally** (until Yash's 3rd rally win, the defence card) is set up so the dive almost always happens. It has **no pick 2**: the dive's scoop is the winner.
- Yash sets **back** for your pick 1, so ↓ DROP is lit.
- **Good drop** (at any score): he dives and scoops it tight over the net, out of your reach. It is his rally, won from the floor. You cannot win the Data rally, but you see the dive.
- **Late or early:** the framed shuttle dribbles just over the net instead of floating. He dives and scoops it the same way.
- **Wrong (a smash):** it comes straight at him, and he blocks it dead at the net. That is defence too, so the card still unlocks, but there is no dive. You chose the dim button.
- The dive also happens in the other rallies, whenever your good short shot or good smash stretches him (§3.2). That is where your own point can come from, smashing into the court he has left.

**The smash rallies** (until Yash's 1st win, the Backend card, and the final rally at 21–20) are set up so his jump smash always comes, because nobody can smash a shuttle that is low or one that is already a smash:
- Yash sets **forward** for your pick 1, so ↑ SMASH is lit.
- **Every not-good shot of yours floats up into the middle of the court** (a loose drop that sits up, or a framed shot), whatever you pressed. He jumps and smashes it. This applies to pick 1 and to pick 2.
- **HE READ IT** in a smash rally: he blocks your good smash to the net, your lift back is weak (automatic, no pick), and he jump smashes it. That is 5 shots.
- So every game shows at least one jump smash: the Backend smash, unless the one OUT charged Backend, and in that case you reached 20, so the game goes to the final rally and its smash.

### 3.4 The game

- **The score bug** shows real badminton points, YASH first (as today): it starts at **17–19**.
- **The status** reads:
  - `RALLY n` while play is on
  - `MATCH POINT` when Yash is one point from winning (20–19 or 21–20), with the corrected chip (A4)
  - `YOUR MATCH POINT` when you are on 20 and Yash is under 20 (derived)
  - `20 ALL` at 20–20, as the umpire calls it (derived)
  - `GAME YASH` at the end
- **4 to 6 rallies.**
  - With no input at all, Yash wins 4 in a row: 21–19.
  - If you win a rally, you reach 20. Yash then needs two more wins after 20 all, and wins 22–20 in 6 rallies.
- **It gets harder.** Your time to react shrinks with every rally Yash has won. These are starting values. They are tuned at the moves checkpoint, but each shuttle's flight must stay realistic:

| Yash's rally wins so far | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| Pick 1: window from his hit | 1300 ms | 1200 ms | 1100 ms | 1000 ms | 900 ms |
| Pick 2: window from his scoop | 1000 ms | 950 ms | 900 ms | 850 ms | 800 ms |

  - On the phone every window is 25% longer (`TOUCH_STRETCH`, as tennis). The shuttle simply flies 25% slower there.
  - **The window runs from Yash's contact until your forward swing must start**, 0.2 s before your racket meets the shuttle (`SWING_LEAD`, as tennis). What you see is what is judged.
- **The speed gun.** Yash's smashes show on the speed gun, the HUD line tennis uses for its serves (`YASH · SMASH · 348 KM/H`). Starting values are 348 km/h for the Backend smash and 365 km/h for the final smash. Nothing else shows a speed.
- **Length.** About 30 s (four quick rallies) to about 50 s (six rallies), plus the arrival and the verdict.
- **The end.** After the last rally the call holds for `VERDICT_MS` (2 s), and then the end buttons appear, as today. Yash gives a small fist pump at GAME, and the camera pushes slowly toward him.
- **What is saved** (as soon as GAME is known):
  - the **real final score**, `21–19` or `22–20`. The Hub shows it as `PLAYED · 22–20`. This replaces F2's single `21–19` for the 3D game; the 2D backup still saves `21–19`.
  - the perfect share: your perfect picks ÷ your picks, as tennis saves it for Full Time (F4)

### 3.5 Reveals

- Yash's rally wins unlock the skill groups in content order (`getAttributeGroups`):
  1. **Backend**, on his 1st win, with a **smash**: a jump smash with the scissor kick from a floating shuttle (the smash rally, §3.3).
  2. **Frontend**, on his 2nd win, with a **drop shot**: a slow drop from the back that dies at the net, or a tumbling net shot.
  3. **Data**, on his 3rd win, with **defence**: the dive, set up as §3.3 says.
  4. **Craft**, on his 4th win, with **court vision**: a placement into the corner you are furthest from, usually cross-court.
  5. After 20 all only, his **5th win** (22–20) is the second jump smash. It unlocks nothing new; all four cards are already charged.
- Each unlock shows as today: the attribute toast on the stage (the group's shot and its **shipped** skills as chips), the reveal chip on the phone, and the announcer. Upcoming groups never read LOCKED (§11.2 #24). Rally numbers can shift when you win a rally, so the next group reads `UP NEXT` and the later ones show only their shot name (derived).
- Your own rally unlocks nothing; it only changes the score.

### 3.6 Controls

| Action | Keyboard | Mouse / touch |
|---|---|---|
| Send it deep: SMASH | ↑ | Click the ↑ button (stage). Tap the ↑ button, or swipe up on the court (phone). |
| Send it short: DROP | ↓ | Click the ↓ button (stage). Tap the ↓ button, or swipe down on the court (phone). |

- **Desktop.** The two buttons sit together low in the centre of the stage, in tennis's place above the progress bars. Each button shows its arrow and the shot: `↓ DROP` and `↑ SMASH`. The smart one is lit and reads `OPEN COURT`. A hint underneath reads `↑ ↓ OR CLICK`.
- **Phone.** The same two buttons sit side by side at the bottom, in tennis's thumb zone, at 56px or taller. The swipe counts only while a pick is open. Like tennis's sideways swipe, it is touch or pen only: more than 40px, and more up or down than across. How it lives with page scrolling (for example `touch-action` on the court only while a pick is open) is the builder's call, but it must never block scrolling outside a pick.
- **One pick per shot.** The first pick after Yash's hit counts. Key repeats and double taps do nothing more (G3's key rules stand). Between picks the buttons are `aria-disabled`, not `disabled`, so a keyboard pick keeps the focus.
- **Copy.** All new labels and lines come from `ui` content (parent §1).

### 3.7 What stays exactly as today

- The page frame, SKIP and Quick View, the breadcrumb, the instructions panel, the score bug's look, the attribute toasts, the reveal chip, the end buttons, the announcer and the saved record.
- **The 2D game is untouched:** `BadmintonScreen`, its referee, its view and its tests. It plays only as the backup (D10).
- **While the 3D game is on screen,** the 2D hall art is hidden, along with the power meter, the HOLD button, the tracking rings, the tags and the tracer drawn at board spots. The 2D's `YASH · READING YOUR GRIP` line becomes the 3D's speed-gun line (§3.4), in tennis's HUD spot.

## 4. Rules (pure, 3D only)

- **Where it lives.** The 3D game's rules live in their own small file, `badminton/3d/match.ts`: a plain module with no React and no three.js. The 2D referee is not changed (D10).
- **The state:**
  - Yash's points, your points, and the rallies played
  - who serves next
  - each pick's quality and call
  - the cards charged
  - the rally in play: where Yash sets for each of his shots (drawn at random when each hit happens, except as §3.3 fixes it)
- **`playRally`.** It takes the rally's picks (1 or 2, each `{ dir, atMs }` measured from Yash's hit) and returns the rally's result: the winner, the call, the shots played (3 to 6), the card unlocked (if any), the new score and the next server.
- **Unit-tested guarantees:**
  - Yash wins every game.
  - You never pass 20.
  - The final score is 21–19 or 22–20, and every score on the way is reachable under real rules.
  - No rally has more than 2 picks or more than 6 shots.
  - A rally is yours only if both picks are good or perfect, you are on 19, and it is not the Data rally.
  - OUT happens at most once a game, only on Yash's wins 1 to 4. After it, and on the final rally, a good pick 1 on 20 is HE READ IT.
  - The Backend rally and the final rally start high with Yash set forward, and end on his jump smash (except a Backend rally charged by the one OUT). Every game has at least one jump smash.
  - Yash's rally wins 1 to 4 unlock Backend, Frontend, Data and Craft, in that order. Each is won with its card's shot, except the one OUT rally.
  - The Data rally has no pick 2. Its dive happens on a good, late or early pick 1.
  - A 5th win happens only after 20 all, and it is a smash.
  - The server and the service box follow real rules: the winner of the last rally serves, from the right box on an even score and the left on an odd one.
  - The Data rally starts high with Yash set back.
  - The windows follow the §3.4 table.
- **Reused constants.** `PERFECT_SHARE` and `TOUCH_STRETCH` are imported, not copied. So are tennis's `SWING_LEAD` and its pick-judging, or their shared home if the plan lifts them (§6.2).

## 5. Shots that look real (owner requirement)

The moves are the heart of this game, as in tennis. They are built and approved before the game is wired to them.

### 5.1 The court and the hall (real sizes)

- **Court:** 13.40 m long. The singles width is 5.18 m, and the doubles lines are drawn too (6.10 m), as on every real court. The short service line is 1.98 m from the net, and the doubles long service line is 0.76 m inside the back line. There is a centre line, and the lines are 40 mm wide.
- **Net:** 1.524 m at the centre and 1.55 m at the posts, with a white tape. The posts stand on the doubles sidelines.
- **Hall:**
  - a green court mat on a dark hall floor, with white lines
  - low LED boards around the court, carrying the site's volt band (like tennis's walls)
  - stands with the shared instanced crowd (half the crowd on phones)
  - lights in the ceiling, with no floodlight masts
  - The colours come from the site's tokens: `--hall` for the surround and `--ref-court-hall` as the starting court colour. The builder may tune toward a real BWF green within the dark style.

### 5.2 The moves

| Move | Who | Notes |
|---|---|---|
| Ready stance (racket up in front, weight forward, small sway) | both | key poses, looped |
| Split step (a small hop as the opponent hits) | both | key poses |
| Footwork: side shuffle (chassé), the front lunge and push back, the move back to the rear corners | both | key poses; the run clips matched to ground speed for longer moves |
| High serve (forehand, underarm) | both | key poses; contact below 1.15 m |
| Overhead stroke: one preparation (side-on, racket back, the other arm pointing up) for the clear, drop and smash | both | key poses. The shared preparation is real badminton's disguise. |
| Jump smash with the scissor kick | Yash | key poses |
| Standing smash | you | key poses |
| Net shot (from a lunge, for his tumbling drop) | Yash | key poses |
| Lift (underarm) | you | key poses; only your automatic weak lift in a HE READ IT smash rally (§3.3) |
| Block (defence, racket in front) | Yash | key poses |
| **The dive** (launch, full-length flight, landing on the forearms and chest, a short slide, then getting up) | Yash | key poses. One forward dive, turned toward the shuttle (track's `Move.turn`), serves both the short-shot dive and the side dive. |
| Mistimed swing (the frame shot) and stretch-and-miss | you | key poses |
| Walk back between rallies | both | the free Walk clip |
| Fist pump at GAME | Yash | key poses (tennis's can be reused if it fits) |

No new model files are needed. `moves.glb` already holds idle, walk, jog and sprint, and every badminton move is made in code with the existing `poseClip`, as in tennis.

### 5.3 What "smooth and clean" means here (each is checked)

These are tennis's §5.2 rules, applied to badminton:
1. **Whole-body poses.** Every stroke has 6–8 key poses that follow the real phases of the stroke. Feet, hips, trunk turn, both arms and the head all move, never the arm alone. The eyes stay on the shuttle through contact.
2. **No snaps.** The poses are joined by cycle 1's smooth curves. Runs, lunges, swings, the dive and getting up all hand over through crossfades, so no pose ever jumps.
3. **The racket meets the shuttle.** Each stroke has a measured contact time and a measured sweet-spot position (`Reach`, as tennis). The shuttle's path passes through the racket's sweet spot at contact. On a miss it visibly passes the racket.
4. **Feet that don't slide.** Moves are planned to arrive as the forward swing starts and then plant (tennis rulings R13 and R15 apply). A lunge plants the front foot heel first.
5. **The right stroke for the shuttle.** Overhead for a high shuttle, a lunge for a low shuttle at the net, and forehand or backhand from which side the shuttle reaches the body (both players are right-handed).
6. **A real-looking racket.** It is built in code: about 0.665 m long, with a slim shaft and an oval head about 0.23 × 0.20 m. It is held in the right hand with a handshake grip, with the strings facing the shuttle at contact.
7. **Real shuttle flight** (§5.4).

### 5.4 Shuttle flight (our own maths, no engine)

- **The look that must come through:** it shoots off the racket fast, slows sharply in the air, and falls steeply. A clear falls almost straight down at the back line.
- **The maths.** Each shot is solved from where it is hit, where it must land or be met, and how long it must take (the window plus `SWING_LEAD`). The solver is closed-form, so the scene stays a pure function of time and a rebuild never changes the past (as tennis). Gravity with drag that grows with speed is the real physics, and it has no closed form in two directions. **The builder's call** is the closest closed-form stand-in that gives the look above, or a table sampled from the real physics and computed once per shot. Starting point: drag in proportion to speed, with a time constant of about 0.6–0.7 s (a terminal speed of about 6.5 m/s).
- Every shot clears the net tape by at least 0.1 m, except the net shot, which may skim it by a few centimetres. The solver checks that each landing is in (or, for OUT, a few centimetres out).
- **The shuttle turns cork first.** It always points along its flight, cork in front. After each hit it flips cork-first within about 0.06 s (the real turnover). A slow spin about its own axis is optional.
- **The shuttle itself** is built in code: a white cork with a white feather skirt of 16 feathers. It is about 9 cm long, with a skirt about 6.5 cm across. It may be drawn up to 1.6 times real size so it reads on a phone. It has a small soft shadow on the floor. The Hawk-Eye mark is a small ellipse left where an OUT shuttle lands, until the next rally (shared with tennis if the plan lifts it).

### 5.5 The moves checkpoint (owner)

When the moves are built, and before the game is wired to them, Yash sees each move on its own in a dev-only Pose Lab story (as tennis had). He also gets two short screen recordings, recorded on the GPU (tennis §10.7), desktop and phone:
- a full rally with the dive
- the jump smash rally

He approves them or asks for changes. That task runs on an Opus builder at high effort (owner allowance), as tennis's moves did.

## 6. Technical design

### 6.1 Reused (unchanged)

- `three` and `@react-three/fiber`, with no new libraries
- `useThreeGate` and the loader
- `GameCanvas` (with its `antialias` prop; badminton's column canvas turns it on, as tennis's does)
- `athlete` and `kitMaterial` (with `Kit.shorts`)
- `poseClip`, `track` / `sampleTrack`, `rig` (`CLIP_PACE`), `loadOnce`, `useThreeScreen` (with its own `hum`), `Crowd`, `crowdKit` and `groundSpots`
- the sound system with its mute toggle, and the speed gate
- **The kits:** Yash in the dark kit with volt trims, you in the light kit, both in shorts, the same as tennis. The badminton shoes are white.

### 6.2 Lifted from tennis into `three/` (no copied code)

Some tennis-only pieces are needed again. They move into `src/features/games/three/` (or a shared games file when they hold no `three`), and tennis switches to them with no visible change and its tests green. The plan names the exact lifts. The likely ones:
- the footwork planner: runs, shuffles and the walk back (`FOOTWORK`, `WALK`, the run timing of R13 and R15)
- the `Reach` measuring helper
- the pick timing: the window, `SWING_LEAD`, judging picks by the clock, early and late
- the two-choice aim buttons (as a shared control taking its labels)
- the Hawk-Eye mark and the speed-gun HUD line
- the game-loop phases of `Tennis3DScreen`, where they can be shared without making either game harder to read

A piece that is only similar, not the same, is not forced into a shared shape. A tennis stroke and a badminton stroke stay in their own games.

### 6.3 New for badminton

- `src/features/games/badminton/3d/`:
  - `match.ts`: the rules (§4)
  - `court.ts`: the court sizes, the service boxes, the players' places and the camera
  - `shuttle.ts`: the flight solver and the turnover (§5.4)
  - `rally.ts`: plans one rally's shots from the rules' result: where each shuttle goes, which stroke, the moves and the dive. Random variety is drawn once at the rally's start, so it is remount-safe.
  - `moves.ts`: the key poses (§5.2)
  - `sequence.ts`: a rally's shotlist and cues
  - `props.ts`: the rackets, the shuttle, the net and the posts
  - `Hall.tsx`: the court, the lines (one mipmapped texture, tennis §10.7), the boards, the stands, the crowd and the lights
  - `Players.tsx`
  - `scene.tsx`: the lazy entry, with `loadBadmintonAssets` and `BadmintonScene`
  - `PoseLab.stories.tsx` and `RallyLab.stories.tsx`: dev only
- `badminton/Badminton3DScreen.tsx`: the game loop.
- `badminton/BadmintonGame.tsx`: chooses 3D or the 2D backup, as `TennisGame` does.
- A 3D view builder beside `buildBadmintonView`, sharing its pieces (the chrome, the toasts, the reveal chip, the end).
- `BadmintonPage`, `BadmintonStage` and `BadmintonColumn` gain a `three` prop, as tennis's did.
- `app/routes/arena.badminton.tsx` renders `BadmintonGame`.
- **The camera.** The broadcast view: high behind your back line, looking down the court. It is steeper than tennis's, as badminton TV is, so the whole court and the shuttle's high arcs stay in view. It pans gently with the shuttle, with no cuts and no replays. At GAME it pushes slowly toward Yash. It is framed separately for the stage and the column, with the play above the phone's thumb zone.
- **Bundle.** three.js and the scene come only through the dynamic import, never in a first load. The smoke test's `THREE.WebGLRenderer` check covers `/arena/badminton` too. The model files are cricket's and tennis's, so a visitor who played either already has them cached.

### 6.4 Desktop and phone

These are cycle 1's settings: the pixel ratio caps, the shadows, the full or half crowd, and a framing per layout. A short buzz (`navigator.vibrate`) marks each of your hits on the phone, as in tennis.

### 6.5 Sound (owner picks by ear)

- **How the options are chosen:** as tennis §6.5. A builder gathers 2–3 CC0 recordings per new sound into a listening folder. Yash listens and picks, and only his picks are trimmed, normalised, shipped in `public/audio/` and credited in `CREDITS.md`.

| Sound | When | Options |
|---|---|---|
| shuttle hit (name chosen in the plan) | every racket contact; the smash louder | 3 recordings of a shuttle off strings |
| shoe squeak | lunges, sharp stops and the dive's landing | 2–3 recordings of court shoes on a hall floor |
| hall hum | the quiet crowd under the game | 2–3 recordings, including today's `hush` and `murmur` |
| `applause` | after each rally | today's tennis `applause` (reused) or 1–2 indoor ones |
| `ooh` | the OUT call | today's `ooh` (reused) |
| `cheer` | GAME | today's `cheer` (reused) |

- Badminton's existing code-made `smash` sound belongs to the 2D game. A recording must not change it: the new names must not collide with existing ones (tennis's `court` ruling).
- **Rhythm in sound:** the crowd hushes for the serve, the rally is silent except the hits and the squeaks, and the applause comes after the rally.
- **Loading:** as tennis. The recordings are fetched ahead and decoded on the first gesture, and the code-made sound plays until then or if a file fails.

### 6.6 Edge cases

- **Tab hidden.** The rally in play is dropped and replayed fresh from the routine, and the score does not change (G2). The scene pauses.
- **Resize across 1200px.** The game continues, and the canvas and settings follow from the next rally.
- **Leaving the page** disposes everything; the cached files stay.
- **Rematch** walks back smoothly (as tennis), and the score goes back to 17–19.
- **Accessibility:**
  - The canvas is `aria-hidden`.
  - Each rally's call, the new score and any unlock are announced, for example "Smash. 18–19. Backend charged: Java, Spring Boot, JUnit.".
  - The two buttons are real buttons with 44px targets and accessible names, for example "Send it deep: smash — open court".
  - Keys work everywhere (A8).

## 7. Copy (derived, flagged for the copy review)

- **Loader:** `PREPARING THE HALL`.
- **How:** "Send it where he isn't: deep or short."
- **Progress:** `HIS RALLIES CHARGE THE ATTRIBUTES`.
- **Buttons:** `SMASH`, `DROP`, `OPEN COURT`. **Hints:** `↑ ↓ OR CLICK` (stage), `TAP OR SWIPE ↑ ↓` (phone).
- **Calls** (about your pick, as in tennis): `TOO EARLY.`, `TOO LATE.`, `WRONG SHOT.`, `WINNER.` (volt), `OUT.`, `HE READ IT.`, and `WHAT A DIVE.` when your last pick was good but his dive won the Data rally. When Yash wins, his shot is named in the commentary and the toast.
- **Status:** `RALLY n`, `MATCH POINT` (reused), `YOUR MATCH POINT`, `20 ALL`, `GAME YASH` (reused).
- **Commentary** (desktop, one line per rally), for example:
  - after the dive: "Full stretch. He gets everything back."
  - after the jump smash: "Jump smash. Backend charged."
  - your point: "Your point. He'll remember that." (reused)
  - OUT: "Hawk-Eye says out. By a whisker." (reused)
  - 20 all: "Twenty all. Nerves of steel."
  - GAME: "Game, Yash. Still undefeated." (reused)
- **The Hub and the page:**
  - The badminton card's duration becomes `~40s`, and its blurb is rewritten for the 3D game.
  - The page description ("Play four rallies…") is rewritten.
  - The game keeps its name, SMASH OR CLEAR, and its title, so the route and the search entry stay stable. This is my call.
- All of these go into `docs/launch/copy-review.md`.

## 8. Testing (lean)

- **Unit:**
  - `match.ts`: the §4 guarantees.
  - `shuttle.ts`: it lands where and when it was solved to, clears the net, is in or out by the right margin, and turns cork first.
  - `rally.ts`: the shuttle is at the racket's sweet spot at each contact; moves arrive before contact; Yash is up from the dive before his next contact.
- **Browser (e2e), on the fake clock:**
  - 3D on desktop and on the phone: the loader, then the canvas, then a full game to the end. `GAME YASH` is saved with the score, and the four cards show.
  - With no input: four rallies, 21–19.
  - With perfect picks: 6 rallies, 22–20. You win rally 1 (17–20). The OUT comes in rally 2 (Backend charged anyway). Rallies 3, 5 and 6 are HE READ IT, and rally 4 is the Data dive. It ends on the jump smash.
- **The 2D backup:** the existing badminton tests keep running with WebGL off and stay green unchanged.
- **Lighthouse:** `/arena/badminton` first load is gated (WebGL off): desktop at least 90, phone at least 80. The 3D runs are reported only.
- **Yash:**
  - approves the moves (§5.5)
  - picks the sounds (§6.5)
  - plays the game on his laptop and phone

## 9. Out of scope (this cycle)

- Doubles, a full game from 0, a visitor-win ending, and the visitor choosing their own serve.
- Replays, camera cuts, slow motion, an umpire, line judges, and service faults.
- Player faces or likeness.
- Any paid asset or tool.
- Changes to the 2D badminton game.
- The leftovers from cycles 1 and 2 (open hands, crowd shimmer, kit seams), unless one blocks this game's look.

## 10. As built (2026-10-22)

### 10.1 The speed gate

Same rule as cricket §9.1 and tennis §10.1. Lighthouse gates `/arena/badminton` on the page's first load: the prerendered page and the 2D game it falls back to, with WebGL off (`--disable-3d-apis`). The 3D game is measured with software WebGL (SwiftShader) and only reported. `tools/lighthouse.mjs` now gives badminton the same four runs as tennis. `LIGHTHOUSE_ONLY=/arena/badminton` runs just this page.

### 10.2 Lighthouse (3 runs each; perf = median, a11y / bp / SEO = worst run, CLS = worst run)

| `/arena/badminton` | perf | a11y | bp | SEO | FCP | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| desktop, **gated** (WebGL off) | 100 | 100 | 100 | 100 | 471 ms | 607 ms | 0.001 | 0 ms |
| phone, **gated** (WebGL off) | 83 | 100 | 100 | 100 | 2110 ms | 4391 ms | 0.001 | 0 ms |
| desktop, 3D (software WebGL) | 63 | 100 | 100 | 100 | 471 ms | 892 ms | 0.001 | 1494 ms |
| phone, 3D (software WebGL) | 47 | 100 | 100 | 100 | 2113 ms | 4400 ms | 0.001 | 4233 ms |

Gates (unchanged): desktop performance ≥ 90, phone ≥ 80, accessibility 100, best practices and SEO ≥ 90, FCP ≤ 1500 ms (desktop), CLS ≤ 0.1. All were met on the first run, so no start-up fix was needed. The loader keeps the controls' place, so nothing moves when the 3D arrives (CLS 0.001 at most). The phone gate has 3 points of room (83 against 80). As in cricket and tennis, the first 3D run in a fresh Chrome is much slower (desktop 26, phone 43 on run 1): SwiftShader starts up and compiles every shader cold. Only `/arena/badminton` was re-run; the other pages are untouched by this cycle.

### 10.3 Sizes (build/client)

| File | raw | gzip -9 | brotli q5 |
|---|---|---|---|
| `assets/scene-*.js` (the badminton scene, lazy) | 63,758 | 13,412 | 12,085 |
| `assets/groundSpots-*.js` (three + R3F + the shared 3D parts, lazy, shared with cricket and tennis; this was `Floodlight-*` in tennis §10.3) | 968,590 | 254,873 | 238,776 |
| `assets/arena.badminton-*.js` (the route) | 32,681 | 12,709 | 12,329 |
| `assets/PickPair-*.js` (the phone's two pick buttons, in the route's first load; no `three`) | 4,115 | 1,962 | 1,844 |
| `assets/timing-*.js` (the clip beats, in the route's first load; no `three`) | 2,648 | 1,424 | 1,342 |
| `public/audio/hall.mp3`, `shuttle.mp3`, `squeak.mp3` (lazy) | 96,906, 4,364, 5,228 | | |

The shared 3D chunk is the same code as in tennis (516 bytes smaller raw, only because the code moved a little). The models (`athlete.glb`, `moves.glb`, `athlete-skin.jpg`) are shared and unchanged, and `public/models/*` and `tools/models.mjs` have no change on this branch. Badminton's own code on top of the shared parts is about 12 KB (brotli) for the scene. A visitor who has played cricket or tennis has already downloaded the rest. The smoke test checks that no first-load badminton chunk contains `three`.

### 10.4 Camera (`court.ts`)

- `CAMERA.tv`: position `[0, 9, 13]`, target `[0, 0.5, 0.5]` (the broadcast view from behind you, looking down about 32°).
- `fov`: stage 38, column 56. `tilt`: stage 0, column 12°. `pan`: 0.2.
- `CAMERA.game`: position `[0, 3.2, 4.5]`, target `[0, 1.2, -6]` (the push-in at GAME).
- Stage at 1440×900: the whole court, both baselines and the net are in frame, Yash's head stays in frame even in his jump smash, and your whole body is in frame. Column at 390×844: the whole court sits in the top two thirds, your feet at about y 390–480, and the lower third is left clear of the thumb.
- The first camera (`[0, 11, 21]`, fov 25 and 42) was too high and far. Yash saw it at the checkpoint, and the fix is the one above (§10.8, "Owner checkpoint").

### 10.5 The measured reach and the shuttle's flight

Reach, in the body frame from the feet (x is the player's left, y up, z the player's front), measured with the real clips and the racket:

| | x | y | z |
|---|---|---|---|
| serve contact | −0.036 | 0.716 | 0.456 |
| overhead contact | −0.212 | 2.476 | 0.190 |
| jump smash contact | −0.223 | 2.896 | 0.419 |
| net shot contact | −0.187 | 1.366 | 1.612 |
| lift contact | −0.253 | 0.679 | 1.553 |
| block contact | 0.163 | 1.203 | 0.622 |
| dive contact | −0.215 | 0.239 | 2.782 |
| hold (the shuttle in the left hand) | −0.038 | 1.100 | 0.455 |

The three bounds from the plan were met: the overhead 2.476 m (at least 2.4), the jump smash 2.896 m (at least 2.8) and the serve 0.716 m (at most 1.15). Dropped from the hold, the shuttle falls onto the serve's racket within 4 mm.

The shuttle's air drag has a time constant `TAU` of 0.65 s. So a shot leaves fast, slows hard and falls almost straight down. Every shot clears the net by at least 10 cm, except a net shot, which may skim it by 3 cm. An OUT lands 2 to 5 cm past the line. The cork turns over to face the new flight in 0.06 s after each hit. `CLIP_PACE` is the tennis table, and the side shuffle's pace is 1.8 m/s at clip speed 1.

Windows (ms, by Yash's wins so far, 0 to 4): the first pick 1300 / 1200 / 1100 / 1000 / 900, the second pick 1000 / 950 / 900 / 850 / 800, each stretched on the phone by tennis's touch factor. The speed line reads 348 km/h for a smash and 365 for the final one. The call holds 1.8 s, and the first rally waits 1.5 s after the 3D shows.

### 10.6 The moves and the sounds

- Fourteen badminton clips are made from key poses with `poseClip` (ready, split step, two shuffles, the high serve, the overhead, the jump smash, the net shot, the lift, the block, the dive, two stretches and a fist pump), as tennis's are. No new model files. The clips were solved with a throwaway tool (not committed) that placed the feet, hips, racket and eyes on the real rig within joint limits. Yash approved the moves at the checkpoint in the finished 3D game (2026-10-22): "lgtm + your fixes".
- The racket is built in code and fixed to the right hand. The shaft and frame take the player's colour (volt for Yash, light for you), because a dark shaft could not be seen. Yash wears a headband and a wristband, made in code.
- Sounds, picked by Yash by ear and all CC0 (listed in `public/audio/CREDITS.md`):
  - `shuttle` (the racket's hit): candidate shuttle-2, `Badminton.wav` by PerMagnusLindborg. Level 0.9.
  - `squeak` (the shoe on the floor): candidate squeak-2, `Rubber Shoe Squeak.wav` by baidonovan. Level 0.5.
  - `hall` (a new ambience loop, the hall's hum): candidate hall-3, `Sports Hall Ambience, Walla` by Kinoton. Level 0.3.
  - `applause`: the applause-1 candidate, which is tennis's own `applause.mp3`. It is reused, so there is no new file and no `hallApplause`.
  - `ooh` (at the OUT) is reused.
- Until a recording is fetched and decoded on the first gesture, or if it fails to load, the code-made sound plays: `shuttle` falls back to tennis's `net` sound, and `squeak` to a new 60 ms chirp (a sine sweep from 2.4 to 3.2 kHz).
- The squeak sounds at each lunge's heel, at the sharp stop of a jog or sprint, and at the dive's landing. Never two within 0.3 s. That gives 1 to 4 per rally.

### 10.7 The hall

- The mat is a dark green, with one mipmapped line texture (the lines were fixed this way in tennis §10.7) drawn to real sizes: 40 mm white lines, singles and doubles, short and long service lines. The net is a white tape that follows the real net's height, with a dark see-through mesh and posts on the doubles lines.
- The boards are a slim 0.6 m LED band with a 3.5 cm volt strip on top. The stands sit 1.2 m beyond the boards on three sides, with the shared crowd. A dark ceiling at 12 m (the highest serve peaks near 4.65 m) carries 15 lamp panels. One shadow-casting light from above.
- The shuttle is drawn 2.2 times real size on the stage and 3.0 times on the phone, with a faint soft halo, so it can be followed. In the server's hand it is 1.6 times and grows to full size as it falls, so it does not pop.
- On a real GPU (Apple M1, Chromium on Metal) the scene held 60 fps on both layouts. Videos for the checkpoint were recorded that way.

### 10.8 Rulings, in plain words

From the plan (P1–P9):
- **P1: The open part glows on Yash's half** (the front or the back), as tennis's open side glows. It is the third way the open part reads, with where he stands and the lit button.
- **P2: The rally's kind comes from Yash's wins so far.** 0 wins: smash (Backend). 1: drop (Frontend). 2: dive (Data). 3: placement (Craft). 4: the final smash, only after 20 all. Your rally win does not change it, so the next rally tries the same card again. (A plan line said the dive came "after three late rallies". Under P2 it comes after two Yash wins, and the build and its tests use two.)
- **P3: Pick judging is shared.** A generic `pickQuality` moved into `engine/pick.ts`. Tennis's `returnQuality` is now a mapping over it, with its tests unchanged. Badminton uses it directly.
- **P4: The 3D view is `BadmintonView` plus a `three` part** (the buttons, the speed line, the hints). `buildBadmintonView`'s output did not change.
- **P5: The phone's status reads `RALLY n`** with no total, because the number of rallies varies (4 to 6).
- **P6: Calls follow your last pick:** `TOO EARLY.`, `TOO LATE.`, `WRONG SHOT.`, `HE READ IT.`, `WINNER.`, `OUT.`, and `WHAT A DIVE.` when your good drop is beaten by the Data dive. A late or early pick in the Data rally keeps its own call (the dive still happens).
- **P7: A mistimed swing still meets the shuttle, off the frame.** It never whiffs, because Yash's card shot needs a shuttle to hit. The shuttle leaves as a weak float. (How far off the frame is in the building rulings below.)
- **P8: The speed line** (`YASH · SMASH · 348 KM/H`) shows only while the call of a rally Yash won with a smash is up. Stage only. The phone shows no speed line.
- **P9: Sound names.** The racket's hit is `shuttle`, with tennis's `net` recipe as its code-made fallback. The shoe squeak is `squeak`, with a new 60 ms chirp as its fallback. The hall's hum is a new ambience track `hall`, since Yash picked a new recording. A recording never changes an existing sound (the `court` ruling in tennis), and a new applause would have shipped as `hallApplause`. Yash kept today's applause, so that name was not needed (ruling F1 of the ledger, not triggered).

While building:
- **F2: Task 1 (the sound candidates) ran in parallel with Task 2**, as tennis's R8 did. They share no files.
- **The turnover flips cork first.** The plan said the cork starts "reversed" from the last flight. That was wrong. An incoming shuttle points cork first along its own velocity, so at the hit the cork points the way the old flight was going, and it must flip about 180° to the new flight over 0.06 s, over the top. Fixed in `shuttle.ts` before the review.
- **A caller must cut the old flight at the hit** before it asks for the cork's heading. Flights run on to the floor, past the next hit, and passed whole the cork would snap at each hit. `shuttle.ts` says so, and `sequence.ts` does it.
- **Soft shots are slow and the smash is quick.** With the drag, a shuttle that must fall steeply just past the net has to lose its pace first. Your serve, Yash's drop, block and scoop and your dribble fly 1.6 s, his placement lift 2.0 s. Your smash, hit from 2.476 m high, flies 0.8 s: a straighter flight would pass under the tape. Yash's net shot is taken 0.4 to 0.6 m from the net, and the Data rally lands 0.3 to 0.7 m over the net, not 0.2.
- **Frame shots (the mistimed swing).** The plan had the contact slide 0.12 s late or 0.1 s early along the path. But the shuttle falls at about 5 m/s, so that moves it 0.3 to 0.6 m up or down, and the feet could not close the gap. Ruling: `FRAME` is 0.03 s each way, and the feet keep the meeting swing's place (no re-plan). The shuttle meets the racket 0.10 to 0.16 m from the sweet spot, and the test bound is 0.08 to 0.2 m. The late or early read comes from the call and the weak float, not from a visibly late swing. No foot drifts after the pick (zero ground speed in every stroke over the sweep).
- **Frame shots are exempt from the 1 cm sweet-spot rule.** Instead the test checks that the shuttle leaves from exactly where it was met.
- **A contact is by either player.** The hit sound uses all of them. Your `buzz` uses only your meeting swings.
- **Getting up from the dive.** Yash's next shot after the dive comes after he is up and has run to his place, so the float to him is made longer if needed (it never needs it today). The dive stands him 1.4 m forward (`DIVE_LANDS`), and the shotlist moves him that far as he gets up.
- **Shuffles finish as the stroke starts,** where they fit at shuffle pace, so every stroke is fully planted. A run turns back to its swing's heading over at least 0.3 s.
- **A read sets off at your commit,** the moment your forward swing starts, with no split step (on 20 after the OUT is used, and in the final). It is the earliest moment that can never change the past. Every read is a side-on shuffle at 2.2 to 3.2 m/s, never a sprint.
- **Moves back are side-on.** A move more than 120° from the way he faces uses a chassé at any speed, so he does not jog away from the net. `travel` in `three/footwork.ts` gained an optional `shuffleMax` for this, and tennis does not set it, so tennis is unchanged. The turn cap in the rally lists is 0.25 rad per frame.
- **Applause** starts 0.3 s before the end of the rally, unless that rally ends the game (the crowd is already up for GAME).
- **Owner checkpoint (Task 9).** Yash watched the moves and the hall and said "lgtm + your fixes". The controller's own look added: camera lower and closer, slimmer boards and less empty floor, stands closer, a bigger shuttle with a halo. They are all in §10.4 and §10.7, and the controller checked the stills.
- **The sounds** were not listened to by the builder; Yash chose by ear from the candidates (shuttle 1–3, squeak 1–3, hall 1–4, applause 1–3) and picked shuttle-2, squeak-2, hall-3 and applause-1. The shipped files are rebuilt from the same sources, trims and levels as the candidates.
- **The 3D page's progress copy** is the label of the left how-to panel (`HIS RALLIES CHARGE THE ATTRIBUTES`), because badminton has no progress bars. The serve phase starts at the serve swing's start (`serveAt − SERVE_CLIP.contact`). The rally phase starts at your first contact. A hidden tab drops the rally, and the visible tab plays it again fresh. A resize takes effect from the next rally.
- **One line of the 2D e2e changed** (`tests/e2e/badminton.spec.ts`). Its no-JavaScript test reads the prerendered page, which is now the 3D game's board (as tennis's is), and that board's next card says `UP NEXT`, not `UP NEXT · RALLY 1`. The test now looks for `UP NEXT`, which both views show. No 2D game code changed.
- **Owner process:** Sonnet built most tasks. Opus (high effort) built the moves (T6), the rally script (T7), the shotlists (T8) and the game wiring (T11). Reviews only on T2, T3, T4, T5, T7 and T8. T6 and T9 were judged at the owner checkpoint. T1, T10 and T12 had no review. T11 is covered by the final review.
- **Verify** could not run as one command, because its e2e step starts a server on port 4173, which is Yash's. Every step of `pnpm verify` was run in order with the same flags and a temporary config on 4183. The whole e2e run had 43 failures on the 2D projects under heavy load (the machine was overloaded), and all 43 passed on a re-run with 2 workers. The 3D e2e passed in the full run.

### 10.9 Known and left for later

- **Deferred minor findings from the reviews:**
  - `footwork.ts` and `geometry.ts` have no direct unit tests (tennis's sequence test covers them).
  - `sequence.ts` keeps its own `clamp01` beside the shared clamp.
  - A comment is wanted on `Gait`: the run pace comes from `CLIP_PACE` by slot name.
  - `useFirstPlay` and `useHiddenTab` keep the first render's handlers, so callers read the latest state by ref (badminton does).
  - Venue boards are keyed by `at`, and the Hawk-Eye mark's size is fixed in the venue.
  - The `played` comment in `view.ts` says 0 to 4, and 3D plays up to 6.
  - `three.comm.final` is dead copy (the game-over line wins at 22–20). Use it in the GAME line, or drop it.
  - There is no guard for empty shipped chips, and the Data-rally test lacks `early`.
  - `Hub.stories.tsx` still shows `~10s` for badminton.
  - The OUT test in `shuttle.test.ts` only re-checks its own input. The real OUT landing is tested in `rally.test.ts`. There is no heading test for equal or vertical directions, and `NET_CLEAR` is not enforced in `shuttle.ts` (callers supply it).
  - The rally tests assert the count and the last stroke, not every middle shot.
  - `endsGame` in the shotlists repeats the match rules (a test cross-checks it).
- **Moves:** foot slide of 1 to 3.6 cm per frame at touchdowns; in the dive the toes drag and a fingertip dips 3.7 cm into the floor in the push-up. The right wrist is near its limits with the handshake grip (one line in `HOLD` and a re-solve would change it). Some forearm turns between keys are 100–160° (real pronation) and look smooth in the lab. The hands are open (no finger bones).
- **Pace:** a 5 or 6 shot rally takes 10 to 12 s with the call, so a long game can run over the planned 45 s. The shortest rally is 5.4 s and the longest 11.6 s. The soft shots are slow by physics (§10.8). The shuffle can run up to 1.78 times the clip's pace for 3.0 to 3.2 m/s moves and may look frantic. Yash judges these in play.
- **The walk between rallies** turns up to 0.262 rad per frame at its end, from the shared `walkBack` (settle 0.2 s). A per-game settle time on `walkBack` is the fix, a few lines. It was left to keep tennis unchanged.
- **The tennis late-miss blend** blends a clip with itself over 0.05 s, which can glitch for about 3 frames. Badminton avoids it with a 1 µs handover. Not touched.
- **The phone shows no speed line** (not asked for). The `pickWrongDir` e2e helper exists but no test uses it yet.
- **The checkpoint videos** recorded before Yash's fixes are out of date (old camera and hall). Only new stills were taken after the fixes.
- **The 3D e2e on desktop-3d is load-sensitive**, as in tennis §10.9. Under heavy load, software WebGL can miss the ready or show cap and fall back to 2D (as designed). The heavy sweep tests have a 30 s timeout each (tennis's final review).
- **The shipped sound files** were not listened to again by the builder. Yash's by-ear check of them, and a check of the 3D's smoothness on his own phone before merge, are still wanted.
- **Ledger and final review:** the whole-branch final review (it covers T11) and its fix wave come after this note, and anything it finds is added here.
