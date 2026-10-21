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
