# The Arena — Design Handoff Audit

Source: `temp_handoff/yash-sarda-arena-handoff/` (README.md, tokens/tokens.css, content/content.json, design-source/*.dc.html ×23, canvas.json, assets/, tools/rig.py). All 23 artboards read in full. Counts below come from a regex pass over the raw files (inline styles plus `<helmet><style>`), so treat them as close approximations. `#160` in Game-System is the `&#160;` entity, not a colour, and is excluded.

Conventions: **D** = Big Shoulders Display (`.d`), **M** = JetBrains Mono (`.m`), **B** = Archivo (inherited body). "Glass" = `.glass` class. Sizes are px unless noted.

---

## 1. Artboard index

`is_interactive` is the canvas.json flag. "Logic" means the `DCLogic` script does more than `return {}`.

| # | File | Title (canvas.json) | Size | is_interactive | Logic | Purpose | Kind |
|---|---|---|---|---|---|---|---|
| 01 | Direction | 01 · Visual direction — Night Match | 1440×1100 | – | none | Palette, type specimens, broadcast kit (score bug, COMM, stat bar, buttons), 5 principles | **Reference** (confirmed: padded doc layout, no HUD, `01 —` eyebrow, `href="#"`) |
| 02 | Main | 02 · Landing — the scoreboard | 1440×900 | true | none | Floodlights flicker on, scoreboard boots name, challenge line + 2 CTAs | **Product** `/` |
| 02b | Opening | 02b · Cinematic opening — storyboard | 1440×900 | – | none | 6 storyboard frames (ticket gate → challenge) + AUDIO/LIGHT/CAMERA/UI lanes | **Reference** (confirmed) |
| 02c | Intro | 02c · Screen 2 — Player introduction (animated, ~6s) | 1440×900 | true | **yes** (pixels, letters, replay) | 6s character entrance on the scoreboard, name assembly, WELCOME + CTA | **Product** `/intro` |
| 03 | Hub | 03 · Arena Hub — navigation | 1440×900 | true | none | 3 venue cards on an arc, facilities row, left index rail, matchday progress | **Product** `/arena` |
| 04 | Cricket-Play | 04 · Cricket — Bowl at Me (playable · Yash bats) | 1440×900 | true | **yes** (full game) | 3-ball length-meter game; each ball reveals an innings | **Product** `/arena/cricket` |
| 07 | Cricket-Career | 07 · Career Stats — the scorecard | 1440×900 | true | **yes** (row select) | Scorecard table + ball-by-ball detail + stack | **Product** `/career` |
| 05 | Tennis-Play | 05 · Tennis — Return of Serve | 1440×900 | true | **none** (static mock of rally 3) | Court, aim zones, 2 courtside project cards | **Product** `/arena/tennis` (no game logic) |
| 08 | Tennis-Highlights | 08 · Match Highlights — projects | 1440×900 | true | **yes** (reel select) | Tournament draw list + replay panel + serve/rally/winner + shot data | **Product** `/highlights` |
| 06 | Badminton-Play | 06 · Badminton — Smash or Clear | 1440×900 | true | **none** (static mock at 20–19) | Vertical power meter, attribute toasts | **Product** `/arena/badminton` (no game logic) |
| 09 | Badminton-Attributes | 09 · Player Attributes — skills | 1440×900 | true | **yes** (data render only) | Profile column + 4 skill groups with 10-segment evidence bars | **Product** `/attributes` |
| 10 | Trophy-Room | 10 · Trophy Room + Training Academy | 1440×900 | true | **none** | Glass cabinet (5 + locked), selected-trophy panel, academy card | **Product** `/trophies` (selection not wired) |
| 11 | Player-Card | 11 · Player Card — resume | 1440×900 | true | **none** | Holographic card, profile facts, PDF/download/copy actions | **Product** `/card` |
| 12 | Team-Up | 12 · Team Up — contact | 1440×900 | true | **none** | Format radios, name/email/message form, direct channels | **Product** `/team-up` (no submit logic) |
| 13 | Game-System | 13 · Play Against Me — game system | 1440×1100 | – | none | Loop diagram, games table, 1% tuning, commentary lexicon, fair-play rules | **Reference** (confirmed) |
| 13b | Easter-Egg | 13b · The 1% — Giant Killer | 1440×900 | true | none | Achievement toast, flipped scoreboard, Locker Room unlock | **Product** (route not in README; overlay or `/giant-killer`) |
| 14 | Motion | 14 · Motion, camera & transitions | 1440×1100 | – | none | 4 camera moves, 3 easings, 8 micro-interactions | **Reference** (confirmed) |
| — | QuickView | Recruiter Quick View — Scouting Report | 1440×3300 (`expand: fill`) | true | none | Fluid single page: hero, career, highlights, attributes, trophies, academy, team up | **Product** `/scout` (the only fluid/responsive artboard) |
| 15 | Mobile-Landing | 15 · Mobile — landing | 390×844 | – | none | Mobile scoreboard + stacked CTAs | **Product (mobile variant)**, all hrefs `#` |
| 15 | Mobile-Hub | 15 · Mobile — fixtures hub | 390×844 | – | none | Fixture list + 5-tab bar | **Product (mobile variant)**, all hrefs `#` |
| 15 | Mobile-Game | 15 · Mobile — one-thumb game | 390×844 | – | none | Cricket only: compact bug, reveal chip, tap button | **Product (mobile variant)**, static |
| 15 | Mobile-QuickView | 15 · Mobile — scouting report | 390×844 | – | none | First viewport of /scout at 390 | **Product (mobile variant)**, deviates from the fluid QuickView |
| 15 | Responsive | 15 · Desktop → mobile behavior | 1080×844 | – | none | Desktop/tablet/mobile/reduced-motion matrix + 3 notes | **Reference** (confirmed) |

**Notes**
- 5 reference boards are confirmed: Direction, Opening, Game-System, Motion, Responsive. 18 artboards are product screens: 14 desktop and 4 mobile.
- canvas.json marks 9 artboards interactive that have no logic: Main, Hub, Tennis-Play, Badminton-Play, Trophy-Room, Player-Card, Team-Up, Easter-Egg and QuickView. Their only interactivity is links and hovers.
- Only 4 artboards have behaviour: **Cricket-Play** (a real game), **Intro** (procedural animation and replay), and **Cricket-Career** and **Tennis-Highlights** (list selection). Badminton-Attributes uses its script only to generate data.
- Every file loads `<script src="./support.js">` (the canvas runtime), which is **not in the package**. Assets are referenced as `/_blob/<id>` (see §10).

---

## 2. Token reality check

### 2.1 Colour: existing tokens vs actual usage

| Token | Value | Uses | Files | Notes |
|---|---|---|---|---|
| `--volt` | #D7FF3F | 283 | 23 | ✓ |
| `--scout-grey` | #A3ADB7 | 220 | 22 | ✓ |
| `--floodlight` | #F2F4F5 | 152 | 23 | ✓ |
| `--line` | #1C232C | 116 | 18 | ✓ (`1px solid #1C232C` ×109) |
| `--text-2` | #C3CBD3 | 62 | 21 | ✓ |
| `--volt-ink` | #0A0C08 | 60 | 19 | ✓ |
| `--pitch-black` | #05070A | 58 | 19 | ✓ |
| `--dim` | #7D8893 | 58 | 17 | ✓ |
| `--line-strong` | #2A323C | 48 | 16 | ✓ (`1px solid #2A323C` ×40). Intro also uses it as the scoreboard border |
| `--stand` | #0E141B | 22 | 9 | ✓ (score cells, inline COMM bg) |
| `--stand-2` | #0B0F14 | 10 | 5 | ✓ (inputs, meter track, card stat cells) |
| `--night` | #030405 | 9 | 4 | ✓ (Main and Mobile-Landing ground, Tennis LED board) |
| `--live-red` | #FF4D3D | 11 | 9 | ⚠ also used as a **fill** for the Badminton "MATCH POINT" chip, which breaks the "never a fill" rule. White on it is 3.29:1 and fails AA |
| `--gold` | #D4B26A | 3 | Trophy-Room | Used only for eyebrows and sub-labels; the trophies use their own gold ramp (below) |
| `--volt-hover` | #E6FF7A | 3 | Main, Intro, Cricket-Play | Used only as the CTA hover. **Every file's base `a:hover` uses #EBFF9E** (26 uses), a conflicting second hover |
| `--turf` | #0E3322 | 2 | Direction, Motion | Swatch labels only. Real scenes use other turf values (below) |
| `--hard-court` | #0C2236 | 2 | Direction, Tennis-Play | Tennis-Play court outer fill only |
| `--hall` | #24180E | 2 | Direction | Swatch only |
| `--glass-bg` | rgba(14,19,26,.66) | 12 | 12 | ✓ in `.glass` of 15 files; Main and Intro differ (below) |
| `--glass-border` | rgba(255,255,255,.09) | 12 | 12 | ✓ (Main and Intro use .10) |

### 2.2 MISSING colour tokens (raw values with no token)

**Neutrals and text**

| Value | Uses | Files | Role | Proposal |
|---|---|---|---|---|
| #E6EAEE | 26 | 17 | COMM line text, body on panels, ball-by-ball text | `--text-1` (between floodlight and text-2) |
| #E3E8EC | 3 | Main, Easter-Egg, Opening | "Think you can beat me?" | merge → `--text-1` |
| #F4F6F7 | 8 | Intro, Main, Trophy-Room | lit LED name text, silver medal highlight | `--led-white` (or merge → floodlight) |
| #FFFFFF / #FFF | 15 / 11 | 9 | bulbs, meter cursor, glints, Live-red chip text | `--white` |
| #2E3A0A | 6 | Main, Hub, Cricket-Career, Player-Card, QuickView, Mobile-Landing | secondary text on volt | `--volt-ink-2` |
| #EBFF9E | 26 | 23 (`a:hover`), Easter-Egg dust, Opening lane | link hover | resolve against `--volt-hover` (#E6FF7A); keep one |
| #3A434C | 23 | 8 | 3rd border step (QV secondary CTA, mobile CTAs, locked trophy dashes, ball-tracker border, meter divider) | `--line-3` |
| #5D6670 | 9 | Easter-Egg, Game-System, Opening, Team-Up | connectors, `.fmt:hover` border, loser digit | `--line-hover`; ⚠ 3.44:1 as text |
| #26303A | 5 | Direction, Hub | empty segment | `--seg-empty` (conflicts with #1E262F) |
| #1E262F | 1 | Badminton-Attributes | empty segment | merge → `--seg-empty` |
| #2A3138 | 4 | Main, Direction, Trophy-Room | floodlight mast, ink on grey swatch, medal text | `--mast` |
| #0A0E13 | 9 | Motion, Player-Card, Trophy-Room | panel gradient end, diagram bg | `--stand-3` |
| #141B23 | 3 | Badminton-Attributes, Motion, Player-Card | panel gradient start | `--stand-hi` |
| #13171C | 5 | Trophy-Room | plinth | `--plinth` |
| #121A23, #0B1118, #0F1720 | 2/1/1 | Tennis-Play, Tennis-Highlights | media placeholder stripes | `--placeholder-a/b` |

**Scoreboard / LED** (none tokenised)

| Value | Uses | Files | Role |
|---|---|---|---|
| #06080B | 8 | Main, Intro, Easter-Egg, Mobile-Landing, Opening | board face |
| #1A2028 | 11 | Main, Intro, Mobile-Landing | internal board rules (≠ `--line` #1C232C) |
| #232A33 | 8 | Main, Easter-Egg, Mobile-Landing, Opening | board border (Intro uses #2A323C) |
| #0A0D11 | 5 | Main, Intro, Mobile-Landing | bezel ring (box-shadow 8px / 5px mobile) |
| #1B2129 | 1 | Main | outer bezel hairline (Intro uses #232A33) |
| #07090C, #11161C, #14191F | 1 each | Intro | `boardOn` "off" state |
| rgba(255,255,255,.045) | 3 | Main, Intro, Mobile-Landing | LED dot (4px grid) |
| rgba(6,8,11,.5) | 1 | Intro | LED pixel mask over the character |
| rgba(0,0,0,.16) | 1 | Intro | scanlines |

**Grounds** (7 near-blacks; only 2 tokenised)

| Value | Where |
|---|---|
| #05070A ✓ | most pages |
| #030405 ✓ | Main, Mobile-Landing, Opening frames |
| #020304 | Intro |
| #020203 | Easter-Egg, Opening F1 |
| #07060A | Badminton-Play (warm) |
| #06060A | Badminton-Attributes (warm) |
| #040508 | Trophy-Room |
| #0A0C10 → #07080B | trophy cabinet gradient |
| #000 | Opening F0 frame; also used as a mask colour ×39 (not a token) |

**Venue palettes.** Each venue has a deep/mid/glow ramp, but only the deep value is tokenised.

| Venue | Values seen | Uses / files |
|---|---|---|
| Turf (cricket) | #2E8A50, #185634, #13432A, #0A2015 (Hub card); #1F6B42, #0B2418 (Direction); #123E28 / #0F3622 (outfield stripes, Cricket-Play and Mobile-Game); rgba(46,132,78,.75/.7/.8/.35) (Main, Intro, Opening, Mobile-Landing); rgba(30,110,64,.40) (Career); rgba(14,52,32,.55/.5/.4) (≈ --turf); rgba(24,86,52,.45) (Mobile-Hub) | ~17 |
| Pitch / wicket | #8C7650 (Hub), #6E5E40→#A08A5E (pitch strip), rgba(150,128,88,0→.45) (Main), stumps #E8DCC0, #F1E6CC→#B9A57C, bat #E8DCC0→#9C8660 | ~14 |
| Hard court (tennis) | #16456E (court surface, Hub and Tennis), #1B4C76, #0A1A2B (Hub card), #1F4E7A, #0B1B2C (Direction), #0C2236 (✓ outer), rgba(31,78,122,.55/.45), rgba(27,76,118,.45) (Mobile-Hub) | ~10 |
| Hall (badminton) | #5A3E22, #22170D (Hub card), #6B4A28 (Direction), #24180E (✓), rgba(120,84,44,.45/.40), rgba(90,62,34,.5) (Mobile-Hub); court #14211C / #1F3A30 (Badminton-Play), #2B3A33 (Hub); warm light rgba(255,228,184,.20/.10/.45/.02), rgba(255,226,180,.22), lamp #FFF3DD, warm crowd rgba(230,214,190,.18) | ~14 |
| Court lines | #E8EEF3 ×11 (Hub, Tennis-Play), #ECEFF1 ×1 (Badminton) | `--court-line` |

**Light (atmosphere) rgba families**

| Family | Values | Role |
|---|---|---|
| Sky glow `rgb(150,172,200)` | α .10 (Direction), .12 (QV, Highlights), .14 (7 files), .16 (Hub), .18 (Intro, Opening), .20 (Main, Mobile-Landing) | night-sky lift radial |
| Beam `rgb(225,236,250)` | α .14 (Intro), .16 (Main), .18 (Opening) → 0 | light cones |
| Bulb glow `rgb(228,238,252)` + halo `rgb(200,216,238)` | .45/.14, .40/.10, .42/.12, .4, .35 | floodlight bank box-shadows |
| Crowd `rgb(214,224,236)` | α .30 (Main, Intro), .28/.14 (Opening), .26 (Cricket), .24 (Tennis), .22 (Mobile), .20 (Hub) | crowd dot texture |
| Flare | rgba(255,255,255,.9), rgba(220,232,250,.35), rgba(230,240,255,.25) | Intro flare and flash |
| Trophy spot `rgb(255,236,200)` | .30 (selected), .18, .16 | trophy spotlights |
| Shelf `rgb(220,236,250)` | .35 → .05, .08 | glass shelf |
| Intro backlight `rgb(255,150,60)` | .22 / .06 | warm silhouette backlight |
| Trail orange | #FFB25C ×3, rgba(255,170,90,.7/0) | Intro light trails / pixels |
| Holo tint | rgba(140,200,255,.08) | Player-Card sheen |

**Trophy metals** (Trophy-Room only): gold #7A5E2A ×5, #F0D998 ×3, #B8934A ×5, #6A5023 ×6, #E8CF8E ×2, #D9BE7C ×2, #C9A55A, #8C6E33, #2B1E12 ×2, #140E08; silver #F4F6F7, #A9B2BA, #5E6770; ribbon #1E2A3A. Proposal: a `--gold-100…900` and `--silver-*` ramp scoped to the Trophy component.

**One-offs:** #B8D92E (Tennis serving dot inside the white name chip), #1A2027 ×19 (floodlight housing, 6 files → `--fixture`).

**Alpha ramps in use (to consolidate)**
- Volt α: .04, .06, .07, .08, .1/.10, .12, .14, .16, .18, .22, .24, .25, .35, .4, .45, .5, .55, .6, .8, .9 (20 steps). Proposal: `--volt-a04 .04, a08 .08, a12 .12, a16 .16, a22 .22, a35 .35, a45 .45, a60 .60` (8 steps).
  - .06/.07/.08 → a08 (selected row bg, radio bg)
  - .35/.4/.45 → a35 / a45 (volt-edged panels)
  - .55/.6 → a60 (ring glow)
- White α: .03, .035, .04, .045, .05, .09, .10, .12, .16, .18, .3, .35, .7, .8, .85, .9, .95. Proposal for UI use: `--white-a04` (row hover), `--white-a05` (nav hover), `--white-a10` (secondary CTA hover), plus `--glass-border`. Keep the rest as scene-local values.
- Black α (shadows): .5, .6, .7, .8.
- Ground α: rgba(5,7,10,.85) (game HUD fade), .86 (QV sticky header), .92 (mobile bars), .35 (net); rgba(7,6,10,.85) (badminton HUD).

### 2.3 Glass inconsistencies

| Variant | bg | border | blur | Files |
|---|---|---|---|---|
| Token | rgba(14,19,26,**.66**) | rgba(255,255,255,**.09**) | 14px | Direction, Hub, Cricket-Play, Cricket-Career, Tennis-Play, Tennis-Highlights, Badminton-Play, Badminton-Attributes, Trophy-Room, Player-Card, Team-Up, Easter-Egg |
| Landing/intro | rgba(14,19,26,**.62**) | rgba(255,255,255,**.10**) | 14px | Main, Intro |
| Mobile solid | rgba(14,19,26,**.7**) | rgba(255,255,255,.1) or #2A323C / #3A434C | none | Mobile-Landing |
| Mobile solid | rgba(14,19,26,**.8**) / **.85** | #2A323C or volt .45 | none | Mobile-Game, Mobile-Hub (gradient end) |
| Sticky bar | rgba(5,7,10,.86) | bottom #1C232C | 14px | QuickView header |
| Mobile bars | rgba(5,7,10,.92); rgba(10,13,17,.94) | #1C232C | none | Mobile-QuickView header, Mobile-Hub tab bar |
| Volt-edged glass | token + border-color volt .35 / .4 / .45 / .55 (hover) | — | 14px | Hub, Tennis-Play, Badminton-Play, Easter-Egg |

→ Define `glass` (default), `glass-solid` (mobile, no blur, α .85), `bar` (sticky header/tab bar, α .9) and an `edge="volt"` modifier. Drop .62/.10.

### 2.4 Typography actually used

**Display (D)**: sizes 9, 12, 13, 14, 16, 17, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 40, 44, 46, 48, 50, 52, 56, 60, 64, 76, 84, 88, 96, 120, 132, 150, 156, plus `clamp()`s in QV. Weights 700 / 800 / 900; **600 is loaded but never used**. Tracking: none, .01, .02, .03, .04, .06, .08, .1, .12, .14, .16, .38, .4, .42em. Line-heights .82–1.

| Size | Weight | Tracking | Role | Files |
|---|---|---|---|---|
| 156 / 150 / 132 | 900 | .02 / – / .02 | hero name (Main, Easter "OKAY… YOU GOT ME.", Intro) | Main, Easter-Egg, Intro |
| clamp(64,11vw,156) | 900 | .01 | QV hero | QuickView |
| 120 | 900 | .01 / .04 | Direction H1, Cricket call overlay | Direction, Cricket-Play |
| 96 / 88 / 76 | 900 | – | Team-Up H1, Direction specimen, mobile hero (Mobile-Landing 96, M-QV 76) | |
| **84** | 900 | – | **page H1** (lh .85) ×5 | Career, Highlights, Attributes, Trophy, Player-Card |
| 64 / 60 / 56 | 900 | – / .06 / – | section H2 (Game-System, Motion 64; Intro WELCOME 60; Hub H1 56), card number "SE" 64 | |
| 52 / 50 / 48 / 46 / 44 | 900 | – | card name (52), Opening H2 (50), mobile H1 / Responsive (48), Highlights H2 (44) | |
| **40** | 900 | – | stat values ×11 (Career tiles, Direction principles numbers, Easter digits) | |
| 36 / **34** / 32 / 30 | 900 (700 for subtitles) | – | panel titles (Trophy detail 36, venue name 34, group name 32, Hub "1 OF 3" 30); subtitle 34/.40em (Intro), 30/.42em (Main) | |
| 28 / 26 / **24** / 22 / **20** / **18** | 800–900 | .04–.16 | row titles, CTA labels, score bug, facility names, YS mark (18) | many |
| 16 / 17 / 14 / 13 / 12 / 9 | 800–900 | .12–.4 | mobile chips, Opening miniatures, trophy "PAPER" | |

**Mono (M)**: 9, 10, 11, 12, 13, 14, 22. Weight 400 and 700 only (**500 loaded, unused**).

| Size | Tracking seen | Uses | Role |
|---|---|---|---|
| 9 | .14 | 6 | mobile tab labels, Mobile-Game player tag — **below README minimum (11)** |
| 10 | –, .1, .12, .14, .16, .18, .2, .22 | 64 | mobile labels, card stat labels, Opening timecodes — **below minimum** |
| **11** | –, .12, .14, .16, .18, .2, .22; 700 + .2 (COMM), 700 + .16 (status chip) | 169 | panel labels, tags, chips |
| **12** | –, .12, .14, .16, .2, .22, .24 | 133 | HUD buttons (.16), eyebrows (.22), brand wordmark (.24), stack tags |
| 13 | – | 6 | QV attribute chips, skill names |
| 14 | .22 | 1 | Intro tagline |
| 22 | – | 1 | Direction specimen |

README says mono is "11–13px, +14–24%", but 70 uses are 9–10px and many use .1/.12em or no tracking.

**Body (B)**: 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 28, 30, plus `clamp(20,2.2vw,28)`. Weights 400 / 500 / 600; italic 400/500. Line-heights 1.3–1.6 (1.5 ×36, 1.45 ×16).

| Size | Role |
|---|---|
| 13 (×46) | card descriptions, captions |
| 14 (×28) | panel body, ball-by-ball (lh 1.42), toasts |
| 15 (×26) | venue description, row role, key/value |
| 16 (×23) | COMM line (italic), QV list body |
| 17 / 18 | lead (Highlights 17, Player-Card 18, academy name 18/600) |
| 20 | intro paragraph (Direction, Team-Up) |
| 22 / 28 / 30 italic 500 | challenge line (Mobile 22, Easter 28, Main 30) |

#### Proposed consolidated type scale

| Token | Family / weight | Size / lh / tracking | Replaces |
|---|---|---|---|
| `display-hero` | D 900 | clamp(64px, 11vw, 156px) / .85 / .02em | 156, 150, 132, 120 (Direction), 96 (mobile name) |
| `display-call` | D 900 | 120 / 1 / .04em | Cricket call overlay |
| `display-1` (h1) | D 900 | 84 / .85 / 0 (clamp 48→84) | 84, 88, 96 (Team-Up), 76 |
| `display-2` (h2) | D 900 | 60 / .9 / 0 (clamp 40→60) | 64, 60, 56, 52, 50, 48, 46, 44 |
| `display-stat` | D 900 tabular | 40 / 1 | 40, 36 |
| `display-3` (h3) | D 900 | 34 / .95 | 34, 32, 30 (`--fs-h3` = 34 ✓) |
| `display-4` | D 800 | 26 / 1 / .04em | 28, 26, 24 row titles |
| `display-btn-lg` | D 800–900 | 26 / 1 / .14em | XL/L CTA labels (26, 28) |
| `display-btn` | D 800 | 20 / 1 / .14em | M/S CTA labels (20–24), score-bug names (20 / .06em) |
| `display-5` | D 800 | 18 / 1 / .08em | YS mark, venue tint labels, hub buttons |
| `display-sub` | D 700 | 30 / 1 / .4em | SOFTWARE ENGINEER (30/.42, 34/.40, 18/.38 mobile) |
| `mono-lg` | M 400 | 14 / 1.4 / .22em | Intro tagline |
| `mono-md` | M 400 | 12 / 1.3 / .16em | HUD buttons, stack tags (.14 → .16) |
| `mono-eyebrow` | M 400 | 12 / 1 / .22em | page eyebrow (.22, .24 → .22; keep .24 for the brand wordmark) |
| `mono-label` | M 400 | 11 / 1.3 / .2em | panel labels (.18 / .2 → .2) |
| `mono-tag` | M 400/700 | 11 / 1 / .16em | chips, status, COMM (700, .2em) |
| `mono-xs` | M 400 | 10 / 1.2 / .14em | mobile only (raise the 9px tab labels to 10) |
| `body-lg` | B 400 | 18 / 1.55 | 17, 18, 20 |
| `body` | B 400 | 16 / 1.5 | 15, 16 (`--fs-body` ✓) |
| `body-sm` | B 400 | 14 / 1.45 | 14 |
| `caption` | B 400 | 13 / 1.45 | 12, 13 |
| `comm` | B 400 italic | 16 / 1.3 | COMM line (15 on Team-Up) |
| `challenge` | B 500 italic | clamp(22px, 2.2vw, 30px) | Main, Easter, Mobile |

Existing tokens `--fs-h1` 120 / `--fs-h2` 84 do not match usage: page H1 is 84, and Direction labels H2 as "56/0.9". Rename them, or set h1 = 84 and h2 = 60.

### 2.5 Letter-spacing (all)

.01 (2), .02 (5), .03 (2), .04 (12), .06 (16), .08 (20), .1 (4), .12 (18), .14 (99), .16 (56), .18 (24), .2 (78), .22 (14), .24 (18), .38 / .4 / .40 / .42 (5). Proposed tokens: `--ls-0` 0, `--ls-tight` .04em, `--ls-score` .08em, `--ls-data` .12em, `--ls-btn` .14em, `--ls-chip` .16em, `--ls-label` .2em, `--ls-eyebrow` .22em, `--ls-brand` .24em, `--ls-sub` .4em. (`--ls-label` .2em already exists.)

### 2.6 Spacing actually used

- Gaps: 0, 1, 2 (×17), 3 (×12, segment gaps), 4 (×22), 5, 6 (×38), 7, 8 (×44), 10 (×64), 11, 12 (×24), 14 (×47), 16 (×26), 18 (×10), 20, 22 (×9), 24, 26, 28, 30, 36, 40, 44, 60, 96.
- Padding pairs: 0 14 (×38), 6 10 (×23), 0 16 (×20), 12 0, 16, 0 22, 0 36 (×12, header), 12 18 (×12, COMM line), 0 10, 14, 0 28, 10, 20 (×9, panels), 0 12, 0 26 (S CTA), 14 18, 16 18, 18 20, 20 22, 22 24, 24 28; page shells 64 72 / 56 64 / 52 64 / 44 48.
- Layout constants:
  - header 76h
  - gutter 36 (`--gutter` ✓); mobile 16 (12 on Mobile-Game)
  - content start y = 100–110
  - panel row y = 236, panel bottom inset 110 (reserved for the COMM / CTA row), bottom row inset 36
  - Hub rail 236w; left panels 300w; right panels 360w
  - QV max-width 1200, side padding 24, section gap 96

Proposed spacing scale (px): **0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 36, 44, 56, 64, 96**, plus `--seg-gap: 3px`. Snap these: 5 → 4/6, 7 → 6/8, 9 → 8/10, 11 → 10/12, 18 → 16/20, 22 → 20/24, 26 → 24/28, 30 → 28, 34 → 36, 40 → 44. The 14 is heavily used (×85), so keep it.

**Control heights in use:**

| Height | Uses |
|---|---|
| 44 | ×34 (`--hit` ✓; HUD buttons, index links, mobile chips) |
| 46 | hub card buttons, link rows |
| 48 | skip chip, board header, mobile actions |
| 52 | S CTA, inputs |
| 54 / 56 | mobile QV actions, Badminton hold, QV hero CTAs |
| 62 | M CTA |
| 64 | mobile CTA |
| 70 | channel card |
| 74 / 78 | L / XL CTA |
| 110 | mobile tap |

Propose `--h-sm 44`, `--h-md 52`, `--h-lg 62`, `--h-xl 78`, `--h-tap 110`.

### 2.7 Shadows / glows (MISSING as tokens; all raw)

| Proposed token | Value | Uses / files |
|---|---|---|
| `--shadow-board` | 0 0 0 8px #0A0D11, 0 0 0 9px #1B2129, 0 50px 140px rgba(0,0,0,.7) | Main (Intro: ring #232A33; Mobile: 0 0 0 5px #0A0D11 only) |
| `--glow-board-on` | + 0 0 120px rgba(215,255,63,.06) | Intro `boardOn` end |
| `--glow-board-hit` | ring #D7FF3F + 0 0 90px rgba(215,255,63,.45) | Intro `boardHit` |
| `--glow-bank-lg` | 0 0 40px 12px rgba(228,238,252,.45), 0 0 220px 80px rgba(200,216,238,.14) | Main, Intro (Cricket: .42/.12, 200px 70px) |
| `--glow-bank-sm` | 0 0 30px 10px rgba(228,238,252,.40), 0 0 160px 60px rgba(200,216,238,.10) | Main, Intro |
| `--glow-bank-mini` | 0 0 22px 6px / 26px 8px rgba(228,238,252,.4); 0 0 20px 6px .45 + 0 0 80px 30px .12; 0 0 30px 10px .35 | Hub, Opening, Mobile-Landing |
| `--glow-flare` | 0 0 80px 30px rgba(255,255,255,.9), 0 0 420px 180px rgba(220,232,250,.35) | Intro `flare` |
| `--glow-ring` | 0 0 18px rgba(215,255,63,.6) | tracking rings ×3 |
| `--glow-cta` | 0 0 40px rgba(215,255,63,.25); pulse 30px .25 ↔ 60px .55 | Main, Intro |
| `--shadow-card-3d` | 0 30px 80px rgba(0,0,0,.5) | Tennis courtside cards |
| `--shadow-toast` | 0 20px 60px rgba(0,0,0,.6) | Easter toast |
| `--shadow-holo` | 0 60px 120px rgba(0,0,0,.7), 0 0 60px rgba(215,255,63,.10) | Player-Card |
| `--glow-cursor` | 0 0 12px rgba(255,255,255,.9) / 0 0 10px #fff | meter cursor |
| `--inset-cabinet` | inset 0 0 120px rgba(0,0,0,.8) | trophy cabinet |
| Text glows | name 0 0 28px rgba(255,255,255,.35) (Main), 24px .30 (Intro), 20px .3 (Mobile), 12px .35 (Opening); subtitle 0 0 18px rgba(215,255,63,.45); call 0 0 40px rgba(0,0,0,.8); Easter H1 0 0 50px rgba(215,255,63,.25); letter-lock 0 0 30px rgba(215,255,63,.9) | 6 files |

### 2.8 Blur

| Value | Uses | Status |
|---|---|---|
| 14px | ×30 | glass ✓ token |
| 6px | ×4 | light cones, MISSING `--blur-beam` |
| 10, 12, 16, 2, 0 | — | animation keyframes only (Intro, Main) |
| 2px | — | static filter on Intro trail line |

### 2.9 Borders

| Value | Uses | Token |
|---|---|---|
| 1px solid #1C232C | 109 | `--line` ✓ |
| 1px solid #2A323C | 40 | `--line-strong` ✓ |
| 1.5px solid #D7FF3F | 16 | YS mark, MISSING `--bw-brand: 1.5px` |
| 1px solid #3A434C | 14 | MISSING `--line-3` |
| 1px solid #1A2028 | 11 | scoreboard internal, MISSING |
| 2px solid #E8EEF3 | 8 | court lines |
| 1px solid #D7FF3F | 7 | selected / volt-outline |
| 1px solid #232A33 | 6 | board border |
| 1px solid rgba(215,255,63,.45) / .35 | 5 / 2 | volt-edged |
| 2px solid #D7FF3F / #F2F4F5 | 5 / 3 | tracking rings (Yash / You) |
| 3px solid {edge} | — | selected-row left edge (Career, Highlights) |
| 4px solid #F2F4F5 | — | net tape |
| 1px dashed #2A323C | — | locked slots, after-send box |
| 2px dashed #3A434C | — | locked trophy |
| 1px dashed #D7FF3F | — | meter smash line |
| 1px dashed rgba(242,244,245,.35) | — | tennis aim zone |
| 2px dashed #D7FF3F | — | Game-System skip path |

Radius: the token is 0 and is respected, except for 50% dots/rings and 3px on floodlight housings in Main and Intro only (square elsewhere, which is inconsistent).

### 2.10 Flagged inconsistencies (summary)

1. Glass α .62 vs .66; border .10 vs .09 (Main and Intro vs the rest). Mobile uses .7 / .8 / .85 with no blur.
2. Link hover #EBFF9E vs `--volt-hover` #E6FF7A.
3. Empty segment #26303A (Direction, Hub) vs #1E262F (Attributes); segment height 8 vs 10.
4. Scoreboard border #232A33 (Main) vs #2A323C (Intro); outer ring #1B2129 vs #232A33; internal rules #1A2028 ≠ `--line`.
5. Floodlight bank size and radius differ between Main (112×48 / 84×36, r3) and Intro (112×44 / 84×32, r3); other screens are square, and every venue uses a different mini size.
6. Crowd dot: 1px / 1.7px stop in Main and Intro vs 1.6px elsewhere; grid 7×6 vs 6×5 (Opening, Mobile).
7. Seven different page grounds (see table).
8. YS mark sizes: 38/18 (desktop), 36/17 (QV), 34/16 (mobile), with no shared token.
9. Skip chip heights: 48 (games), 46 (hub cards), 44 (Direction, mobile).
10. CTA label tracking: .14 (most), .16 (BOWL), .1 (Player-Card actions), .12 (mobile QV).
11. Display tracking: README says "+4–14%", but headings mostly use 0–.02em.
12. Mono: 70 uses at 9–10px and tracking of .1/.12em, both below the README's 11–13px and 14–24% rule.
13. `--fs-h1` 120 / `--fs-h2` 84 vs actual page H1 84 and Direction's "H2 56/0.9".
14. Fonts loaded but unused: Big Shoulders 600 and JetBrains Mono 500. Archivo 500 is used (italic challenge, Direction specimen). Archivo italic 400 / 500 are both used.

---

## 3. Component inventory

Count: **62 distinct patterns** (P = primitive, C = composite, S = scene / decorative). "Files" lists artboards where the pattern appears.

### 3.1 Chrome and navigation

| # | Component | Files | Anatomy | Variants (exact deltas) | States | Props | A11y |
|---|---|---|---|---|---|---|---|
| 1 | **BrandMark (YS)** P | 15 (all product desktop + QV, Mobile-Landing, Mobile-Hub, Player-Card card) | D 800 "YS" in a square, 1.5px volt border, volt text | 38×38 / 18px (desktop); 36×36 / 17px (QV); 34×34 / 16px (mobile). Optional wordmark: M 12 / .24em #A3ADB7 "THE ARENA" (gap 14) or breadcrumb or "SCOUTING REPORT" (.22em, gap 12) | link (Hub → Main; game and content pages → Hub) or static (Main, Intro, mobile) | `size`, `label?`, `href?` | as a link it needs an accessible name ("Back to Arena Hub"); Intro wraps it in a header with `pointer-events:none` |
| 2 | **Breadcrumb** P | 10 | M 12 / .24em #A3ADB7 next to YS: "HUB / CRICKET GROUND / CAREER STATS" | depth 1–3 | — | `trail[]` | the whole group is one `<a>` to Hub: only the first crumb is navigable. Should be `<nav aria-label="Breadcrumb">` |
| 3 | **TopHUD** C | 14 desktop | `<header>` abs, 76h, padding 0 36, flex space-between, 3 slots | (a) landing: transparent, right = audio + skip; (b) game: bg linear-gradient(180deg, rgba(5,7,10,.85) → 0) (badminton uses rgba(7,6,10,.85)), centre = ScoreBug, right = QUICK VIEW + audio; (c) content: transparent, right = REMATCH + QUICK VIEW; (d) minimal: QUICK VIEW only (Trophy, Player-Card, Team-Up); (e) Intro: `pointer-events:none`, right = REPLAY + SKIP INTRO; (f) Hub: centre label "ARENA HUB" M 12 / .2em | — | `left`, `center`, `right`, `variant` | z-index 5–10; no landmark nav |
| 4 | **StickyHeader (QV)** C | QuickView | sticky, bg rgba(5,7,10,.86) + blur 14 + border-bottom #1C232C; inner max-w 1200, padding 0 24, min-h 68, wraps | — | — | `sections[]` | `<nav aria-label="Sections">`, anchor links; no active-section state |
| 5 | **HUDButton** P | 13 | glass, h 44, padding 0 16, M 12 / .16em #F2F4F5, `box-sizing:border-box` | text: QUICK VIEW, REMATCH, SKIP INTRO, REPLAY; icon + text (CROWD ON, gap 10); icon-only 44×44; mobile: no glass, 1px #2A323C (or bg rgba(14,19,26,.7/.8)), padding 0 12, M 11 / .14em | no hover defined (only the base `a:hover` colour). Main's SKIP INTRO is a `<button>` with no action; Intro's is an `<a>` | `as`, `icon?`, `label` | 44 hit ✓ |
| 6 | **QuickViewChip** P (HUDButton preset) | Hub, Cricket-Play, Cricket-Career, Tennis-Play, Tennis-Highlights, Badminton-Play, Badminton-Attributes, Trophy, Player-Card, Team-Up, Mobile-Hub | "QUICK VIEW" → /scout | glass (desktop) / bordered (mobile). Inverse on QV: "ENTER THE ARENA" 1px volt border + volt text, min-h 44; mobile-QV "ARENA →" text link | **missing** on Intro, Easter-Egg, Mobile-Game, Mobile-Landing (Main uses the CTA instead) | — | the rule "Quick View on every screen / every game screen" is broken on Mobile-Game and Easter-Egg |
| 7 | **AudioToggle** P | Main, Hub, Cricket-Play, Tennis-Play, Badminton-Play, Mobile-Landing | speaker SVG 18px, stroke 1.6 | Main: icon with 3 waves + "CROWD ON", `aria-label="Crowd audio on"`; Hub and games: 44×44 icon with **2 waves**, "Toggle crowd audio"; Mobile: text "SOUND OFF", `aria-label="Crowd audio off"`, bg rgba(14,19,26,.7), border rgba(255,255,255,.1), #C3CBD3 | on/off visuals undefined (is wave count the state?) | `on`, `variant: labelled\|icon\|text` | needs `aria-pressed`; state must persist ("one mute toggle, remembered") |
| 8 | **RecordChip** P | Hub | glass 44h, padding 0 14, M 12 / .14em: "RECORD" #A3ADB7 + value #F2F4F5 | — | — | `yash`, `you` | value "YASH 1 · YOU 0" contradicts "99 – 1" elsewhere (§7) |
| 9 | **SkipChip** P | Cricket-Play, Tennis-Play, Badminton-Play, Hub (×3), Direction, Mobile-Hub, Mobile-Game | game: glass, abs right 36 bottom 36, h 48, padding 0 20, gap 10, M 12 / .16em + 16px arrow SVG (stroke 1.8), "SKIP TO {SECTION}" | Hub card: h 46, padding 0 14, 1px #2A323C, M 11 / .14em "SKIP →" (not glass); Direction: glass 44h padding 0 14 11px; mobile: 44h top-right, bg rgba(14,19,26,.8) + #2A323C; Mobile-Hub: 48h grid cell, "SKIP →" / "SEE STATS →" | — | `to`, `label`, `size` | ≥44 ✓. Position differs on mobile (top-right) vs desktop (bottom-right) |
| 10 | **IndexRail** C | Hub | glass aside, left 36 top 104 bottom 36, w 236, padding 20 18, gap 18 | sections: MatchdayCard → nav → HiddenAchievements footer (`margin-top:auto`) | link hover bg rgba(255,255,255,.05); tag "SEEN" volt vs category grey #7D8893 | `progress`, `links[{label, tag, seen, href}]`, `achievements` | `<nav aria-label="Portfolio index">` ✓, links min-h 44 ✓, no `aria-current` |
| 11 | **IndexLink** P | Hub | min-h 44, padding 0 10, B 15 #F2F4F5 + right tag M 10 | tag colours volt (SEEN) / #7D8893 | hover .05 | `label`, `tag`, `seen` | — |
| 12 | **MobileTabBar** C | Mobile-Hub | abs bottom, 76h, bg rgba(10,13,17,.94), border-top #1C232C, 5-column grid; each item: 20px SVG (stroke 1.7) + M 9 / .14em label, gap 5 | items ARENA / CAREER / PROJECTS / SKILLS / TEAM UP | active volt, inactive #A3ADB7 | `items[]`, `active` | `<nav aria-label="Main">` ✓; needs `aria-current`; 9px label too small. Trophy, Academy and Player Card are not in tabs |
| 13 | **StickyBottomActions** C | Mobile-QuickView | abs bottom, padding 12 16 24, bg linear-gradient(180deg, rgba(5,7,10,0), #05070A 30%), 2-col grid gap 10 | PLAYER CARD (bg #0B0F14 + 1px #3A434C) / TEAM UP (volt), 54h, D 17 / 900 / .12em | — | `actions[2]` | safe-area inset not handled |
| 14 | **KeyboardHint** P | Main, Hub, Player-Card | M 12 (11 on Player-Card) / .14em (.18) #7D8893 | "ENTER ↵ TO PLAY · Q FOR QUICK VIEW", "DRAG TO ORBIT · 1 2 3 TO PICK A VENUE", "DRAG TO TILT · CLICK TO FLIP FOR FULL RESUME"; Easter-Egg status "TROPHY ADDED TO YOUR CABINET" | — | `text` | ⚠ implies global key handlers outside games, which the README forbids |

### 3.2 Buttons and links

| # | Component | Files | Anatomy | Variants (exact) | States | Props | A11y |
|---|---|---|---|---|---|---|---|
| 15 | **SkewCTA** P | Main, Intro, Cricket-Play, Cricket-Career, Tennis-Highlights, Badminton-Attributes, Player-Card, Team-Up, Easter-Egg, Direction, Opening (minis) | `transform: skewX(-12deg)` on the box; label wrapper `skewX(12deg)`; D label | **primary** bg #D7FF3F, ink #0A0C08; **secondary** `.glass`, #F2F4F5. Sizes: **XL** 310×78, two-line (D 26 / 800 / .14em + M 11 / .14em sub #2E3A0A / #A3ADB7, gap 4), Main; **L** 340×74, D 28 / 900 / .14em, Intro, with pulsing glow; **M** h 62, padding 0 34–44, D 24–26 / 900 / .14–.16em (BOWL · SPACE, SEE THE FULL SCORECARD, BOWL AGAIN, CLAIM YOUR WICKET, SEND CHALLENGE padding 0 40, Easter ENTER padding 0 28 22px); **S** h 52, padding 0 26, D 20 / 800 / .14em (next-venue CTAs, Direction) | hover: primary bg #E6FF7A (Main, Intro, Cricket); secondary bg rgba(255,255,255,.10) (Main). Active: `skewX(-12deg) scale(.97)` (Cricket only). Idle: `ring` pulse (Cricket BOWL), `cta` glow pulse (Intro). Spec'd but not drawn: floodlight sweep on hover (300ms), focus, disabled | `variant`, `size`, `subLabel?`, `icon?`, `pulse?`, `as` | skew must not distort the focus ring; label counter-skew. Mobile drops the skew |
| 16 | **Button (flat)** P | Hub, Badminton-Play, QuickView, Mobile ×3, Player-Card | unskewed rectangle | Hub venue PLAY/REMATCH: h 46, flex-grow, volt, D 18 / 800 / .14em; Badminton HOLD · RELEASE: h 56, D 22 / 900 / .14em; QV hero: min-h 56, padding 0 28, D 20 / 900 / .14em, primary volt / secondary 1px #3A434C; mobile CTA: h 64 two-line D 22 / 900 / .14em + M 10 sub; mobile tap: 100% × 110, D 34 / 900 / .14em; mobile QV: 54h D 17 | none drawn | same as SkewCTA + `skew=false` | → merge with SkewCTA via a `skew` prop |
| 17 | **ActionRow** C | Player-Card | full-width row, label stack (D 24 / 900 / .1em + M 11 sub) + right icon 20–22px | primary: 74h volt (sub #2E3A0A); secondary: 64h glass, D 20 / 800 / .1em, sub #A3ADB7 | `.act:hover` border volt | `title`, `sub`, `icon`, `href` / `onClick`, `download?` | COPY SCOUTING LINK has no success feedback state |
| 18 | **LinkRow** P | Tennis-Highlights, QuickView team-up | Highlights: 46h, padding 0 14, 1px #2A323C, M 12 / .14em, "↗" right; primary filled volt 700. QV: min-h 56, B 18 / 600, border-bottom rgba(10,12,8,.25) on volt bg | `.lnk:hover` border volt | `label`, `href`, `external`, `variant` | ↗ is a text glyph; needs "opens in new tab" text when external |
| 19 | **TextLink** P | Cricket-Career "VIEW PLAYER CARD →", QV "MORE ON GITHUB ↗", footer, Trophy "LEETCODE ↗" | M 12 / .14–.16em, volt, no underline; hover #EBFF9E | — | — | — | — |
| 20 | **ChannelCard** C | Team-Up | glass 70h, grid 44px \| 1fr \| 20px, gap 14, padding 0 18; 22px stroke icon (volt, 1.6); D 20 / 800 / .08em title + M 12 #A3ADB7 sub; "↗" | EMAIL, LINKEDIN, GITHUB, CODING PROFILES | `.chan:hover` border volt | `icon`, `title`, `sub`, `href` | CODING PROFILES links only to LeetCode while listing 3 platforms |

### 3.3 Broadcast kit (signature)

| # | Component | Files | Anatomy | Variants | States | Props | A11y |
|---|---|---|---|---|---|---|---|
| 21 | **ScoreBug** C | Direction, Cricket-Play, Tennis-Play, Badminton-Play, Mobile-Game, Easter-Egg (flipped) | flex stretch, h 44 (Direction 46, mobile 40): **name chip** bg #F2F4F5, ink #05070A, D 20 / 800 / .06em, padding 0 14 → **score cells** bg #0E141B, D 24 / 800, padding 0 14–16 (2nd cell #A3ADB7 + border-left #1C232C) → **opponent chip** bg #1C232C, #A3ADB7, D 20 / 800 / .06em → **status chip** volt, M 11 / 700 / .16em, padding 0 12 | Cricket: YASH \| `{runs}*` \| mono chip "BALL n OF 3" (#1C232C / #C3CBD3, 11 / .16em) \| "YOU BOWLING" (#0E141B, border-left), no volt status chip. Tennis: serve dot 7×7 #B8D92E inside the name chip; 40 \| 30 \| YOU \| RALLY 3. Badminton: 20 \| 19 \| YOU \| **MATCH POINT on #FF4D3D / #FFF** (violation). Mobile: 40h, 16 / 20 / 10px sizes, padding 0 10 / 0 8. Easter flipped: 64h, bg #06080B, border #232A33, YOU chip volt D 30 / 900 / .06em padding 0 22, digits D 40 / 900, loser digit #5D6670, YASH #7D8893 struck through, `.glitch` | digit flip (spec "score bugs flip digit by digit", not drawn) | `home`, `away`, `scores[]`, `meta?`, `status?`, `statusTone: volt\|alert`, `flipped?`, `serving?` | needs `aria-live="polite"` text equivalent ("Yash 14 not out, ball 2 of 3") |
| 22 | **CommentaryLowerThird** C | Main, Intro, Hub, Cricket-Play, Cricket-Career, Tennis-Play, Tennis-Highlights, Badminton-Play, Badminton-Attributes, Player-Card, Easter-Egg, Direction, Team-Up (inline) | abs left 36 bottom 36 (Hub: left 304); flex stretch: **tag** volt bg, M 11 / 700 / .2em, padding 0 14, "COMM" + **line** glass, padding 12 18, B 16 italic #E6EAEE | Team-Up inline: tag padding 0 12, line bg #0E141B, padding 10 14, 15px. Entrance: `rise` in Main / Intro only | spec: slide in from left, hold 4s (`--comm-hold`), exit, one at a time, "never during reading". None drawn | `line`, `queue?`, `hold=4000` | live region (`aria-live="polite"`); not on mobile; not on Trophy-Room |
| 23 | **LiveDot** P | Main, Intro, Cricket-Play, Tennis-Play, Tennis-Highlights, Badminton-Play, Direction, Opening, Mobile-Landing | circle #FF4D3D | 8px (board headers), 6px (pills, replay chip, mobile), 10px (Direction swatch); Main pulses (`pulse` 1.6s) | pulse / static | `size`, `pulse` | decorative, `aria-hidden` |
| 24 | **PlayerTag (on-field pill)** P | Cricket-Play, Tennis-Play, Badminton-Play, Mobile-Game | glass, padding 6 10, M 11 / .16em, gap 8, LiveDot 6 | "YASH · ON STRIKE · {score}", "YASH · SERVING · 186 KM/H", "YASH · READING YOUR GRIP"; mobile: padding 4 7, M 9, bg rgba(14,19,26,.85) + #2A323C, no dot | — | `text`, `live` | decorative in game |
| 25 | **MonoLabel / Eyebrow** P | all | M, uppercase | panel label 11 / .2em #A3ADB7; page eyebrow 12 / .22em volt; spec eyebrow 12 / .24em volt; gold eyebrow #D4B26A (Trophy); right-side meta 11 / .14em | — | `tone: grey\|volt\|gold\|dim`, `size` | — |
| 26 | **DisplayHeading** P | all | D 900, uppercase | h1 84 / .85; Team-Up 96; Hub 56 / .9; spec h2 64 / 50 / 48; card 34 / 36 | — | `level`, `size` | real `h1`/`h2` used ✓ |
| 27 | **PageHeader** C | Cricket-Career, Tennis-Highlights, Badminton-Attributes, Trophy-Room, Player-Card, Team-Up, Hub | abs left / right 36, top 100, flex space-between, align end; Eyebrow + H1 (gap 6) + right slot | right slot: StatTiles (Career), Legend (Attributes), "3 OF 3 UNLOCKED" (Highlights), none | — | `eyebrow`, `title`, `aside?` | — |
| 28 | **StatTile / StatCounter** C | Cricket-Career, Player-Card, Hub, Main / Intro (board strip) | glass 170w, padding 14 18, gap 2: M 11 / .18em label + D 40 / 900 / lh 1 value; `.tick` stagger 0 / .1 / .2s | volt variant (bg volt, label #2E3A0A); Player-Card cell: bg #0B0F14, padding 10, M 10 label + D 24 / 900 (first 3 volt, last 3 white; rule undefined); board strip cell (label M 11 / .2em #7D8893 + D 24 / 800 / .08em; Intro 22); Hub "1 OF 3 VENUES" D 30 / 900 | count-up 900ms tabular (spec, not drawn) | `label`, `value`, `tone`, `countUp?` | tabular-nums; announce the final value only |
| 29 | **SegmentedStatBar** P | Direction, Badminton-Attributes | 10 cells, gap 3; h 8 (Direction) / 10 (Attributes) | fill: shipped 9 × #D7FF3F, built 7 × #F2F4F5, kit 5 × #7D8893; empty #26303A / #1E262F; `.seg` fill anim .35s, delay i × .04s | — | `level: shipped\|built\|kit`, `segments=10` | expose as text ("Shipped in production"), never as a percentage; `role="img"` + label |
| 30 | **SkillRow** C | Badminton-Attributes | grid 130px \| 1fr \| 92px, gap 14: M 13 name + SegmentedStatBar + M 11 / .14em tier (level colour, right aligned) | tier text = custom tag (75+ TESTS, 750+ SOLVED, BLOGS) or SHIPPED / BUILT / KIT BAG | — | `name`, `level`, `tag?` | — |
| 31 | **Legend** P | Badminton-Attributes, QuickView | swatch 18×8 + M 11 / .16em label, gap 8 (row gap 18) | QV: text-only "FILLED = SHIPPED IN PRODUCTION AT DEUTSCHE BANK" | — | `items[]` | — |
| 32 | **ProgressSteps** P | Hub (matchday), Tennis-Play (rally), Tennis-Highlights (replay) | Hub: 3 × h 4, gap 4 (volt / #26303A); Tennis: 3 × 84×6, gap 6 (volt, current = volt .35); replay: 4px track #1C232C, fill volt 38% | — | `steps`, `done`, `current?` / `value` | `role="progressbar"` or text |
| 33 | **StackTag / Chip** P | Cricket-Career, Tennis-Highlights, Badminton-Play, QuickView, Mobile-QuickView | M 12, 1px #2A323C, no fill | Career: h 32, padding 0 12; Highlights: h 30, padding 0 10; toast: padding 5 9; QV attribute chip: padding 6 10, M 13, **filled volt** (shipped) vs 1px #3A434C (built/kit); QV hero meta chip: padding 8 12, M 12 / .12em #C3CBD3 + 1px #2A323C, volt-outline highlight; mobile: padding 6 8, M 10 / .1em | — | `label`, `tone: outline\|volt-fill\|volt-outline` | list semantics (`ul`) |
| 34 | **KeyValueRow** P | Badminton-Attributes, Player-Card, Tennis-Highlights (shot data), QuickView trophies | flex space-between | Attributes: B 14 #A3ADB7 / 14; Player-Card: padding 12 0, border-top #1C232C, B 15, accent value volt; shot data: stacked M 11 / .14em label + B 14 value, border-bottom; QV: B 16 + M 12 right | — | `k`, `v`, `accent?` | use `<dl>` |

### 3.4 Panels and cards

| # | Component | Files | Anatomy | Variants | States | Props | A11y |
|---|---|---|---|---|---|---|---|
| 35 | **GlassPanel** P | 12 desktop files | `.glass`; panels padding 20 (most), 20 22, 22 24, 18 20; gap 12–18 | default; `edge=volt` (border-color volt .35 / .4 / .45); `elevated` (+ shadow-card-3d); `solid` (#0E141B or gradient 160deg #0E141B → #0A0E13 + #1C232C border: Trophy academy); `dashed` (1px dashed #2A323C, locked); mobile solid | hover border volt .55 (venue card) | `edge`, `elevation`, `as` | — |
| 36 | **VenueCard** C | Hub | glass article, overflow hidden, column. **Art** 200h: radial-gradient(ellipse 70% 60% at 50% 100%, mid, deep 60%, #05070A) + mini floodlights + perspective court (perspective 500, rotateX 58–60deg). **Body** padding 18 20, gap 8: meta row (M 11 / .2em "VENUE 0n" + status M 11 / .14em), D 34 / 900 / .95 name, B 15 / 1.45 #C3CBD3 description, M 11 / .14em #7D8893 "REVEALS · X · ~Ns", action row (`margin-top:auto`, gap 10): flat primary 46h + SkipChip 46h | positions: rotateY(10deg) / translateY(-14px) / rotateY(-10deg) inside a perspective-1600 grid. Turf: #185634 / #0A2015, oval pitch #2E8A50 → #13432A + wicket #8C7650. Court: #1B4C76 / #0A1A2B, court #16456E, lines #E8EEF3. Hall: #5A3E22 / #22170D (60% 70% ellipse), court #2B3A33, roof arc, warm beam | **played**: border volt .35, status volt "PLAYED · 14* NOT OUT", CTA "REMATCH"; **unplayed**: status grey "UNPLAYED", CTA "PLAY"; hover: translateY(-8px) rotateY(0) + border volt .55 (transition .5s follow / .3s). Spec says "tilt toward cursor up to 6°", but the drawn hover *removes* tilt. No locked/disabled | `venue`, `status`, `score?`, `revealsLabel`, `duration`, `playHref`, `skipHref`, `arcPosition` | `article` ✓; keyboard shortcuts 1/2/3 implied |
| 37 | **VenueFixture (mobile)** C | Mobile-Hub | border 1px (played volt .45, else #1C232C), bg linear-gradient(90deg, venueRGBA .45–.5, rgba(14,19,26,.8) 60%); padding 14 16 header: M 10 / .18em meta + right status / duration; D 28 / 900 name; 2-col action bar border-top #1C232C, 48h cells | played (REMATCH / SEE STATS →) vs unplayed (PLAY / SKIP →) | — | same as VenueCard | — |
| 38 | **FacilityTile** C | Hub, Mobile-Hub | Hub: glass 96h, padding 16 18, column space-between: M 11 / .2em label + D 26 / 800 / .04em name; mobile: 64h, padding 10 12, 1px #1C232C, M 10 / .16em + D 18 / 800 | volt variant (TEAM UP: bg volt, label #2E3A0A) | no hover drawn | `label`, `title`, `href`, `tone` | links ✓ |
| 39 | **RevealSlotList ("Stadium screen")** C | Cricket-Play (+ Mobile-Game reveal chip) | glass 360w panel; header row; per slot: border-top #1C232C, padding-top 12 | **open**: `.pop`, M 11 / .16em volt "INNINGS n · STATUS", D 24 / 800 / .03em team, B 14 role · span. **locked**: 56h row, M 11 / .16em #7D8893 "INNINGS n · LOCKED" + "BOWL BALL n". Mobile chip: bg rgba(14,19,26,.85), border volt .45, padding 12 14, M 10 + D 22 / 800 + B 13 | open / locked | `slots[]`, `unlocked` | announce reveals via the live region |
| 40 | **AttributeToast** C | Badminton-Play | glass, padding 16 18, gap 10; row (M 11 / .18em volt "ATTRIBUTE CHARGED · RALLY n" + M 11 grey shot) + D 30 / 900 group + chips | newest: border volt .45; locked: dashed 1px #2A323C, padding 14 18, both labels #7D8893 ("FRONTEND · LOCKED / WIN RALLY 3") | `slidein` stagger .25s | `rally`, `group`, `shot`, `skills[]`, `locked` | — |
| 41 | **CourtsideHighlightCard** C | Tennis-Play | glass 300w, padding 18, gap 10; rotateY(±32deg) with origin at the outer edge in perspective 900; border volt .4; shadow-card-3d; header M 11 / .18em volt "HIGHLIGHT 01 · QF" + "RALLY 1"; MediaPlaceholder 110h; D 26 / 800 name; B 13 line | left / right | appear on each return (not drawn) | `side`, `round`, `rally`, `project` | — |
| 42 | **MediaPlaceholder / ReplayPanel** C | Tennis-Play, Tennis-Highlights | repeating-linear-gradient(135deg, a 0 N, b N 2N) + centred M 11–12 #7D8893 "[SCREEN RECORDING]" | small: 110h, stripes #0E141B / #121A23 at 10px; replay: 230h, #0B1118 / #0F1720 at 14px, border #1C232C, top-left chip (bg #05070A, padding 6 10, LiveDot + "REPLAY" M 11 / .2em), top-right round chip (volt text), bottom 4px progress | empty (all `media: null`) | `media?`, `round`, `progress` | needs video controls / captions when media exists |
| 43 | **ProblemApproachResult** C | Tennis-Highlights | grid 3 cols, gap 2, cells padding 16, gap 8: M 11 / .2em label + B 14 / 1.5 text | Serve / Rally = glass; Winner = bg volt .08 + border volt .35, label volt | — | `serve`, `rally`, `winner` | — |
| 44 | **SelectableListRow** C | Cricket-Career (scorecard rows), Tennis-Highlights (reel) | `<button>`, border-left 3px edge, border-bottom #1C232C, bg | Scorecard: grid 56px \| 1.4fr \| 1.2fr \| 1.3fr \| 110px, gap 16, min-h 84, padding 0 22; D 34 / 900 number, D 24 / 800 / .03em team, B 15 role, M 12 span, M 11 / .16em status (NOT OUT volt / else white). Reel: column, min-h 96, padding 14 18, M 11 / .18em round, D 24 / 800 / .02em name, B 13 kind | **selected**: edge volt, bg volt .06, number / round volt; **idle**: transparent, #7D8893; hover bg rgba(255,255,255,.04) (.2s) | `selected`, `onSelect`, row data | should be `role="tab"` + `aria-selected` or `aria-pressed`; detail pane = `tabpanel` |
| 45 | **DataTableHeader** P | Cricket-Career, Game-System | M 11 / .16–.18em #A3ADB7, 48h, border-bottom | — | — | `columns[]` | Career uses buttons in a div grid rather than `<table>`; consider a real table + row buttons |
| 46 | **BallByBallList** C | Cricket-Career | rows grid 44px \| 1fr, gap 10, padding 9 0, border-top: M 12 volt over ("0.1") + B 14 / 1.42 #E6EAEE | — | — | `items[]` | `<ol>` |
| 47 | **TrophyCabinet + Trophy** C | Trophy-Room | cabinet: bg linear-gradient(180deg, #0A0C10, #07080B), border #1C232C, inset 0 0 120px rgba(0,0,0,.8), reflection overlay linear-gradient(115deg, white .05 → 0 30% … .03 70% → 0 80%); 2 shelves (310h; 6px glass shelf at 308 with glow); 3-col grid. Trophy = `<button>`: Spotlight cone + figure + plinth (90×26 or 22, #13171C, border-top #2A323C) + D 20 / 800 / .04em title + M 11 / .14em sub | types: **cup** (84×70 bowl gradient 90deg #7A5E2A → #F0D998 38% → #B8934A 62% → #6A5023; handles 5px #B8934A; stem 12×30; base 64×12); **medal** (ribbon 40×44 navy #1E2A3A with volt stripe; disc 74 radial #F4F6F7 → #A9B2BA → #5E6770, "99.5" D 20); **plaque** (96×118, 3px #B8934A, inner 60×70 gold, "PAPER"); **pennant** (CSS triangle 34 / 34 / 84 #C9A55A); **round** (62px gold disc + ring); **locked** (2px dashed #3A434C outline, "?", opacity .6, `<div>` not button, #7D8893 text) | selected: spot α .30 vs .18 / .16 (only cue; "selected" otherwise only in aria-label). Hover: translateY(-6px) (.4s follow). Spec: spotlight drop 400ms, 12s turntable on selected (not drawn; unused `@keyframes spin`) | `type`, `title`, `sub`, `selected`, `locked`, `onSelect` | buttons ✓ with aria-labels; needs `aria-pressed` |
| 48 | **TrophyDetailPanel** C | Trophy-Room | glass, h 262, padding 20 22, gap 10: gold eyebrow "ON THE PLINTH" + counter "1 / 5"; D 36 / 900; M 12 / .12em sub; B 15 / 1.5 para; links row M 12 / .14em gap 18 | only state 1 drawn | — | `trophy`, `index`, `total`, `links[]` | `aria-live` on change |
| 49 | **AcademyCard** C | Trophy-Room (+ QV variant) | gradient panel (160deg #0E141B → #0A0E13), border #1C232C, padding 20 22; header row; D 36 title; grid 72px \| 1fr with monogram tile (72×72, 1px #2A323C, D 22 / 900 / .06em volt "PICT") + B 18 / 600 school, B 14 degree, M 12 dates; "EXTRA DRILLS" block | QV: plain rows | — | `academy` | — |
| 50 | **PlayerCard (holo)** C | Player-Card | 400×640 article in perspective 1400; bg linear-gradient(160deg, #141B23 0%, #0A0E13 55%, #11160E 100%); border volt .45; shadow-holo; `.sheen` overlay (105deg multi-stop, 250% size, 4.5s); `.card` float 6s; header (D 64 volt "SE" + M 10 "POSITION" / YS mark + "SEASON 2026"); portrait 250h (radial volt .14, border-bottom volt .35); D 52 name; M 12 / .24em subtitle; stat grid 3×2 (gap 1 on #1C232C); footer M 10 / .2em #7D8893 | back face "click to flip" (**not designed**) | drag-tilt, flip (spec only) | `player`, `stats[]`, `season` | the card is not focusable; the flip needs a button |
| 51 | **PortraitFrame** P | Badminton-Attributes, Player-Card | `<img>` rest.webp, `mix-blend-mode:lighten`, mask linear-gradient(180deg, #000 75%, transparent 100%), bottom-centred | Attributes: 320×258 in 250h box (bg linear-gradient(180deg, #141B23, #0B0F14), border #1C232C), overlay D 52 "SE" + M 10 "POSITION"; Card: 340×274 | — | `src`, `size` | alt "Yash Sarda" ✓ |
| 52 | **AchievementToast** C | Easter-Egg | flex stretch: volt icon block 64w (28px trophy SVG, ink stroke 1.8) + glass body (padding 12 22, gap 2, M 11 / .22em volt eyebrow + D 26 / 900 / .06em title); shadow-toast; `drop` .7s @ .4s | — | — | `icon`, `eyebrow`, `title` | `role="status"` |
| 53 | **UnlockPanel** C | Easter-Egg | glass 720w, padding 24 28, border volt .45, grid 1fr \| auto, gap 20: eyebrow + D 36 title + B 15 desc; SkewCTA M (ENTER, 22px) | — | — | `title`, `desc`, `href` | ENTER links to `#` (no Locker Room) |

### 3.5 Forms

| # | Component | Files | Anatomy | States | Props | A11y |
|---|---|---|---|---|---|---|
| 54 | **FormatRadioCard** C | Team-Up | `<label>` padding 16, gap 6, column: native radio 18×18 (`accent-color` volt) + D 22 / 900 / .06em title (gap 10) + B 13 #C3CBD3 desc; 3-column grid gap 10 in fieldset / legend (M 11 / .2em) | selected: border volt + bg rgba(215,255,63,.07); idle: border #2A323C; hover border #5D6670. No focus, disabled or error states | `name`, `value`, `title`, `desc`, `checked` | native radio ✓, fieldset / legend ✓ |
| 55 | **TextField / TextArea** P | Team-Up | label M 11 / .2em #A3ADB7 (gap 6) + `.field`: bg #0B0F14, 1px #2A323C, B 16 #F2F4F5, padding 0 14 (textarea 14), h 52 / 110, `resize:none`, outline none; placeholder #7D8893 | focus: border volt (outline removed; no ring). Error, disabled, valid and success states missing | `label`, `type`, `placeholder`, `rows`, `error?` | label `for` ✓; `outline:none` without a replacement focus ring |

### 3.6 Game-specific

| # | Component | Files | Anatomy | Variants / states | Props |
|---|---|---|---|---|---|
| 56 | **TimingMeter (horizontal)** C | Cricket-Play, Mobile-Game | labels row M 11 / .2em (SHORT / YORKER volt / FULL TOSS); track glass 18h (mobile: 16h #0E141B + #2A323C); good zone volt .22; perfect zone volt; cursor 4×34 #FFF glow (mobile 4×30) | desktop good 38–62% / perfect 46.5–53.5%; mobile good 36–64% / perfect 45–55% ("wider on touch"); cursor ping-pong 1.1s | `period`, `perfect`, `good`, `onRelease`, `t0` |
| 57 | **BallTracker** P | Cricket-Play | 3 × 52×52 cells, D 22 / 800, gap 8 | done-for-you: volt bg / ink / volt border; done-against: #0E141B / #F2F4F5 / #3A434C; current: bg volt .08, volt text + border; pending: transparent / #7D8893 / #2A323C | `balls[]`, `current` |
| 58 | **CallOverlay** P | Cricket-Play | abs top 420, full width, D 120 / 900 / .04em, text-shadow 0 0 40px rgba(0,0,0,.8), `.pop` | colour volt (for you: DOT BALL / BOWLED HIM) / #F2F4F5 (FOUR / SIX) | `call`, `forYou` |
| 59 | **PowerMeter (vertical)** C | Badminton-Play | 46w × 360h, bg #0B0F14, 1px #2A323C; top 20% zone bg volt .16 + 1px dashed volt bottom; divider at 60% (1px #3A434C); fill (left / right 4, bottom 4) linear-gradient(0deg, #A3ADB7, #F2F4F5) + glow 0 0 16px rgba(242,244,245,.5); zone legend column (D 26 / 900: SMASH volt, CLEAR white, DROP #A3ADB7 + B 13 / 1.4 notes) | animated 8 → 86% height, 1.4s alternate | `value`, `zones` |
| 60 | **AimZone** P | Tennis-Play | `<button>` 142×60, M 11 / .16em | idle: 1px dashed rgba(242,244,245,.35), bg white .03, #A3ADB7; target / open: 1px solid volt, bg volt .12, volt text; hover bg volt .22 | `side`, `open`, `onPick` |
| 61 | **TrackingRing / TracerPath** S | Cricket-Play, Tennis-Play, Badminton-Play, Mobile-Game | ring: ellipse `border-radius:50%`, 2px volt + glow-ring (Yash: 60×16 / 56×14; mobile 42×12) or 2px #F2F4F5 (You: 72×18 / 70×18); tracer SVG `stroke:#D7FF3F; stroke-width:2.5; dasharray "2 8"; linecap round` (mobile 2, "2 7"); bounce ellipse rx 12–18 ry 4–5; target-length polygons fill volt .16 / .55 | — | `who`, `path`, `bounce` |
| 62 | **LEDMarquee** C | Tennis-Play | 600×30, bg #030405, border #1C232C; inner M 12 / .24em, gap 60, alternating volt / white items, duplicated for a seamless loop | `marquee` 18s linear | `items[]` |

**Reference-board-only patterns** (only needed for a styleguide route): Storyboard frame (Opening; 190h, timecode M 10 tl, D 20 / 800 / .08em title, B 13 caption), Timeline lane (M 10 label 70w + 12h track #0E141B with markers), Easing tile (96×64 SVG on #0A0E13), Camera-move card (130h SVG + text), Loop diagram nodes (220×96, border #2A323C, active volt), Principles list (D 40 / 900 volt number + B 16 / 600 + B 13), Colour swatch tile, Behaviour matrix (Responsive grid 120px + 4 cols).

**Icons used (inline SVG, stroke-based, round caps)**

| Icon | Stroke width |
|---|---|
| speaker (2 or 3 waves) | 1.6 |
| arrow-right | 1.8 |
| download | 1.8 |
| copy | 1.8 |
| mail | 1.6 |
| linkedin-ish | 1.6 |
| code `</>` (GitHub) | 1.6 |
| terminal `>_` (coding profiles) | 1.6 |
| trophy | 1.8 |
| tab icons: arena ellipse, bar chart, play-rect, list, plus-circle | 1.7 |

The "↗", "↓", "→", "←" and "↵" characters are used as text glyphs. Propose one `<Icon>` set with a fixed 24 viewBox and a `stroke` prop.

---

## 4. Scene / background primitives

All scenes are flat CSS layers (absolute divs), not WebGL. README §9 wants R3F/Three on desktop and 2.5D on mobile, so these values become the **mobile / reduced-motion plates** and the art direction reference for the WebGL scene.

| Layer | Values (exact) | Where | Shared / bespoke |
|---|---|---|---|
| **Ground** | #05070A / #030405 / #020304 / #020203 / #07060A / #06060A / #040508 | all | shared concept; per-screen value (tokenise per venue) |
| **Sky glow** | radial-gradient(ellipse W% H% at X% Y%, rgba(150,172,200,α), ground-transparent 70%). Main 75% 50% @ 50% 0, α .20; Intro .18; Hub 70% 40% @ 60% 0, .16; Cricket 70% 50% @ 50% 30%, .14; Tennis 60% 40% @ 50% 0, .14; Career / Highlights / Player-Card / Team-Up 60% 40% @ 50% −10%, .12–.14; Direction 60% 40% @ 85% 0, .10; QV 80% 500px @ 50% 0, .12; mobile 90–100% 30–40%, .14–.20 | 16 files | **shared**; params: `x, y, w, h, alpha` |
| **Venue floor glow** | Career: radial 80% 50% @ 50% 115%, rgba(30,110,64,.40); Highlights: 70% 50% @ 50% 110%, rgba(31,78,122,.45); Tennis-Play: 70% 55% @ 50% 60%, rgba(31,78,122,.55); Badminton-Play: 50% 60% @ 50% 55%, rgba(120,84,44,.45); Attributes: 60% 50% @ 30% 110%, rgba(120,84,44,.40) + warm top rgba(255,228,184,.10); Hub: volt floor 80% 40% @ 60% 105%, rgba(215,255,63,.07); Player-Card: circle @ 50% 50%, volt .08; Team-Up: 50% 60% @ 78% 50%, volt .06; Mobile-Landing: 120% 30% @ 50% 100%, rgba(46,132,78,.35) | content pages | **shared primitive** `VenueGlow({tint, pos, size, alpha})`; the tint maps to turf / court / hall / volt |
| **Crowd tier (dot texture)** | `background-image: radial-gradient(rgba(214,224,236,α) 1px, transparent 1.6px); background-size: 7px 6px;` vertical mask `linear-gradient(180deg, transparent, #000 40–50%, transparent)`; opacity .6–.7. Main / Intro: curved bowl (`border-radius: 50% 50% 0 0 / 60% 60% 0 0`, left / right −120, 1.7px stop, mask 0 / 30 / 55–60 / 90–95%). Opening and Mobile: 6×5 grid. Badminton: warm rgba(230,214,190,.18) | Main, Intro, Hub, Cricket-Play, Tennis-Play, Badminton-Play, Opening, Mobile-Landing | **shared**; params: `alpha, warm, curved, top, height, grid` |
| **Field in perspective** | wrapper `perspective: 900px`; plane `border-radius:50%; transform: rotateX(70–72deg); transform-origin: 50% 0;` bg radial-gradient(ellipse at 50% 40%, rgba(46,132,78,.75), rgba(14,52,32,.55) 45%, transparent 70%) + mowing stripes repeating-linear-gradient(90deg, rgba(255,255,255,.035) 0 70px, transparent 70px 140px) (Main only). Main 1240×760 @ top 600; Intro 1300×700 @ top 690 rotateX 72 | Main, Intro | shared between landing and intro (turf only) |
| **Grid floor** | perspective 800, 1300×600, rotateX(72deg), two repeating-linear-gradients 1px white .05 every 80px, mask radial-gradient(ellipse at 50% 0%, #000, transparent 70%) | Hub | bespoke |
| **Holo floor** | perspective 700, 900×500, rotateX(75deg), radial volt .12 | Player-Card | bespoke |
| **Pitch strip** | Main: 72×200 @ (684, 640), linear-gradient(180deg, rgba(150,128,88,0), rgba(150,128,88,.45)), `clip-path: polygon(30% 0, 70% 0, 100% 100%, 0 100%)`. Cricket-Play: full-height trapezoid linear-gradient(180deg, #6E5E40, #A08A5E) `clip-path: polygon(48.4% 0, 51.6% 0, 58% 100%, 42% 100%)`; outfield stripes repeating-linear-gradient(180deg, #123E28 0 46px, #0F3622 46px 92px) `clip-path: polygon(30% 0, 70% 0, 100% 100%, 0 100%)` + side vignette. Mobile: 40px stripes, pitch 46 / 54 / 66 / 34% | Main, Cricket-Play, Mobile-Game | cricket-specific |
| **Court (SVG)** | Tennis: outer polygon #0C2236, inner #16456E, lines #E8EEF3 2.5px; net div 568×40 mesh (2 × repeating-linear-gradient 1px white .16 every 7px) + 4px #F2F4F5 tape. Badminton: outer #14211C, inner #1F3A30, lines #ECEFF1 2.5; net 460×38 (white .18 / 6px) + posts 4×60 #A3ADB7 | Tennis-Play, Badminton-Play | bespoke per venue (same construction) |
| **Light cones** | linear-gradient(180deg, rgba(225,236,250,.16), transparent) + `clip-path: polygon(18% 0, 32% 0, 100% 100%, 40% 100%)` (left) / `polygon(68% 0, 82% 0, 60% 100%, 0 100%)` (right), `filter: blur(6px)`; Main 520×760 @ ±60, 70; Intro 540×800 @ ±40, 60, α .14, polygon 18 / 30 and 70 / 82. Overhead / spot variant `polygon(40–44% 0, 56–60% 0, 100% 100%, 0 100%)`: Badminton 400×900 rgba(255,228,184,.20 → .02); Hub hall card 160×200 rgba(255,226,180,.22); Trophy spot 220×300 / 200×260 rgba(255,236,200,.30 / .18 / .16); Easter spot 500×980 volt .16 → .04 + floor ellipse volt .22 | Main, Intro, Opening, Badminton-Play, Hub, Trophy-Room, Easter-Egg | **shared** `LightCone({angle: left\|right\|down, color, alpha, blur})` |
| **Floodlight bank** | `background: radial-gradient(circle, #FFF 0 R1, transparent R2) 0 0 / GX GY, #1A2027;` + glow-bank shadow. **lg** 112×48 (Intro 44), R 2.6 / 3.6, grid 12×11; **sm** 84×36 (Intro 32), R 2.4 / 3.4; **cricket** 100×40, R 2.4 / 3.4 (.42 / .12, 200px 70px halo); **mini** 40×14 / 50×14 / 46×18 / 36×14, R 1.6 / 2.4, grid 7×6 (Hub cards, Opening); **mobile** 60×22, R 1.8 / 2.8, grid 9×8. Main and Intro have r 3px. **Off state** = #1A2027, opacity .6 (Opening F2) | Main, Intro, Hub, Cricket-Play, Opening, Mobile-Landing | **shared** `FloodlightBank({size, on, flicker})` |
| **Floodlight tower mast** | 2×300 linear-gradient(180deg, #2A3138, transparent) | Main | bespoke (Main only) |
| **Hall lamp** | 60×16, `border-radius: 0 0 30px 30px`, #FFF3DD, glow 0 0 50px 20px rgba(255,228,184,.45); roof truss repeating-linear-gradient(90deg, white .04 0 2px, transparent 2px 120px) with fade mask | Badminton-Play | hall-specific |
| **Scoreboard (LED panel)** | bg `#06080B radial-gradient(rgba(255,255,255,.045) 1px, transparent 1.4px) 0 0 / 4px 4px`; border 1px #232A33 / #2A323C; shadow-board; overflow hidden; header strip 48–52h (M 12 / .22em #A3ADB7, LiveDot, border-bottom #1A2028); 3-col footer strip 64–70h (border-top #1A2028, inner dividers). **Character-in-board overlay**: `radial-gradient(rgba(6,8,11,0) 1.1px, rgba(6,8,11,.5) 1.7px)` 4px grid + scanlines `repeating-linear-gradient(0deg, rgba(0,0,0,.16) 0 1px, transparent 1px 3px)` masked by an ellipse. Sizes: Main 900×372; Intro 1240×540; Mobile 358×auto (5px bezel); Opening 300×118 (3px grid, α .05) | Main, Intro, Mobile-Landing, Opening, Easter-Egg (no dots) | **shared** `Scoreboard({size, header, footer, children})` + `LEDTexture` |
| **Warm backlight** | radial-gradient(ellipse 45% 50% at 50% 55%, rgba(255,150,60,.22), rgba(255,150,60,.06) 45%, transparent 70%), 700×520 | Intro | bespoke |
| **Stadium flash** | radial-gradient(ellipse 80% 70% at 50% 35%, rgba(255,255,255,.9), rgba(230,240,255,.25) 60%, transparent) | Intro | bespoke (reusable for Team-Up "floodlights pulse") |
| **Dust** | 2–3px dots volt / #EBFF9E, `dust` 5s | Easter-Egg (4 specks) | spec: ≤60 specks @ 15% in beams, desktop only (not built anywhere) |
| **Glass reflection** | linear-gradient(115deg, white .05 0%, 0 30%, 0 60%, .03 70%, 0 80%) | Trophy cabinet | bespoke |
| **Hawk-Eye overlays** | target-length polygons (volt .16 / .55), tracer paths, rings | games | shared `HawkEye` set |

**Per-venue parameterisation (proposed `venue` theme object)**

| Param | Cricket (turf) | Tennis (hard court) | Badminton (hall) |
|---|---|---|---|
| `tint` (token) | #0E3322 | #0C2236 | #24180E |
| `mid` (card art centre) | #185634 | #1B4C76 | #5A3E22 |
| `deep` (card art 60%) | #0A2015 | #0A1A2B | #22170D |
| `glowRGB` (floor glow) | 46,132,78 / 30,110,64 | 31,78,122 | 120,84,44 |
| `mobileRGBA` | rgba(24,86,52,.45) | rgba(27,76,118,.45) | rgba(90,62,34,.5) |
| `swatch` (Direction) | #1F6B42 → #0B2418 | #1F4E7A → #0B1B2C | #6B4A28 → #24180E |
| surface | stripes #123E28 / #0F3622, pitch #6E5E40 → #A08A5E | #16456E on #0C2236 | #1F3A30 on #14211C |
| lines | #FFF .8 crease | #E8EEF3 | #ECEFF1 |
| light colour | cool rgb(225,236,250) | cool | **warm** rgb(255,228,184) |
| crowd | rgb(214,224,236) α .26 | α .24 | warm rgb(230,214,190) α .18 |
| ground | #05070A | #05070A | #07060A / #06060A |
| HUD fade | rgba(5,7,10,.85) | same | rgba(7,6,10,.85) |

---

## 5. Motion inventory

### 5.1 Every @keyframes / animation class

| File | @keyframes | Keyframe values | Class / duration / easing / fill | Delay(s) | Elements |
|---|---|---|---|---|---|
| Main | `bank` | 0, 18% op .05 → 22% 1 → 25% .2 → 29% 1 → 100% 1 | `.bank` 1.6s ease-out both | .6 / 1.1 / 1.6 / 2.0 (gaps 500 / 500 / 400ms) | 4 floodlight banks |
| Main | `fadein` | op 0 → 1 | `.fade` 1.8s ease-out both | crowd .3; cone L 1.0, R 1.5; sky 2.2; field 2.4; pitch 2.6; board header 2.7; board footer 4.0; key hint 5.2 | scene layers |
| Main | `rise` | op 0, translateY(18px) → none | `.rise` .9s cubic-bezier(.22,1,.36,1) both | CTAs 4.5; COMM 5.2 | CTA group, COMM |
| Main | `boot` | 0% op 0, blur 10px, ls .3em → 55% op .7 → 100% op 1, blur 0, **ls .02em** | `.boot` 1.2s follow both | name 3.0; subtitle 3.6 | ⚠ the subtitle's inline ls .42em is overridden by the fill (ends at .02em) |
| Main | `scan` | translateY(−120%) op 1 → translateY(420%) op 0 | `.scan` 1.4s ease-in both | 2.7 | 90h volt scan band (α .16) |
| Main | `pulse` | 0, 100% op 1; 50% .25 | `.live` 1.6s ease-in-out infinite | — | live dot |
| Main | hover | `.cta-p:hover` bg #E6FF7A; `.cta-s:hover` bg white .10 | instant | — | CTAs |
| Intro | `play` | background-position 0 0 → −8400px 0 | `.sA/.sB/.sC` .667s **steps(16, jump-none)** forwards | sA 1.85; sB 2.517; sC 3.183 | sprite strips |
| Intro | `on` / `off` | opacity 1 / 0 (from = to) | .01s forwards | sA off 2.517; sB on 2.517, off 3.183; sC on 3.183 | strip swap |
| Intro | `travel` | 0% perspective(1300px) translateX(−1180px) rotateY(30deg) scale(.9), blur 10 → 65% blur 2 → 100% translateX(0) rotateY(0) scale(1), blur 0 | `.mover` .95s cubic-bezier(.12,.9,.25,1) both | .95 (mover), 1.02 (g1), 1.09 (g2) | character + 2 ghosts |
| Intro | `ghost` | op .5 → 70% .2 → 0 | `.g1/.g2` 1.05s linear both | 1.02 / 1.09 | ghosts (sepia / hue-rotate tinted) |
| Intro | `lit` | brightness .07 saturate .2 drop-shadow(−2px 0 0 #D7FF3F) drop-shadow(0 0 16px volt .6) → brightness 1 saturate 1, shadows 0 | `.fig` .8s cubic-bezier(.4,0,.2,1) both | 1.85 | figure wrapper |
| Intro | `impact` | clip-path inset(0) → 20% inset(18% 0 60% 0) X −16 → 40% inset(55% 0 15% 0) X +12 → 60% inset(0) X −5 → 80–100% none | .32s **steps(1)** both | 1.88 | figure wrapper |
| Intro | `trail` | op 0 → 15% 1 → 75% .7 → 0 | `.trail` 1.25s ease-out both | .95 | light trails + 6 particles |
| Intro | `breathe` | 0, 100% none; 50% translateY(−2px) scale(1.009) | `.breath` 3.6s ease-in-out infinite, origin 50% 100% | 3.9 | idle |
| Intro | `sweepface` | bg-pos 150% op 0 → 10% op 1 → 60% bg-pos −50% op 1 → 61–100% op 0 | `.sweep` 6s ease-in-out infinite (bg 300% × 100%, gradient 100deg white .38 / volt .18) | 4.3 | light sweep masked by rest.webp |
| Intro | `streak` | scaleX 0 op 0 → 30% scaleX 1 op 1 → 100% scaleX 1.25 op 0 | `.streak` .55s follow both | 2.78 | eye-line flare 460×2 |
| Intro | `glint` | 0, 100% op 0 scale .3; 35% op .85 scale 1 | `.glint` .5s ease-out both | 2.8 | 2 eye glints 12px |
| Intro | `shock` | op 0 scaleX .2 → 20% op 1 → op 0 scaleX 3 | `.shock` .6s ease-out both, origin 0 50% | 1.88 | 6px volt bar |
| Intro | `bank` | 0–15% op .04 → 20% 1 → 24% .2 → 30% 1 → 100% 1 | `.bank` 1.1s ease-out both **+ `flare` 1s ease-out** | bank .2 / .45 / .7 / .95 (250ms); flare 5.0 / 5.05 / 5.1 / 5.15 | 4 banks |
| Intro | `flare` | 0, 100% glow-bank-lg; 30% 0 0 80px 30px rgba(255,255,255,.9), 0 0 420px 180px rgba(220,232,250,.35) | (above) | | |
| Intro | `fadein` | op 0 → 1 | `.fade` 1s ease-out both | crowd .3; cone L .4, R .9; board header .85; sky .9; field 1.2; backlight 1.5; footer strip 4.6 | |
| Intro | `boardOn` | border #14191F, shadow ring #07090C / #11161C → border #2A323C, ring #0A0D11 / #232A33 + 0 0 120px volt .06 | `.board` .7s ease-out both | .8 | scoreboard |
| Intro | `boardHit` | 0, 100% normal; 25% ring #D7FF3F + 0 0 90px volt .45 | .7s ease-out | 1.88 | scoreboard |
| Intro | `sweep` | translateX(−120px) op 0 → 10% op 1 → 90% 1 → translateX(1300px) op 0 | `.scan` 1s cubic-bezier(.4,0,.2,1) both | .95 | 90w volt LED scan bar (α .24) |
| Intro | `absorb` | scale 1 op 0 → 18% op 1 → scale .02 op .15 | `.px` .8s cubic-bezier(.7,0,.84,0) both | per pixel 2.85–3.35 (seeded) | 90 pixels |
| Intro | `la` | 0% op 0 translateY(−60px) scaleY(1.9) blur 12 colour volt → 55% op 1 blur 0 volt glow 30px .9 → 70% translateX(5px) → 100% none #F4F6F7 | `.la` .7s follow both, inline-block | 3.1 + order × .055 | letters i % 3 = 0 |
| Intro | `lb` | translateY(70px) scaleX(1.6) … 70% translateX(−5px) | `.lb` same | | i % 3 = 1 |
| Intro | `lc` | scale(2.4) blur 16 … | `.lc` same | | i % 3 = 2 |
| Intro | `wipe` | clip-path inset(0 100% 0 0) → inset(0) | `.wipe` .6s cubic-bezier(.65,0,.35,1) both | 3.95 | SOFTWARE ENGINEER |
| Intro | `bar` | translateX(0) op 1 → 90% op 1 → translateX(560px) op 0 | `.bar` .6s swing both | 3.95 | 4×46 white leading bar |
| Intro | `rise` | op 0 translateY(14px) → none | `.rise` .6s follow both | tagline 4.3 / 4.36 / 4.42 / 4.48 / 4.54 / 4.6 / 4.66 (60ms); WELCOME 5.4; COMM 5.9 | |
| Intro | `flash` | op 0 → 25% .55 → 0 | `.flash` .9s ease-out both | 5.0 | stadium flash |
| Intro | `cta` | 0, 100% shadow 0 0 30px volt .25; 50% 0 0 60px volt .55 | `.cta` = rise .7s follow 5.7 + cta 2.4s ease-in-out **infinite** 6.5 | | ENTER THE ARENA → |
| Intro | reduced-motion | all off; hide .sA, .sB, .px, .ghost, .trail, .sweep, .streak, .glint, .shock; .sC op 1 at −8400px | | | |
| Cricket-Play | `sweep` | left 0% → 100% | `.cursor` 1.1s linear infinite **alternate** | 0 | meter cursor (RM: 2.2s, not removed) |
| Cricket-Play | `pop` | op 0 scale .8 → 60% op 1 scale 1.04 → 1 | `.pop` .45s follow both | 0 | call overlay, revealed slots |
| Cricket-Play | `ring` | 0, 100% 0 0 0 0 volt .5; 50% 0 0 0 10px volt 0 | `.ring` 1.8s ease-in-out infinite | — | BOWL button |
| Cricket-Play | hover / active | `.swing:hover` bg #E6FF7A; `:active` skewX(−12deg) scale(.97) | — | | |
| Mobile-Game | `sweep` | left 0 → 100% | `.cursor` 1.1s linear infinite alternate | | |
| Cricket-Career | `tick` | op 0 translateY(8px) → none | `.tick` .6s follow both | 0 / .1 / .2 | stat tile values |
| Cricket-Career | transition | `.row` background .2s; hover white .04 | | | rows |
| Tennis-Play | `marquee` | translateX(0) → (−50%) | `.marquee` 18s linear infinite | | LED board |
| Tennis-Play | hover | `.aim:hover` bg volt .22 | | | |
| Tennis-Highlights | transition | `.reel` bg .2s, hover .04; `.lnk:hover` border volt | | | |
| Badminton-Play | `charge` | height 8% → 86% | `.charge` 1.4s cubic-bezier(.4,0,.2,1) infinite alternate | | meter fill |
| Badminton-Play | `slidein` | op 0 translateX(30px) → none | `.toast` .6s follow both | 0 / .25 | attribute toasts |
| Badminton-Attributes | `fill` | op 0 scaleY(.2) → none | `.seg` .35s follow both | i × .04s (0 → .36), same for every row | segments (160) |
| Trophy-Room | `spin` | rotateY 0 → 360deg | **unused** | | (intended 12s turntable) |
| Trophy-Room | `drop` | op 0 → 1 | `.spot` 1.2s ease-out both | 0 / .3 / .6 / .9 / 1.2 | 5 spotlights |
| Trophy-Room | transition | `.trophy` transform .4s follow; hover translateY(−6px) | | | |
| Player-Card | `sheen` | bg-pos −200% → 200% | `.sheen` 4.5s ease-in-out infinite (size 250%) | | holo overlay |
| Player-Card | `float` | 0, 100% rotateY(−12) rotateX(5) Y 0; 50% rotateY(−8) rotateX(3) Y −8px | `.card` 6s ease-in-out infinite | | card |
| Player-Card | hover | `.act:hover` border volt | | | |
| Easter-Egg | `glitch` | 0, 100% none op 1; 8% X −3 op .7; 10% X +2; 12% none op 1 | `.glitch` 3.2s steps(1) infinite | | flipped score bug |
| Easter-Egg | `dust` | Y 0 op 0 → 20% op .8 → Y −120px op 0 | `.dust` 5s linear infinite | 0 / 1.2 / 2.4 / 3.1 | 4 specks |
| Easter-Egg | `drop` | op 0 translateY(−24px) → none | `.toast` .7s follow both .4s | .4 | toast |
| Easter-Egg | `rise` | op 0 translateY(18px) → none | `.rise` .9s follow both | .9 / 1.5 / 1.9 | headline, panel, buttons |
| Motion | `wipe` | translateX(−140%) skewX(−18deg) → translateX(340%) skewX(−18deg) | `.wipe` 2.4s swing infinite (demo; spec 480ms) | | |
| Hub | transition | `.venue` transform .5s follow, border-color .3s; hover Y −8, rotateY 0, border volt .55; `.navlink:hover` bg .05 | | | |
| Team-Up | states | `.field:focus` border volt; `.chan:hover` volt; `.fmt:hover` #5D6670 | | | |
| QuickView | — | `scroll-behavior: smooth`; `.nav a:hover` #F2F4F5 | | | |

**Name collisions to resolve:**
- `sweep` means three different things: the Intro LED bar, the Cricket meter cursor, and `.sweep` as a class for the `sweepface` keyframes.
- `bank` has two different timings, in Main and in Intro.
- `rise` uses 18px in Main and Easter-Egg but 14px in Intro.
- `drop` is an opacity fade in Trophy-Room but a translateY in Easter-Egg.
- `.toast` is an X slide in Badminton-Play but a Y drop in Easter-Egg.
- `wipe` is a clip-path in Intro but a translate in Motion.
- `scan` is a keyframe in Main but a class in Intro.

### 5.2 Reusable motion primitives (CSS / utility level)

| Primitive | Definition | Used by |
|---|---|---|
| `fadeIn` | opacity 0 → 1, 1–1.8s ease-out | scene layers |
| `rise(distance=14–18)` | op + translateY, .6–.9s follow | CTAs, COMM, panels, tagline |
| `pop` | scale .8 → 1.04 → 1, .45s follow | reveals, calls |
| `tick` | op + Y 8px, .6s follow, stagger .1 | stat values |
| `slideIn(x=30)` | .6s follow, stagger .25 | toasts |
| `dropIn(y=−24)` | .7s follow | achievement toast |
| `segFill` | scaleY .2 → 1, .35s follow, stagger 40ms | stat bar |
| `pulse` | op 1 / .25, 1.6s infinite | live dot |
| `ringPulse` | 0 → 10px volt halo, 1.8s infinite | primary game CTA |
| `glowPulse` | 30 ↔ 60px volt, 2.4s infinite | Intro CTA |
| `marquee` | −50%, 18s linear | LED board |
| `sheen` | bg-pos sweep 4.5s | holo card (and button floodlight sweep, 300ms) |
| `float` | 6s 3D bob | holo card |
| `breathe` | scale 1.009, 3.6s | idle character |
| `glitch` | steps(1) jitter 3.2s | flipped board |
| `dust` | Y −120, 5s | particles |
| `bankFlicker` | flicker curve (pick one: Intro 1.1s 15/20/24/30% or Main 1.6s 18/22/25/29%) | floodlights |
| hover lift | translateY(−6/−8px), .4–.5s follow | trophies, venue cards |
| row hover | bg .04, .2s | lists |
| press | scale .97 (all buttons per spec) | buttons |

Easing tokens exist (`--ease-follow`, `--ease-snap`, `--ease-swing`), but files also use cubic-bezier(.12,.9,.25,1) (travel), (.4,0,.2,1) (lit, sweep, charge), (.7,0,.84,0) (absorb), `ease-in`, `ease-out`, `ease-in-out`, `linear` and `steps()`. Add `--ease-entrance` (.12,.9,.25,1), `--ease-standard` (.4,0,.2,1) and `--ease-absorb` (.7,0,.84,0). **`--ease-snap` is never used in any artboard.** `--dur-wipe` and `--dur-count` are unused, and `--comm-hold` is not implemented.

### 5.3 Bespoke timelines (need GSAP or an equivalent sequencer)

| Timeline | Why GSAP | Beats |
|---|---|---|
| **Intro (6s)** | 30+ tracks, sprite chaining with frame steps, seeded pixel bursts, out-of-order letter locks, replay / restart, reduced-motion and per-breakpoint cut-downs (4s tablet, 2s mobile) | see Intro rows above; README §6 table matches the code except "lights 0.2–0.95" (code .2–.95 + 1.1s each) |
| **Landing (Main)** | sequencing banks → scan → boot → CTAs; skip / return-visit cut-down (1.5s, Opening); sound-gate dependency | banks .6–2.0, sky / field 2.2–2.6, scan 2.7, name 3.0, title 3.6, strip 4.0, CTAs 4.5, COMM 5.2. ⚠ the Opening storyboard has different timings (banks 1.4–3.0 at 400ms, crane 3.0–4.2, boot 4.2–5.4, challenge 5.4–6.5) |
| **Ticket gate → landing** | audio unlock, then timeline start | Opening F0 only (no artboard) |
| **Broadcast wipe** | volt bar at 18° over 480ms swing + YS flash mid-wipe + route change | Motion demo only |
| **Tunnel push (1.1s) / Crane in (1.2s) / Idle orbit (±6° over 40s, stop on pointer move)** | camera (R3F + GSAP) | spec only |
| **Game loops** | rAF-driven meters must share a clock with hit detection; call → reveal → verdict (2s) → continue; reduced-motion 3s auto-rally | Cricket (code), Tennis, Badminton (spec) |
| **Easter egg** | toast .4 → board → headline .9 → panel 1.5 → actions 1.9 + glitch loop | CSS delays are fine, but entry follows a game win (route transition) |
| **Count-up 900ms** | number tweening with tabular digits | spec, not drawn |
| **Commentary queue** | 4s hold, single slot, slide in / out, suppressed "during reading" | spec |
| **Trophy select** | spotlight drop 400ms + 12s turntable on the selected item + detail crossfade | spec |
| **Team-Up success** | floodlights pulse once + crowd lifts + scoreboard "NEW FIXTURE · VISITOR vs YASH" | described, not drawn |

Plain CSS is enough for: pulse, ring, glow pulse, marquee, sheen, float, breathe, sweepface, glitch, dust, hover / press transitions, and the one-shot entrances (fade / rise / pop / tick / segFill / slide) with stagger via `--i` custom properties.

---

## 6. Interactive logic

### 6.1 Cricket-Play — "Bowl at Me" (the only working game)

**State:** `{ results: Result[] (0..3), won: boolean }` plus instance `t0` (ms timestamp; set in the constructor, `componentDidMount` and `reset`).
`Result = { q: 'perfect'|'good'|'miss', short: '•'|'4'|'6'|'W', runs: 0|4|6, forYou?: true, call: string, comm: string }`

**Input:** click `BOWL · SPACE` (onClick only; **there is no Space key handler** despite the label). Mobile: TAP TO BOWL (static).

**Verbatim algorithm**
```js
bowl() {
  const s = this.state;
  const i = s.results.length;
  if (i >= 3) return;
  const per = 1.1;
  const t = ((Date.now() - this.t0) / 1000) % (2 * per);
  const p = t <= per ? t / per : 2 - t / per;
  const d = Math.abs(p - 0.5);
  const q = d < 0.035 ? 'perfect' : d < 0.12 ? 'good' : 'miss';
  let r;
  if (i === 2) {
    const streak = s.results.every((x) => x.q === 'perfect') && q === 'perfect';
    if (streak && Math.random() < 0.12) {
      r = { q, short: 'W', runs: 0, forYou: true, call: 'BOWLED HIM.', comm: "Middle stump. Okay… you got me. That doesn't happen often." };
      this.setState({ results: s.results.concat([r]), won: true });
      return;
    }
    if (q === 'perfect') r = { q, short: '4', runs: 4, call: 'FOUR.', comm: 'Perfect yorker. Flicked off the toes anyway. Still not out.' };
    else if (q === 'good') r = { q, short: '4', runs: 4, call: 'FOUR.', comm: 'Good ball. Better shot. Career high score updated.' };
    else r = { q, short: '6', runs: 6, call: 'SIX.', comm: 'Into the second tier. Still not out.' };
  } else if (q === 'perfect') {
    r = { q, short: '•', runs: 0, forYou: true, call: 'DOT BALL.', comm: 'Yorker. Dug out. I respect that.' };
  } else if (q === 'good') {
    r = { q, short: '4', runs: 4, call: 'FOUR.', comm: 'On a length. Still found the gap.' };
  } else {
    r = { q, short: '6', runs: 6, call: 'SIX.', comm: 'Too short. That one is going on the highlight reel.' };
  }
  this.setState({ results: s.results.concat([r]) });
}
```
**Derived view state (verbatim essentials)**
```js
const ball = s.results.length;
const innings = [
  { n: '01', team: 'DEUTSCHE BANK', role: 'Software Engineer 1', span: 'Jul 2024 – now', status: 'NOT OUT' },
  { n: '02', team: 'DEUTSCHE BANK', role: 'Graduate Analyst Intern', span: 'Jun – Jul 2023', status: 'DEBUT' },
  { n: '03', team: 'PICT, PUNE', role: 'B.Tech, Information Technology', span: '2020 – 2024', status: 'ACADEMY' }
];
// seen from the bowler's end: dots and wickets are yours (volt), runs are his
balls[i] = r ? (r.forYou ? {bg:'#D7FF3F',fg:'#0A0C08',bd:'#D7FF3F'} : {bg:'#0E141B',fg:'#F2F4F5',bd:'#3A434C'})
             : i === ball ? {label:String(i+1),bg:'rgba(215,255,63,0.08)',fg:'#D7FF3F',bd:'#D7FF3F'}
             : {label:String(i+1),bg:'transparent',fg:'#7D8893',bd:'#2A323C'};
slots = innings.map((x,i)=>({...x, open: i < ball, locked: i >= ball, ballNo: i + 1}));
const done = ball >= 3;
const runs = s.results.reduce((a, r) => a + (r.runs || 0), 0);
score: s.won ? runs + ' OUT' : runs + '*',
ballLabel: done ? 'OVER COMPLETE' : 'BALL ' + (ball + 1) + ' OF 3',
unlockedLabel: ball + ' / 3 UNLOCKED',
call / callColor: last.forYou ? '#D7FF3F' : '#F2F4F5',
comm: last ? last.comm : "Your ball. Let's see what you've got.",
notDone: !done, lost: done && !s.won, won: done && s.won,
reset: () => { this.t0 = Date.now(); this.setState({ results: [], won: false }); }
```
**Rules recap:**
- The cursor ping-pongs with a period of 1.1s. Perfect is |p − .5| < .035 (±38.5ms at the centre; README says ±35ms). Good is < .12.
- Balls 1–2: perfect → dot (for you), good → 4, miss → 6.
- Ball 3: all-perfect AND `Math.random() < .12` → BOWLED (win). Otherwise perfect / good → 4, miss → 6.
- Every ball reveals one innings slot, so the 3rd always reveals **ACADEMY**. Max score 18*.

**Outcomes / routes:**

| Outcome | Actions |
|---|---|
| Lost | "SEE THE FULL SCORECARD" → Cricket-Career; "BOWL AGAIN" → reset |
| Won | "CLAIM YOUR WICKET" → Easter-Egg |
| Always | SKIP TO CAREER STATS → Cricket-Career; YS / breadcrumb → Hub; QUICK VIEW → QuickView |

**Gaps:**
- The CSS cursor (`sweep 1.1s alternate`) runs on its own clock, so after `reset()` (or any mount offset) the visual cursor and the hit-test drift apart. Drive both from one rAF clock.
- No Space key handler, no `aria-live`, and no `aria-hidden` on the game.
- No 2s verdict, ball flight, localStorage record, Locker Room unlock, "after 2 losses offer highlight", or reduced-motion auto-rally (RM only slows the cursor to 2.2s).
- Mobile ±60ms window: Mobile-Game draws zones at ±5% (±55ms) / ±14%.

### 6.2 Cricket-Career — row select
State `{ sel: 0 }`. Data is hard-coded (verbatim copy of content.json `careerStats`; spans "JUL 2024 – NOW", "JUN – JUL 2023"; `balls[{over:'0.1'..}]`).
```js
const rows = data.map((d, i) => { const on = i === this.state.sel; return Object.assign({}, d, {
  pick: () => this.setState({ sel: i }),
  bg: on ? 'rgba(215,255,63,0.06)' : 'transparent',
  edge: on ? '#D7FF3F' : 'transparent',
  numColor: on ? '#D7FF3F' : '#7D8893',
  statusColor: d.status === 'NOT OUT' ? '#D7FF3F' : '#F2F4F5' }); });
return { rows, sel: data[this.state.sel] };
```
Detail pane: team, `role · Pune, MH` (hard-coded location), ball-by-ball list, "SHOTS PLAYED" stack. Only 2 rows: **no ACADEMY row, although cricket ball 3 reveals innings 03 ACADEMY.** Routes: REMATCH → Cricket-Play, QUICK VIEW, VIEW PLAYER CARD → Player-Card, NEXT VENUE · CENTRE COURT → Tennis-Play.

### 6.3 Tennis-Highlights — reel select
State `{ sel: 2 }` (THE FINAL selected by default; the list renders in QF, SF, FINAL order, i.e. **reverse of content.json order**).
```js
const reel = data.map((d, i) => { const on = i === this.state.sel; return Object.assign({}, d, {
  pick: () => this.setState({ sel: i }),
  bg: on ? 'rgba(215,255,63,0.06)' : 'transparent',
  edge: on ? '#D7FF3F' : 'transparent',
  roundColor: on ? '#D7FF3F' : '#7D8893' }); });
const comm = this.state.sel === 2 ? 'Match point. This one went the distance.' : 'Another project shipped.';
```
Per project: `round, name, kind, line, serve, rally, winner, facts[{k,v}], stack[]`; **`facts` is not in content.json.** Routes: REMATCH → Tennis-Play, QUICK VIEW, CODE ON GITHUB (profile), LIVE DEMO `#`, FULL CASE STUDY `#` (no page), NEXT VENUE · BADMINTON HALL → Badminton-Play.

### 6.4 Badminton-Attributes — data render
```js
const lv = { shipped: { n: 9, c: '#D7FF3F', tag: 'SHIPPED' }, built: { n: 7, c: '#F2F4F5', tag: 'BUILT' }, kit: { n: 5, c: '#7D8893', tag: 'KIT BAG' } };
const skill = (name, level, tag) => { const L = lv[level]; return { name, tier: tag || L.tag, tierColor: L.c, nameColor: '#F2F4F5',
  segs: Array.from({ length: 10 }, (_, i) => ({ c: i < L.n ? L.c : '#1E262F', delay: (i * 0.04).toFixed(2) + 's' })) }; };
```
Groups match content.json, with uppercased custom tags and added `note` strings. No interaction. Route: ENTER THE TROPHY ROOM → Trophy-Room.

### 6.5 Intro — procedural animation
State `{ on: true }`. `replay()` unmounts the scene for 80ms so the CSS animations restart:
```js
let seed = 7;
const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
const colors = ['#D7FF3F', '#D7FF3F', '#F4F6F7', '#FFB25C'];
const pixels = Array.from({ length: 90 }, () => {
  const x = Math.round(60 + rnd() * 560);
  const y = Math.round(162 + rnd() * 100);
  const dx = Math.round(-420 + rnd() * 1100);
  const dy = Math.round(-150 + rnd() * 380);
  return { x, y, dx, dy, s: rnd() > 0.7 ? 5 : 3, c: colors[Math.floor(rnd() * colors.length)], delay: (2.85 + rnd() * 0.5).toFixed(2) };
});
const word = 'YASH SARDA'.split('');
const order = [3, 0, 7, 5, 1, 9, 2, 8, 6, 4];
const kinds = ['la', 'lb', 'lc'];
const letters = word.map((ch, i) => ({ ch: ch === ' ' ? ' ' : ch, cls: kinds[i % 3], w: ch === ' ' ? '0.28em' : 'auto', delay: (3.1 + order[i] * 0.055).toFixed(3) }));
replay: () => { clearTimeout(this.t); this.setState({ on: false }); this.t = setTimeout(() => this.setState({ on: true }), 80); }
```
Each pixel is a 0×0 anchor at (x, y) that animates `absorb` (scale → .02, origin 0 0) with a child at offset (dx, dy), so pixels fly *into* the anchor. Routes: ENTER THE ARENA → Hub, SKIP INTRO → Hub. There is no auto-advance after the timeline ends.

### 6.6 Artboards that need logic written from spec (none in the code)

| Artboard | What the mock shows | Rules to implement (from README / Game-System) | Undefined |
|---|---|---|---|
| **Tennis-Play** | rally 3, 40–30, 2/3 highlights out (QF card left, SF card right), open court = right, serve 186 km/h, progress 2 done + 1 current | up to 3 returns; ← → / click / swipe; pick the open side before the bounce; serve speed rises; the 3rd return meets a winner that clips the line; each return (hit or miss) reveals one project in QF → SF → FINAL order | reaction window, speed curve, how the open side is chosen (random?), whether a miss still reveals (it must, per principle 1), win condition for the 1% |
| **Badminton-Play** | 20–19 match point, rallies 1–2 charged (BACKEND / SMASH, DATA / DEFENCE), FRONTEND locked "WIN RALLY 3", "ARCHITECTURE" locked rally 4; meter oscillates 8 → 86% | 4 rallies; hold & release (space / mouse / touch); zones top 20% = SMASH, 20–60% = CLEAR (line at 60%), bottom 40% = DROP; Yash reads every smash; only a "perfectly weighted drop at 20–19" wins | the drop window, the rally → group order (toasts: Backend, Data, Frontend, ?; content order: Backend, Frontend, Data, Craft), the score progression, "WIN RALLY 3" contradicting "every input reveals" |
| **Hub** | 1 of 3 venues, cricket PLAYED 14* (REMATCH), "SEEN" on Career Stats, RECORD YASH 1 · YOU 0, hidden achievements 0 / 1, comm "One down…" | persisted progress: `{ venuesPlayed, lastScores, sectionsSeen, record:{yash,you}, achievements }` in localStorage; keys 1 / 2 / 3; drag to orbit | key-handler scope (README forbids global handlers outside games); orbit on a CSS plate |
| **Trophy-Room** | cup selected (spot α .30, "1 / 5", detail) | click a trophy → detail panel, spotlight drop 400ms, 12s turntable; locked trophy flips to unlocked after the easter egg (adds "to the visitor's cabinet") | details copy and links for trophies 2–5; unlocked Giant Killer visual; keyboard nav |
| **Team-Up** | SIGN A PLAYER checked; empty fields | format radio → message prefill?; validate; submit (endpoint / mailto?); success = COMM "Challenge received. I'll serve first." + floodlight pulse + scoreboard "NEW FIXTURE · VISITOR vs YASH"; Giant Killer prefills "I beat you." | backend, validation and error copy, success layout, format → subject mapping |
| **Player-Card** | — | drag-to-tilt, click-to-flip (back face lists sections), copy scouting link (`/scout`) with confirmation | back face design, copy feedback |
| **Main** | — | audio toggle (persisted), SKIP INTRO, ENTER ↵ / Q shortcuts, return-visit cut-down, ticket gate | gate screen, which shortcut scope |
| **Easter-Egg** | — | entry on any visitor win; unlock the `/locker-room` flag; add the trophy; prefill Team-Up | route, Locker Room page |

**Game-System rules to encode globally:**
- Skip and Quick View must be visible and at least 44px tall.
- No game runs longer than 15s, and replays are never forced.
- After 2 losses, offer "Watch the highlight instead".
- Games are `aria-hidden`; reveals are announced in an `aria-live` region.
- With reduced motion on, the game becomes a 3s auto-rally followed by the reveal.
- Store the record and achievements in localStorage; the site must work without them.

---

## 7. Hard-coded copy vs content.json

### 7.1 Copy NOT in content.json (would need adding: `ui`, `venues`, `games`, `pages` namespaces)

| Artboard | Copy to add |
|---|---|
| Global / Main | "THE ARENA"; "LIVE · THE ARENA"; "PLAYER 01 / 01"; board footer HOME YASH / STATUS UNDEFEATED / AWAY YOU?; "Think you can beat me?"; CTA labels + subs "INTERACTIVE · ~3 MIN", "RECRUITER VIEW · 90 SEC"; "CROWD ON" / "SOUND OFF"; "SKIP INTRO"; "REPLAY"; "QUICK VIEW"; "REMATCH"; "ENTER ↵ TO PLAY · Q FOR QUICK VIEW"; footer "YASH SARDA · SOFTWARE ENGINEER", "PREFER THE FULL EXPERIENCE? ENTER THE ARENA →" |
| Intro | "LIVE · PLAYER INTRODUCTION"; "THE ARENA · MATCHDAY"; "INTRODUCING NO. 01"; "RECORD 99 – 1"; "WELCOME TO MY ARENA"; "ENTER THE ARENA →" (tagline ✓ `player.tagline`; COMM ✓ `commentary.intro`) |
| Opening (gate) | "HEADPHONES RECOMMENDED"; "ENTER WITH SOUND"; "ENTER MUTED" |
| Hub | "ARENA HUB"; "THE ARENA HUB"; "CHOOSE YOUR VENUE"; "MATCHDAY CARD"; "n OF 3 VENUES"; "JUMP STRAIGHT TO"; index labels + tags (SEEN, PROJECTS, SKILLS, AWARDS, EDUCATION, RESUME, CONTACT); "HIDDEN ACHIEVEMENTS"; "0 of 1 unlocked. Rumour says you have to beat him."; venue names / numbers / descriptions ("Bowl me a 3-ball over. Every ball you bowl unlocks an innings of my career." / "Return my serve. Every shot you get back puts a project on the big screen." / "Hold, release, smash. Every rally won charges one of my player attributes."); "REVEALS · CAREER STATS · ~10s" ×3; PLAYED / UNPLAYED; facility labels (ACHIEVEMENTS / TROPHY ROOM, EDUCATION / TRAINING ACADEMY, RESUME / VIEW PLAYER CARD, CONTACT / TEAM UP); COMM "One down. Two venues left. Still undefeated."; "DRAG TO ORBIT · 1 2 3 TO PICK A VENUE"; "RECORD" |
| Cricket-Play | "BOWL AT ME"; "3 BALLS. ONE BATTER WHO HATES GETTING OUT."; instructions paragraph; "STADIUM SCREEN"; "n / 3 UNLOCKED"; "INNINGS n · LOCKED"; "BOWL BALL n"; calls DOT BALL. / FOUR. / SIX. / BOWLED HIM.; **7 commentary lines** (§6.1); meter SHORT / YORKER / FULL TOSS; pitch YORKER / GOOD LENGTH; "YASH · ON STRIKE"; "YOU · BOWLING"; "YOU BOWLING"; "BALL n OF 3" / "OVER COMPLETE"; "BOWL · SPACE"; "SEE THE FULL SCORECARD"; "BOWL AGAIN"; "CLAIM YOUR WICKET"; "SKIP TO CAREER STATS"; innings 03 ACADEMY entry |
| Cricket-Career | "THE SCORECARD"; "PRO SINCE" / "CLUB" / "CURRENT" tiles ("DEUTSCHE" is a truncated club name); column headers; legend "NOT OUT = CURRENT ROLE · DEBUT = FIRST INNINGS"; "INNINGS n · BALL BY BALL"; "SHOTS PLAYED"; over numbers 0.1–0.4; "NEXT VENUE · CENTRE COURT →"; "VIEW PLAYER CARD →" |
| Tennis-Play | "RETURN OF SERVE"; "Pick the open side before the bounce. ← → or tap a side."; "YASH · SERVING · 186 KM/H"; "← LEFT" / "OPEN COURT →"; marquee ×4; "EACH RETURN UNLOCKS A HIGHLIGHT"; "HIGHLIGHT 0n · QF/SF", "RALLY n"; short card blurbs ("Interactive Power BI reports, embedded and secured with server-side tokens.", "Recognition platform for 10,000+ employees at Deutsche Bank."); COMM "Another project shipped. He's not letting up."; "SKIP TO MATCH HIGHLIGHTS" |
| Tennis-Highlights | "THE TOURNAMENT RUN · BEST PROJECT PLAYS THE FINAL"; "n OF 3 UNLOCKED"; "THE DRAW"; "[{name} · ADD A 10s SCREEN RECORDING]"; "REPLAY"; "THE SERVE · PROBLEM" / "THE RALLY · APPROACH" / "THE WINNER · RESULT"; "SHOT DATA"; **facts** (TYPE / KEY PIECE / REACH / RECOGNITION values); "STACK"; "CODE ON GITHUB" / "LIVE DEMO" / "FULL CASE STUDY"; COMM "Match point. This one went the distance."; "NEXT VENUE · BADMINTON HALL →" |
| Badminton-Play | "SHOT POWER"; SMASH "Top 20%. Fast, but he reads it." / CLEAR "Push him to the back line." / DROP "Soft. Risky. Very satisfying."; "HOLD · RELEASE"; "YASH · READING YOUR GRIP"; "ATTRIBUTE CHARGED · RALLY n"; "MATCH POINT"; locked toasts; COMM "Match point. He's done this before."; "SKIP TO PLAYER ATTRIBUTES" |
| Badminton-Attributes | "EVERY SKILL IS A SHOT IN THE BAG"; legend "SHIPPED AT DEUTSCHE BANK / BUILT IN PROJECTS / IN THE KIT BAG" (content `levels` wording differs); tier tags SHIPPED / BUILT / KIT BAG; group notes ×4 ("Power and pace — where most of my points are won." / "Finesse at the net — the part users actually touch." / "Consistent, reliable, never gives away a cheap point." / "Reading the whole court before the shuttle lands."); "SE" / "POSITION"; "Playing style: Full-stack"; COMM "Full kit bag. Still undefeated."; "ENTER THE TROPHY ROOM →" |
| Trophy-Room | "ACHIEVEMENTS · LIT ONE BY ONE"; "ON THE PLINTH"; "1 / 5"; cup description "Competitive programming across three platforms — the daily practice behind fast, clean problem-solving on the job." (**descriptions for the other 4 do not exist**); "EDUCATION"; "WHERE THE FUNDAMENTALS CAME FROM"; "EXTRA DRILLS"; "PICT" monogram; locked "?"; medal face "99.5"; plaque "PAPER" |
| Player-Card | "RESUME · ONE CARD, EVERYTHING ON IT"; "PLAYER PROFILE"; paraphrased summary; rows Home ground / Pro debut / Current club / Academy; "SE" / "POSITION"; "SEASON 2026"; "THE ARENA · NO. 01"; "RECORD 99–1"; "DRAG TO TILT · CLICK TO FLIP FOR FULL RESUME"; "TAKE THE CARD WITH YOU"; 3 action titles + subs ("FULL RESUME · OPENS AS PDF", "YASH-SARDA-RESUME.PDF", "OPENS STRAIGHT TO QUICK VIEW"); "ON THE BACK OF THE CARD" + paragraph; "SOFTWARE ENGINEER 1 · SDE RESUME"; COMM "Scouts usually stop here. Good call."; "TEAM UP →" |
| Team-Up | "CONTACT"; "TEAM UP"; "You've seen how I play. I'd rather be on your side of the net."; "CHOOSE YOUR FORMAT"; 3 formats + descriptions; labels YOUR NAME / EMAIL / THE CHALLENGE; 3 placeholders; "SEND CHALLENGE"; "OR EMAIL …"; "OR SKIP THE FORM"; channel titles + display handles; "LeetCode · Codeforces · CodeChef — 750+ solved"; "AFTER YOU SEND" block; COMM "Challenge received. I'll serve first."; "NEW FIXTURE · VISITOR vs YASH" |
| Easter-Egg | "HIDDEN ACHIEVEMENT UNLOCKED"; "GIANT KILLER"; flipped bug YOU 1 – 0 YASH; "OKAY… YOU GOT ME." / "That doesn't happen often." (split of `visitorWins`); "NOW OPEN · ONLY FOR GIANT KILLERS"; "THE LOCKER ROOM" + description; "ENTER"; "TELL YASH YOU WON →" / "HE WANTS A REMATCH" / "BACK TO THE HUB"; COMM "The crowd is on its feet. He's already asking for a rematch."; "TROPHY ADDED TO YOUR CABINET" |
| QuickView | "SCOUTING REPORT"; nav labels; "90-SECOND READ · EVERYTHING, NO GAMES"; hero paragraph (paraphrase); hero chips; section meta ("EXPERIENCE · MOST RECENT FIRST", "PROJECTS · STRONGEST FIRST", "SKILLS"); **rewritten** career bullets and project blurbs; "CRAFT & TOOLS" chip set; legend; "MORE ON GITHUB ↗"; Team Up headline "THINK YOU CAN BEAT ME? LET'S FIND OUT ON A REAL PROBLEM."; link labels |
| Mobile | "LITE · ONE-THUMB GAMES"; "TODAY'S FIXTURES · 1 OF 3 PLAYED"; "VENUE 0n · CAREER/PROJECTS/SKILLS"; "SEE STATS →"; tab labels; "YOU BOWLING · 2/3"; "INNINGS 01 UNLOCKED · NOT OUT"; "WIDER YORKER ZONE ON TOUCH · HAPTIC ON RELEASE"; "TAP TO BOWL"; "SE1 · SINCE 2024"; "2 INNINGS"; "bulk upload cut manual entry 60%"; "AI INTERVIEW PLATFORM"; "Gemini-powered mock interviews · published paper"; "DEUTSCHE BANK · INTERN"; "ARENA →" |
| Game-System lexicon | "He doesn't like losing. Noted." (yashWins, not in content.json) |

**Unused content.json entries:** `commentary.closeCall[1]` "Close. Not close enough.", `commentary.entrance[1]`, `commentary.inPlay[0]` "Good length. Respect.", `commentary.yashWins[1]` "Still not out." (only appears inside longer lines), `player.contact.codeforces / codechef` in Team-Up, `trainingAcademy.honours` (only partial).

### 7.2 Contradictions

| # | Topic | Artboard says | content.json / README says |
|---|---|---|---|
| 1 | Kafka level | Direction stat bar "KAFKA · **PRO**", 7/10 volt | `Apache Kafka: kit` (5/10 grey); "PRO" is not a level |
| 2 | Highlight wording | Power BI line "embedded **right** inside it"; rally "**Used the** REST-based…"; Kudo rally "Built **it** from…"; AI kind "Published research" | content: no "right", no "Used the", no "it", "Published research · PICT" |
| 3 | Highlight order | Highlights reel QF → SF → FINAL (default FINAL); Tennis game reveals QF first | content order FINAL, SF, QF |
| 4 | Career bullets | QV rewrites all bullets (e.g. "Shipped dashboard features with end-to-end backend integration.", "Wrote 75+ JUnit tests…"); Mobile "bulk upload cut manual entry 60%" | `ballByBall` strings |
| 5 | Stack order | QV "React · Spring Boot · Java · Oracle · Redux · JUnit · TeamCity · uDeploy" | content "Java, Spring Boot, React, Redux, Oracle, …" |
| 6 | Summary | Player-Card "I like problems that need solving properly — …"; QV "Software Engineer at Deutsche Bank. Full-stack — Java, Spring Boot, React and Oracle — …" | `player.summary` |
| 7 | Attributes | QV "CRAFT & TOOLS" = DSA · OOP, System Design, Python, Git · CI/CD, Google Cloud, Gen AI | content Craft = DSA, OOP, System Design, Gen AI · Gemini; Python / Git / Cloud live in `languages` / `kitBag` |
| 8 | Badminton groups | toasts: Rally 1 BACKEND (Java, Spring Boot, JUnit; no Kafka), Rally 2 **DATA / DEFENCE**, Rally 3 FRONTEND, Rally 4 **ARCHITECTURE** | groups: Backend, Frontend, Data, **Craft** |
| 9 | Meter order | Badminton-Play SMASH / CLEAR / DROP (top → bottom) | README "Drop, Clear, Smash" (order only) |
| 10 | Trophies | Medal sub "MHT-CET 2020 · **STATE RANK** 709"; plaque "**AI INTERVIEW PLATFORM** · JOURNAL"; QV omits the Distinction trophy (4 items) | "State Merit Rank 709"; "AI-Enhanced Interview Grooming Platform · Journal"; 5 + locked |
| 11 | Record | Hub "YASH 1 · YOU 0"; Intro / Player-Card "99 – 1" / "99–1"; Game-System "YASH 99 · YOU 1" (saved in-browser) | README "Keep the record ("YASH 99 · YOU 1")" (brand stat or real tally?) |
| 12 | Experience label | Mobile-QV "SE1 · SINCE **2024**"; elsewhere "SINCE JUL 2024"; "SEASON 2026" on the card | README open item; `proSince: 2024-07` |
| 13 | Career rows | Cricket ball 3 reveals innings 03 "PICT, PUNE · ACADEMY" | `careerStats` has 2 entries; Career scorecard shows 2 rows |
| 14 | Location | Career detail "Pune, MH" (hard-coded) | per-entry `location` ✓; `player.location` "Pune, India" |
| 15 | Type scale | Direction "H2 56/0.9" | tokens `--fs-h2: 84px`; Hub H1 is 56 |
| 16 | Bank timing | Main 500 / 500 / 400ms; Opening "400ms apart"; Intro 250ms | README Intro "250ms apart" |
| 17 | Landing timing | Main boots name at 3.0s, CTAs 4.5s | Opening storyboard: name 4.2–5.4s, challenge 5.4–6.5s, "6.5 SECONDS"; "SKIP INTRO APPEARS AT 1.0s" (Main shows it at 0s) |
| 18 | Intro length | Intro ~6s (CTA 5.7s) | Responsive / README desktop intro "6.5s + sound gate" |
| 19 | Trophy motion | spot fade 1.2s, staggered .3s | spec spotlight drop 400ms + 12s turntable |
| 20 | Card tilt | Hub hover sets rotateY(0) (removes tilt) | spec "tilt toward cursor (max 6°)" |
| 21 | Live red | Badminton MATCH POINT chip filled #FF4D3D | "never a fill" |
| 22 | Italic | Main / Mobile / Easter challenge lines italic | "Italic is used only for live commentary" |
| 23 | Mono size | 9–10px mono on mobile / cards | "11–13px" |
| 24 | Locked-behind-game | "FRONTEND · LOCKED / WIN RALLY 3" | principle 1 "Info is never behind a game" |
| 25 | Global keys | "ENTER ↵ TO PLAY · Q…", "1 2 3 TO PICK A VENUE" | README a11y "No global key handlers outside active games" |
| 26 | Perfect window | code ±3.5% of 1.1s ≈ ±38.5ms | "±35ms" |

---

## 8. Routing graph

### 8.1 Artboard → route

| Artboard | Suggested route | Status |
|---|---|---|
| Main | `/` | ✓ |
| Intro | `/intro` | ✓ |
| Hub | `/arena` | ✓ |
| Cricket-Play | `/arena/cricket` | ✓ |
| Cricket-Career | `/career` | ✓ |
| Tennis-Play | `/arena/tennis` | ✓ |
| Tennis-Highlights | `/highlights` | ✓ |
| Badminton-Play | `/arena/badminton` | ✓ |
| Badminton-Attributes | `/attributes` | ✓ |
| Trophy-Room | `/trophies` (+ `#academy` for "Training Academy") | ✓; the Hub links both items to the same page |
| Player-Card | `/card` | ✓ |
| Team-Up | `/team-up` | ✓ |
| QuickView + Mobile-QuickView | `/scout` | ✓ |
| Easter-Egg | **none in README** | propose `/arena/giant-killer` or a modal on the game route |
| (Locker Room) | `/locker-room` | **no artboard** |
| Mobile-Landing / Hub / Game | `/`, `/arena`, `/arena/cricket` at <768 | all hrefs `#` |
| Resume PDF | `/Yash-Sarda-Resume.pdf` (blob 64b39405…) | asset |
| Reference boards | `/styleguide/*` (optional) | — |

### 8.2 Edges (internal hrefs)

| From | → To (label) |
|---|---|
| Main | Intro (ENTER THE ARENA); QuickView (VIEW PORTFOLIO). SKIP INTRO is a `<button>` with no target |
| Intro | Hub (ENTER THE ARENA →); Hub (SKIP INTRO); REPLAY = in-page |
| Hub | Main (YS); QuickView; Cricket-Play (REMATCH); Cricket-Career (SKIP →; index Career Stats); Tennis-Play (PLAY); Tennis-Highlights (SKIP →; index); Badminton-Play (PLAY); Badminton-Attributes (SKIP →; index); Trophy-Room ×4 (index Trophy Room, Training Academy; facilities ×2); Player-Card ×2; Team-Up ×2 |
| Cricket-Play | Hub (YS); QuickView; Cricket-Career (SEE THE FULL SCORECARD, SKIP TO CAREER STATS); Easter-Egg (CLAIM YOUR WICKET, win only) |
| Cricket-Career | Hub; Cricket-Play (REMATCH); QuickView; Player-Card (VIEW PLAYER CARD →); Tennis-Play (NEXT VENUE) |
| Tennis-Play | Hub; QuickView; Tennis-Highlights (SKIP) |
| Tennis-Highlights | Hub; Tennis-Play (REMATCH); QuickView; Badminton-Play (NEXT VENUE); GitHub (external); LIVE DEMO `#`; FULL CASE STUDY `#` |
| Badminton-Play | Hub; QuickView; Badminton-Attributes (SKIP) |
| Badminton-Attributes | Hub; Badminton-Play (REMATCH); QuickView; Trophy-Room (ENTER THE TROPHY ROOM) |
| Trophy-Room | Hub; QuickView; LeetCode / Codeforces / CodeChef (external) |
| Player-Card | Hub; QuickView; Team-Up (TEAM UP →); resume PDF (view, download) |
| Team-Up | Hub; QuickView; mailto, LinkedIn, GitHub, LeetCode (external) |
| Easter-Egg | Team-Up (TELL YASH YOU WON); Cricket-Play (HE WANTS A REMATCH, hard-coded to cricket); Hub; Locker Room ENTER `#` |
| QuickView | Hub ×2 (ENTER THE ARENA, footer); anchors #career #highlights #attributes #trophies #teamup; PDF ×2; mailto / LinkedIn / GitHub |
| Mobile-* | 20 × `href="#"` (intended: Landing → `/intro`-lite or `/arena`, `/scout`; Hub → games / pages / tabs; Game → skip; QV → `/arena`, `/card`, `#teamup`) |
| Direction | 3 × `#` (spec) |

**Linear "matchday" path:** Main → Intro → Hub → Cricket-Play → Cricket-Career → Tennis-Play → Tennis-Highlights → Badminton-Play → Badminton-Attributes → Trophy-Room → (dead end: there is no "next" to Player-Card or Team-Up). Player-Card → Team-Up.

**Gaps:**
- Trophy-Room has no forward CTA.
- Team-Up has no forward CTA or success route.
- Tennis and Badminton games have no win → Easter-Egg route, and Easter-Egg's rematch always goes to cricket.
- Only Hub links to Main.
- The Hub index omits Quick View and Locker Room.
- The `/scout` deep link has no "back" other than ENTER THE ARENA → Hub (skips Main / Intro).
- There are no 404 / error routes.

---

## 9. Mobile vs desktop deltas (390×844)

| Area | Desktop | Mobile artboard | Notes |
|---|---|---|---|
| Gutter / header | 36 gutter; 76h HUD | 16 gutter (12 on game); no header bar on Landing / Hub (floating row at top 16); QV: 60h bar, bg rgba(5,7,10,.92) | YS 34px |
| Glass | blur 14 | **no blur**: rgba(14,19,26,.7 / .8 / .85) solids | per Responsive "Solid panels (no blur)" |
| **Landing** | 900×372 board at y 140, 156px name, 3-col footer (HOME / STATUS / AWAY); light cones, towers, field perspective, crowd bowl; skewed CTAs side by side 310×78; COMM; key hint; audio "CROWD ON" + SKIP INTRO | board full-width at y 130, 5px bezel, name 96px stacked on 2 lines (lh .82), subtitle 18 / .38em, **2-col footer (STATUS / AWAY)**, header strip 38h M 10 "01 / 01"; 2 static banks 60×22, flat crowd band, radial turf glow; **unskewed full-width stacked CTAs 64h**, primary sub "LITE · ONE-THUMB GAMES"; "SOUND OFF" text toggle; **no SKIP INTRO, no COMM, no hint**, no animation classes | mobile intro (2s lights + name) is not drawn |
| **Hub** | 3D venue arc, art headers, index rail, facilities ×4, record chip, audio, COMM, hint | **fixtures list** (vertical cards, no art header, 90deg tint gradient), eyebrow "TODAY'S FIXTURES · 1 OF 3 PLAYED", H1 48px, 2-col action bar 48h ("SEE STATS →" on played), **2 facility tiles only** (Trophy Room, Academy; **no Player Card**), **5-tab bar** (ARENA, CAREER, PROJECTS, SKILLS, TEAM UP), QUICK VIEW bordered top-right; no record, audio, COMM or achievements teaser | tab bar covers 76px; content may collide at 844h |
| **Game** | ScoreBug centre HUD; left instructions panel; right reveal list; meter 640w at y 610; skewed BOWL 62h; COMM; skip bottom-right; QUICK VIEW + audio | compact bug top-left (40h; YASH \| 6* \| "YOU BOWLING · 2/3"); **SKIP top-right**; **no QUICK VIEW** (rule break); single reveal chip under the bug; no ball tracker, panel, COMM, audio or call overlay; meter full-width at the bottom with wider zones (±5% / ±14%); **110h full-width TAP TO BOWL**; hint "WIDER YORKER ZONE ON TOUCH · HAPTIC ON RELEASE"; narrower pitch (34–66%) | only cricket drawn; tennis swipe / badminton hold not drawn |
| **Quick View** | fluid page, sticky header with section nav, hero clamp 156, multi-column auto-fit grids, Team Up volt band | 60h bar without YS mark or section nav, "ARENA →"; hero 76px fixed; chips 10px ("SE1 · SINCE 2024"); career compressed (one metric line; intern row dimmed .75, title only); highlights as a **horizontal 250px card row (overflow hidden, no scroll affordance)**; **sticky bottom action bar** (PLAYER CARD / TEAM UP); later sections not drawn | conflicts with "QV is one fluid page": Mobile-QV is a different layout, not the desktop page at 390 |
| Type | mono 11–12 | mono 9–10 (tab labels 9) | below spec minimum |
| Motion | — | no keyframes except the meter cursor; Responsive: wipe only (vertical), no particles | — |
| Commentary | lower-third on most screens | **absent on all 4 mobile boards** | — |

**No tablet (768–1199) artboard exists.** The "Hub + drawer" index, WebGL lite, 4s intro and "Touch + keys" games are only described in the Responsive table.

---

## 10. Risks and ambiguities

**Severity: H = blocks the build or changes architecture, M = needs a design decision, L = polish.**

| # | Sev | Risk / ambiguity | Detail |
|---|---|---|---|
| 1 | H | **Two of three games have no logic or rules** | Tennis-Play and Badminton-Play are single static frames. Reaction windows, speed curves, open-side choice, rally → group mapping, scoring and the 1% path all have to be invented. Only Cricket has working code |
| 2 | H | **Every desktop artboard is an absolutely positioned 1440×900 canvas** | No layout behaviour for 1200–1439, >1440, short viewports (<900 tall, e.g. 1440×800 laptops), or 768–1199 (no tablet artboard). Only QuickView is fluid. Every page needs a responsive grid re-derived from these positions |
| 3 | H | **Renderer mismatch** | README / Responsive call for R3F WebGL stadiums on desktop (dynamic floodlights, tunnel push, crane, idle orbit, cursor orbit). Artboards are 2D CSS plates, and there are no 3D assets, models, camera paths or lighting rigs. Scope and budget (≤3MB per venue) are unknown |
| 4 | H | **Missing screens** | Locker Room (`/locker-room`, README open item); ticket gate / sound gate (Opening F0); mobile intro (2s); tablet anything; mobile Tennis, Badminton, Career, Highlights, Attributes, Trophy, Card, Team-Up; Player-Card back face; FULL CASE STUDY page; Team-Up success / error; Giant Killer unlocked trophy state; 404; loading / tunnel transition; "after 2 losses: watch the highlight" prompt; reduced-motion 3s auto-rally; return-visit 1.5s cut-down |
| 5 | H | **Assets referenced as canvas blobs** | Mapping inferred: `ce44ebfe…` = turn_0.webp, `ec1dd122…` = turn_1.webp, `830b24f7…` = turn_2.webp (Intro `.sA/.sB/.sC`); `f8a90aea…` = rest.webp (Intro mask, Attributes and Player-Card `<img>`); `64b39405…` = Yash-Sarda-Resume.pdf. `support.js` (canvas runtime) is not shipped. `yash-portrait-cutout.png` (2.26MB) and `yash-portrait.webp` are not referenced by any artboard. Turn strips are ~650–780KB each (~2.2MB total), which threatens "landing text <1.5s" unless they are deferred |
| 6 | H | **Resume PDF contains a phone number** | It is linked on Player-Card and QuickView (×2), and `/scout` is meant for public distribution. A public version is needed before launch |
| 7 | M | **Cricket cursor / logic desync** | The visual cursor is a CSS animation; hit-testing uses `Date.now() - t0`. After BOWL AGAIN (reset), or any delay between mount and paint, they diverge, so the visitor's "perfect" isn't perfect. Use one rAF clock. There is also no Space handler despite the "BOWL · SPACE" label |
| 8 | M | **Persistence model undefined** | Hub shows played state, best score (14*), SEEN tags, record and achievements. Rematch replaces Play. The Easter-Egg adds a trophy and unlocks the Locker Room; Team-Up prefill is "I beat you." No schema, versioning or "reset my record" exists. The "99–1" record is either a brand constant or a real tally (contradiction §7.2 #11) |
| 9 | M | **Accessibility gaps** | No focus-visible styles anywhere (`.field` sets `outline:none` and only changes the border); the skew transform will distort outlines. Selectable lists are plain buttons (need tabs / `aria-pressed`). Audio toggle has no `aria-pressed`. Games are not `aria-hidden` and there is no `aria-live` region. Mobile tab labels are 9px. #5D6670 text is 3.44:1 and #3A434C is 1.95:1 (locked trophy, loser digit). White on #FF4D3D is 3.29:1. Keyboard hints imply global handlers the README forbids. Easter-Egg and Mobile-Game lack Quick View |
| 10 | M | **Token drift** | 7 grounds, 2 glass recipes (+3 mobile solids), 2 hover volts, 2 empty-segment colours, 4 scoreboard border / bezel colours, 142 unique rgba and 98 unique hex values. `--fs-h1` / `--fs-h2` don't match usage. Unused tokens: `--ease-snap`, `--dur-wipe`, `--dur-count`, `--comm-hold`. Fonts loaded but unused: Big Shoulders 600, JetBrains Mono 500 (tokens.css is fine, but trim the weights) |
| 11 | M | **Main `boot` keyframe overrides subtitle tracking** | `boot` ends at `letter-spacing:.02em` with `fill-mode: both`, so "SOFTWARE ENGINEER" (inline .42em) collapses after the animation. The intended end state is ambiguous |
| 12 | M | **Intro sprite timing hard-coded to absolute seconds** | Chained by fixed delays (2.517, 3.183). Any timeline scaling for tablet (4s) or mobile (2s) means re-timing every track. README suggests replacing it with WebM-alpha / HEVC-alpha; Safari handling for HEVC is required. `tools/rig.py` is not re-runnable: it hard-codes `/tmp/claude-0/…` and `/root/.claude/uploads/…` paths, expects precomputed `mask.png` / `depth.npy`, contains no ISNet / Depth-Anything calls, no keyframe driver and no strip writer, and defaults `out_w=640` vs 700px frames |
| 13 | M | **Content source of truth** | README says "render from content.json, don't hard-code", but artboards contain ~300 strings not in it (§7.1), paraphrases that differ from it (§7.2), and data missing from it: project `facts`, trophy descriptions / links, group notes, venue copy, commentary per event (cricket lines), playing style, card stat accent rule, ACADEMY innings |
| 14 | M | **Commentary system unspecified in code** | 4s hold, a single slot, "never during reading", slide-from-left. No queue rules exist: what triggers lines on non-game pages, and whether it is muted on mobile (absent there) |
| 15 | M | **Easter-egg routing** | No README route; "HE WANTS A REMATCH" always returns to cricket. Locker Room ENTER is `#`. How the unlock is gated (localStorage flag that can be spoofed: acceptable?) is undefined |
| 16 | M | **Team-Up submission** | No endpoint, validation, spam protection, error or success UI, or mapping from format → subject. "OR EMAIL" fallback only |
| 17 | M | **Trophy Room selection and content** | Only trophy 1 has a description and links; "1 / 5" implies 5 selectable items, but no copy exists for 2–5. The locked trophy is not focusable. The turntable `spin` keyframe is defined but unused |
| 18 | M | **Audio** | Crowd bed and SFX are listed as an open item (no files). Toggle states are inconsistent across boards (CROWD ON / icon / SOUND OFF), and the default differs (desktop on vs mobile off). Autoplay gate design is missing |
| 19 | M | **Hub orbit and keys on a non-WebGL fallback** | "DRAG TO ORBIT" and the ±6° idle orbit have no 2D equivalent defined for mobile / reduced motion |
| 20 | L | **Venue-card tilt spec vs drawing** | The drawn hover flattens the card to 0°; the spec says tilt toward the cursor up to 6°. Cricket card "played" styling only. No disabled / locked state for venues |
| 21 | L | **Microcopy staleness** | "SEASON 2026" is hard-coded on the Player Card; "since Jul 2024" vs "1.7 yrs" is a README open item; Mobile uses "SINCE 2024" |
| 22 | L | **Scoreboard / floodlight variants** | Main vs Intro use different bank sizes, flicker curves and board borders. Pick one canonical set (Intro's is newer and more detailed) |
| 23 | L | **Placeholder media** | All 3 projects have `media: null`; replay panels show "ADD A 10s SCREEN RECORDING". LIVE DEMO and FULL CASE STUDY go nowhere; project source links all point to the GitHub profile |
| 24 | L | **Fonts** | Google Fonts are imported in tokens.css and in each artboard. Self-hosting / subsetting is needed for the <1.5s landing budget; Big Shoulders' fallback "Oswald" is not loaded. Tabular digits for count-ups need `font-variant-numeric: tabular-nums` (Big Shoulders support should be verified) |
| 25 | L | **Mobile QV vs fluid QV** | Decide whether `/scout` <768 is the fluid page (with sticky bottom bar added) or a separate compressed layout (Mobile-QV shows summary-only career and a horizontal highlight scroller with no scroll affordance) |
| 26 | L | **Reference-board-only components** | Storyboard, timeline lanes, easing tiles: build them only if a `/styleguide` route is wanted |

---

### Appendix A: proposed token additions (summary)

- **Colour**
  - text: `--text-1` #E6EAEE, `--white`, `--volt-ink-2` #2E3A0A, `--line-3` #3A434C, `--line-hover` #5D6670, `--seg-empty` #26303A
  - surfaces: `--stand-3` #0A0E13, `--stand-hi` #141B23, `--fixture` #1A2027, `--plinth` #13171C, `--mast` #2A3138
  - scoreboard: `--board-bg` #06080B, `--board-line` #1A2028, `--board-border` #232A33, `--board-bezel` #0A0D11
  - grounds per venue; venue `mid` / `deep` / `glow` triples; court lines; gold / silver ramps (Trophy-scoped)
  - light RGB families (sky / beam / bulb / crowd / warm)
  - volt α ramp (8 steps); resolve the hover colour
- **Glass:** `--glass-solid-bg` rgba(14,19,26,.85), `--bar-bg` rgba(5,7,10,.9)
- **Type:** the scale in §2.4 and the tracking tokens in §2.5
- **Space:** the scale in §2.6; control heights 44 / 52 / 62 / 78 / 110; `--seg-gap` 3px; `--header-h` 76; `--panel-top` 236; `--bottom-row` 110
- **Shadow / glow:** the 14 tokens in §2.7; `--blur-beam` 6px; `--bw-brand` 1.5px; `--edge-selected` 3px
- **Motion:** `--ease-entrance` (.12,.9,.25,1), `--ease-standard` (.4,0,.2,1), `--ease-absorb` (.7,0,.84,0); durations: fade 1000, rise 600–900, pop 450, tick 600, seg 350 / 40 stagger, hover 200 / 400 / 500, flicker 1100, intro 6000
