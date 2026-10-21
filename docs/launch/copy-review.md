# Wording review: every string we wrote ourselves

These are the words that are **not** in the design files or in your `content.json`. We wrote them to fill gaps, in the dry commentary voice. Nothing here is final until you say so.

**How to use this list.** Read each row on the page where it shows. If you want different words, type them in the last column. If it is fine, leave the box empty. Send the list back and the changes go in as one copy task before launch.

**How it was made.** A script read `src/content/ui-copy.ts` and collected every entry marked `// derived` (or inside a block whose comment says derived), plus the strings spec section 12 calls derived that the code does not mark (the Source column says which), plus the trophy descriptions `content.json` flags with `draftCopy: true`. Count: 86 marked in the code, 21 more named in spec section 12, 4 trophy descriptions (111 in all).

Two things to keep in mind while you read: letters in capitals are drawn in capitals (the spoken text is the same words), and a few lines are built from parts, so the page shows them joined (for example "2 of 3 venues played. The final whistle blows after all three.").

## Full Time

| Key | Wording now | Where it shows | Source | Yash's wording |
|---|---|---|---|---|
| `fullTime.eyebrow.done` | MATCHDAY COMPLETE | The small label above the big heading, followed by the venue count. | code mark | |
| `fullTime.eyebrow.pending` | MATCHDAY IN PROGRESS | The small label above the big heading, followed by the venue count. | code mark | |
| `fullTime.board` | Final score | The scoreboard's spoken name: "Final score: You 0, Yash 3" (screen readers only). | code mark | |
| `fullTime.grades.goodTry.headline` | GOOD TRY. | Heading and line when all three venues are played and your best attempt was the weakest of the three grades. | code mark | |
| `fullTime.grades.goodTry.line` | Three venues, three losses. He's had a lot of practice. | Heading and line when all three venues are played and your best attempt was the weakest of the three grades. | code mark | |
| `fullTime.grades.niceEffort.headline` | NICE EFFORT. | Heading and line for the middle grade (decided by your best form across the venues). | code mark | |
| `fullTime.grades.niceEffort.line` | Three venues, three losses. But you made him work for it. | Heading and line for the middle grade (decided by your best form across the venues). | code mark | |
| `fullTime.grades.soClose.headline` | SO CLOSE. | Heading and line for the closest grade. | code mark | |
| `fullTime.grades.soClose.line` | Three venues, three losses. You had him worried there. | Heading and line for the closest grade. | code mark | |
| `fullTime.pending.headline` | NOT YET. | Opened before all three venues are played: heading, then "N of 3 venues played. The final whistle blows after all three." | code mark | |
| `fullTime.pending.of` | of | Opened before all three venues are played: heading, then "N of 3 venues played. The final whistle blows after all three." | code mark | |
| `fullTime.pending.played` | venues played. | Opened before all three venues are played: heading, then "N of 3 venues played. The final whistle blows after all three." | code mark | |
| `fullTime.pending.tail` | The final whistle blows after all three. | Opened before all three venues are played: heading, then "N of 3 venues played. The final whistle blows after all three." | code mark | |
| `fullTime.teamUp.eyebrow` | NEXT FIXTURE · OFF THE PITCH | The card under the score once the matchday is done: invites a message. | code mark | |
| `fullTime.teamUp.title` | TEAM UP WITH YASH | The card under the score once the matchday is done: invites a message. | code mark | |
| `fullTime.teamUp.body` | Hiring, building something, or just want a rematch? Send him a line. | The card under the score once the matchday is done: invites a message. | code mark | |
| `fullTime.teamUp.cta` | TEAM UP | The card under the score once the matchday is done: invites a message. | code mark | |
| `fullTime.next.eyebrow` | NEXT VENUE | Opened early: the card that sends you to the next unplayed venue. | code mark | |
| `fullTime.next.cta` | PLAY | Opened early: the card that sends you to the next unplayed venue. | code mark | |
| `fullTime.again` | PLAY AGAIN | A link under the card after the matchday: starts again at Cricket. | code mark | |
| `fullTime.card` | SEE THE PLAYER CARD | A link under the card after the matchday: goes to the Player Card. | code mark | |
| `fullTime.comm.done` | The crowd's on its feet for the challenger. | The commentary line at the bottom of the page (done / early). | code mark | |
| `fullTime.comm.pending` | Half-time. The rest of the matchday is waiting. | The commentary line at the bottom of the page (done / early). | code mark | |
| `fullTime.note` | SAVED TO YOUR RECORD | Small print at the bottom after the matchday. | code mark | |
| `routes.fullTime.heading` | FULL TIME | The big heading. | spec 12 | |

## Hub

| Key | Wording now | Where it shows | Source | Yash's wording |
|---|---|---|---|---|
| `hub.index.links.fullTime.label` | Full Time | The Full Time row in the index list (rail and INDEX drawer), once Full Time has been earned. | code mark | |
| `hub.index.links.fullTime.tag` | RESULT | The Full Time row in the index list (rail and INDEX drawer), once Full Time has been earned. | code mark | |
| `hub.fullTime.label` | FULL TIME | The box at the bottom of the left rail (and the drawer on a phone). Says if the final whistle has gone. | code mark | |
| `hub.fullTime.pending` | The final whistle blows after all three venues. | The box at the bottom of the left rail (and the drawer on a phone). Says if the final whistle has gone. | code mark | |
| `hub.fullTime.done` | Final whistle. Your result is up. | The box at the bottom of the left rail (and the drawer on a phone). Says if the final whistle has gone. | code mark | |
| `hub.comm.none` | Three venues. One opponent. Pick your ground. | Commentary bar when no venue is played (spec 12: H7). | spec 12 | |
| `hub.comm.two` | Two down. One venue left. Still undefeated. | Commentary bar when two venues are played (H7). | spec 12 | |
| `hub.comm.all` | Full matchday. Still undefeated. | Commentary bar when all three are played (H7). | spec 12 | |
| `hub.drawer.open` | INDEX | The INDEX button in the top row that opens the drawer (H2). | spec 12 | |
| `hub.drawer.close` | Close the index | The drawer's close button, spoken name (H2). | spec 12 | |

## Cricket (3D)

| Key | Wording now | Where it shows | Source | Yash's wording |
|---|---|---|---|---|
| `games.cricket.comm.beaten` | Beaten! Missed off stump by a whisker. | The commentary line after a 3D dot ball bowled on the OFF line (Yash misses it). | code mark | |
| `games.cricket.comm.sixFull` | Full toss. Thank you very much. | The commentary line after a 3D six off a full toss. | code mark | |
| `games.cricket.comm.lastPerfectOff` | Perfect yorker. Squeezed through point anyway. Still not out. | The commentary line after a perfect 3D ball 3 bowled on the OFF line (squeezed out through point, not flicked to leg). | code mark | |
| `games.cricket.release` | RELEASE · SPACE | The 3D game's BOWL button while the bowler runs in (desktop). | code mark | |
| `games.cricket.releasePhone` | TAP TO RELEASE | The same button on a phone. | code mark | |
| `games.cricket.line.label` | LINE | The name of the OFF / MIDDLE / LEG control beside BOWL (3D). | code mark | |
| `games.cricket.line.keys` | ← → | The keys that change the line, shown after LINE (desktop). | code mark | |
| `games.cricket.line.said` | LINE: {line} | What a screen reader hears when the line changes in the 3D game ({line} is OFF, MIDDLE or LEG). | code mark | |
| `games.cricket.line.off` | OFF | The line buttons (3D). | code mark | |
| `games.cricket.line.middle` | MIDDLE | The line buttons (3D). | code mark | |
| `games.cricket.line.leg` | LEG | The line buttons (3D). | code mark | |
| `games.cricket.loading` | PREPARING THE PITCH | The loading bar while the 3D ground downloads, in BOWL's place. | code mark | |
| `games.cricket.how3d` | Pick a line, run in, and release when the marker hits the yorker zone. Every ball you bowl — dot ball or six — unlocks an innings of my career. | The how-to-play text in the left panel of the 3D game (desktop). | code mark | |

## Centre Court (tennis)

| Key | Wording now | Where it shows | Source | Yash's wording |
|---|---|---|---|---|
| `games.tennis.phoneHint` | SWIPE OR TAP THE OPEN SIDE | Phone: hint text above the thumb zone. | code mark | |
| `games.tennis.marquee.allIn` | ALL THREE ON THE BIG SCREEN | The "next up" line of the big-screen marquee once all the returns are played. | code mark | |
| `games.tennis.status.game` | GAME YASH | The score bug: replaces "RALLY n" once the game is over. | code mark | |
| `games.tennis.calls.clean` | CLEAN RETURN. | The call shown (and read out) after each return. | code mark | |
| `games.tennis.calls.returned` | RETURNED. | The call shown (and read out) after each return. | code mark | |
| `games.tennis.calls.ace` | ACE. | The call shown (and read out) after each return. | code mark | |
| `games.tennis.calls.wrong` | WRONG SIDE. | The call shown (and read out) after each return. | code mark | |
| `games.tennis.calls.early` | TOO EARLY. | The call shown (and read out) after each return. | code mark | |
| `games.tennis.calls.line` | ON THE LINE. | The call shown (and read out) after each return. | code mark | |
| `games.tennis.comm.missed` | Ace. The project ships anyway. | The commentary line after a return that misses. | code mark | |
| `games.tennis.comm.line` | Clipped the line. Still undefeated. | The commentary line after a ball that clips the line. | code mark | |
| `games.tennis.see` | SEE MATCH HIGHLIGHTS | The end button that leads to Match Highlights. | code mark | |

## Phase 8 tennis (derived)

The 3D Centre Court game. The Hub card's pitch and length were changed from the 2D wording; the rest are new.

| Key | Wording now | Where it shows | Source | Yash's wording |
|---|---|---|---|---|
| `hub.venues.tennis.blurb` | Return my serve. Every point I win puts a project on the big screen. | The Hub's Centre Court card: the one-line pitch (replaces the 2D wording). | code mark | |
| `hub.venues.tennis.duration` | ~40s | The Hub's Centre Court card: how long the game takes (phone: shown instead of a status). | code mark | |
| `games.tennis.three.loading` | PREPARING THE COURT | The loading bar while the 3D court downloads, in the start button's place. | code mark | |
| `games.tennis.three.how` | Pick the open side as he hits. | The how-to-play text in the left panel of the 3D game (desktop). | code mark | |
| `games.tennis.three.progress` | HIS POINTS UNLOCK THE HIGHLIGHTS | The label above the progress bars in the 3D game. | code mark | |
| `games.tennis.three.point` | POINT | The score bug's status (POINT 3) and each highlight card's tag (POINT 3) in the 3D game. | code mark | |
| `games.tennis.three.gamePoint` | GAME POINT | The score bug's status once Yash is on 40 in the 3D game. | code mark | |
| `games.tennis.three.calls.late` | TOO LATE. | The call when your second shot comes too late (3D). | code mark | |
| `games.tennis.three.calls.winner` | WINNER. | The call when you win a point (3D). | code mark | |
| `games.tennis.three.calls.out` | OUT. | The call when your best shot goes out, once you have 30 (3D). | code mark | |
| `games.tennis.three.comm.yourPoint` | Your point. He'll remember that. | The commentary line after you win a point (3D). | code mark | |
| `games.tennis.three.comm.out` | Hawk-Eye says out. By a whisker. | The commentary line after your shot goes OUT (3D). | code mark | |
| `games.tennis.three.comm.gamePoint` | Game point. He's done this before. | The commentary line when Yash has just reached 40 (3D). | code mark | |
| `games.tennis.three.comm.game` | Game, Yash. Still undefeated. | The commentary line when the game is over (3D). | code mark | |

## Badminton Hall

| Key | Wording now | Where it shows | Source | Yash's wording |
|---|---|---|---|---|
| `games.badminton.phoneHint` | PRESS AND HOLD · LET GO TO PLAY | Phone: hint text above the thumb zone. | code mark | |
| `games.badminton.status.game` | GAME YASH | The score bug: replaces the rally name once the game is over. | code mark | |
| `games.badminton.calls.smash` | HE READS IT. | The call shown (and read out) after each shot. | code mark | |
| `games.badminton.calls.clear` | BACK LINE. STILL HIS. | The call shown (and read out) after each shot. | code mark | |
| `games.badminton.calls.drop` | AT THE NET. STILL HIS. | The call shown (and read out) after each shot. | code mark | |
| `games.badminton.calls.perfect` | PERFECT WEIGHT. | The call shown (and read out) after each shot. | code mark | |
| `games.badminton.comm.start` | Your serve. He's reading your grip. | The commentary line when the game opens, before the first shot. | code mark | |
| `games.badminton.comm.rally` | He reads it. Another attribute charged. | The commentary line after an ordinary shot is read. | code mark | |
| `games.badminton.comm.perfect` | Perfect weight. He still got there. | The commentary line after a shot of perfect weight. | code mark | |
| `games.badminton.see` | SEE PLAYER ATTRIBUTES | The end button that leads to Player Attributes. | code mark | |

## All three games

| Key | Wording now | Where it shows | Source | Yash's wording |
|---|---|---|---|---|
| `games.firstReveal` | EVERY INPUT UNLOCKS SOMETHING | Meant for the line under the reveal chip before the first reveal. NOTE: no live page uses it today (only the design-system stories do), so it may be dropped. | code mark | |
| `games.skipShort` | SKIP | Phone: the visible word on the SKIP chip (its spoken name is the full "SKIP TO ..."). | code mark | |
| `games.hubLabel` | HUB | Desktop: the first step of the breadcrumb at the top, back to the Hub. | code mark | |
| `games.backToHub` | BACK TO THE HUB | Phone: a quiet link below the end buttons, because the phone has no breadcrumb. | code mark | |
| `games.highlight` | WATCH THE HIGHLIGHT INSTEAD | The end's main button after a second loss at one venue (G9). | spec 12 | |
| `games.fullTime` | SEE FULL TIME | The end's main button once all three venues are played (F3). | spec 12 | |

## Team Up

| Key | Wording now | Where it shows | Source | Yash's wording |
|---|---|---|---|---|
| `pages.teamUp.prefill` | Good game, Yash. | Starts an empty message box once you have played a venue. Never replaces anything you typed. | code mark | |
| `pages.teamUp.mailto.note` | YOUR EMAIL APP SHOULD OPEN WITH THE MESSAGE READY. PRESS SEND THERE. | Shown when no form service is set and the email app opens instead (spec 12: Team Up submit). | spec 12 | |
| `pages.teamUp.mailto.copy` | COPY MESSAGE | Button next to that note. | spec 12 | |
| `pages.teamUp.mailto.copied` | MESSAGE COPIED ✓ | The button after the click. | spec 12 | |
| `pages.teamUp.error` | That didn't go through. Your message is still here. | Shown when the form service did not answer 2xx. | spec 12 | |
| `pages.teamUp.orEmail` | OR EMAIL | The OR EMAIL fallback shown with that error. | spec 12 | |

## Player Card

| Key | Wording now | Where it shows | Source | Yash's wording |
|---|---|---|---|---|
| `pages.card.copy.done` | LINK COPIED ✓ | The copy-link row after the click (spec 12: Copy-link feedback). | spec 12 | |
| `pages.card.request.title` | REQUEST RESUME | Resume row while no public PDF exists (spec 12: Resume buttons). | spec 12 | |
| `pages.card.request.sub` | OPENS YOUR EMAIL APP | Its second line. | spec 12 | |

## OUT OF BOUNDS (wrong address)

| Key | Wording now | Where it shows | Source | Yash's wording |
|---|---|---|---|---|
| `notFound.tried` | You tried | The body of the 404 page: a line naming the address tried, and two links. | code mark | |
| `notFound.hub` | BACK TO THE HUB | The body of the 404 page: a line naming the address tried, and two links. | code mark | |
| `notFound.home` | HOME | The body of the 404 page: a line naming the address tried, and two links. | code mark | |
| `routes.notFound.heading` | OUT OF BOUNDS | The big heading. | spec 12 | |

## Page titles (browser tab and search results)

| Key | Wording now | Where it shows | Source | Yash's wording |
|---|---|---|---|---|
| `routes.fullTime.title` | Full Time — The Arena | Full Time: the browser tab title (spec 12: every Full Time string is derived). | spec 12 | |
| `routes.fullTime.description` | Your matchday against Yash Sarda: the final score. | Full Time: the description search engines show. | spec 12 | |
| `routes.notFound.title` | Out of Bounds — The Arena | OUT OF BOUNDS: the browser tab title (spec 12: 404 row). | spec 12 | |
| `routes.notFound.description` | This page is out of bounds. | OUT OF BOUNDS: the description search engines show (the page asks them not to list it). | spec 12 | |

## Trophy Room

The first trophy (the cup) is yours from the design. The other four descriptions were written by us.

| Key | Wording now | Where it shows | Source | Yash's wording |
|---|---|---|---|---|
| `trophyRoom[1].description (99.5 Percentile)` | Top half-percent of the state engineering entrance exam — 99.5 percentile, State Merit Rank 709. Preparing properly started here. | Trophy Room: the text under the trophy; Quick View / Player Card may reuse it. | content.json draftCopy | |
| `trophyRoom[2].description (Published Research)` | A conversational AI interviewer built on Google Gemini — designed, built and written up as a paper published in a journal. | Trophy Room: the text under the trophy; Quick View / Player Card may reuse it. | content.json draftCopy | |
| `trophyRoom[3].description (Distinction · CGPA 8.94)` | Four years of Information Technology at PICT, finished with Distinction and a CGPA of 8.94. | Trophy Room: the text under the trophy; Quick View / Player Card may reuse it. | content.json draftCopy | |
| `trophyRoom[4].description (System Design Blogs)` | System design write-ups shared on LinkedIn — how big systems hold up, one diagram at a time. | Trophy Room: the text under the trophy; Quick View / Player Card may reuse it. | content.json draftCopy | |

---

111 strings in total.
