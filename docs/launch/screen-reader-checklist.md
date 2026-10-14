# Screen reader check: about 10 minutes

You will use VoiceOver (Apple's screen reader) to "listen" to the site, the way a blind visitor would. You do not need to be good at it. You only need to say, for each step, whether what you heard matches what is written here.

Do the **Mac (Safari)** lines on your Mac. Do the **iPhone** lines on your phone. Both are short. If you are short on time, do the Mac lines in steps 1 to 8 and the iPhone lines only in steps 3 and 4.

**Which address to open.** Run `pnpm build` and then `pnpm preview` in the project folder, and open `http://127.0.0.1:4173` in Safari on your Mac. This works in Safari (the setting that used to break it, "upgrade insecure requests", now lives in the host's headers and is only used on the live https site). For the iPhone lines, the phone must reach your Mac: run `pnpm exec sirv build/client --single __spa-fallback.html --port 4173 --host 0.0.0.0` instead of `pnpm preview`, and open `http://<your Mac's address on the Wi-Fi>:4173` on the phone. (If you only have the Mac, do the Mac lines.)

Write your finding in each box. Anything marked "Not OK" comes back to me as a fix.

---

## Before you start (2 minutes)

### Mac

1. Open **Safari**.
2. Turn on keyboard moves for web pages: Safari menu, **Settings**, **Advanced**, tick **Press Tab to highlight each item on a webpage**.
3. Turn VoiceOver on or off with **Command + F5**. (On a MacBook with Touch ID you can also press Touch ID three times quickly.) A welcome box may appear: choose **Use VoiceOver**.
4. The "VO keys" in this list are **Control + Option** held together. Written as **VO**.

The keys you need:

| Key | What it does |
|---|---|
| **VO + Right Arrow** / **VO + Left Arrow** | Next / previous thing on the page |
| **VO + Space** | Press the thing you are on (a click) |
| **VO + U** | Opens the rotor: a menu of headings, links, buttons. Use **Left/Right Arrow** to pick a list, **Up/Down Arrow** to pick an item, **Enter** to jump there, **Escape** to leave |
| **VO + Command + H** | Jump to the next heading |
| **Tab** | Next thing you can press (links, buttons, fields) |
| **Control** | Stop talking |
| **Escape** | Close a pop-up |

### iPhone

1. **Settings, Accessibility, VoiceOver**, switch on. (Or say "Hey Siri, turn on VoiceOver".)
2. Open **Safari** and go to the site.

The gestures you need:

| Gesture | What it does |
|---|---|
| **Swipe right** / **swipe left** (one finger) | Next / previous thing |
| **Double-tap** (one finger, anywhere) | Press the thing you are on |
| **Rotor**: twist two fingers on the screen like turning a dial | Picks what swipe up/down jumps by (Headings, Links, and so on). Then **swipe down** = next, **swipe up** = previous |
| **Two-finger scrub** (a quick "Z" with two fingers) | Go back / close a pop-up |
| **Two-finger tap** | Stop or start talking |

### For the game steps (3 and 4): turn on Reduce Motion

The games are timing games, which is hard to do by ear. With **Reduce Motion** on, each game plays itself in a few seconds and tells you what happens. That is the better way to hear it.

- **Mac:** System Settings, Accessibility, Display, **Reduce motion**.
- **iPhone:** Settings, Accessibility, Motion, **Reduce Motion**.

Turn it off again when you finish.

---

## 1. Landing, then ENTER

**Do:** Open the home page. Let it finish its opening (about 3 seconds). Move through the page with VO + Right Arrow (iPhone: swipe right).

**You should hear:**
- The tab title "Yash Sarda — The Arena" when the page loads.
- A heading **"YASH SARDA, heading level 1"**.
- A link or button **"ENTER THE ARENA"**, and another one for **"VIEW PORTFOLIO"**.
- No long run of meaningless noises, and nothing read out twice in a row.

**Then:** Go to ENTER THE ARENA and press it (VO + Space; iPhone: double-tap). The Player Introduction plays. It has its own ENTER THE ARENA link at the end.

**You should hear:** after each page change, the new page title spoken, and the VoiceOver cursor sits on the new page's main heading (for example "PLAYER INTRODUCTION, heading level 1"). You should not have to hunt for where you are.

- [ ] OK   [ ] Not OK   Note: ______________________________________________

---

## 2. The Hub: headings and the three venue cards

**Do:** Press ENTER THE ARENA on the Introduction. You land on the Hub.

**Mac:** Open the rotor (VO + U), pick **Headings** with the Left/Right Arrow, and read the list.
**iPhone:** Twist the rotor to **Headings**, then swipe down through them.

**You should hear:**
- One level 1 heading: **"CHOOSE YOUR VENUE"**.
- The three venues by name: **CRICKET GROUND**, **CENTRE COURT**, **BADMINTON HALL**. Each card has a **PLAY** link and a **SKIP** link.
- Below them the extra places (Trophy Room, Training Academy, Player Card, Team Up).
- On the Mac at full width: a left-hand list called **"Portfolio index"** with the page names and a "SEEN" tag on pages you have visited.

**Check:** Does each PLAY link say which venue it belongs to when you reach it, or only "PLAY"? Write down what you hear. (Either is fine if the card name comes just before it.)

- [ ] OK   [ ] Not OK   Note: ______________________________________________

---

## 3. The INDEX drawer (iPhone, or a narrow Mac window)

The INDEX button only exists on a phone-width page. On the Mac, drag the Safari window narrower than about 1100 pixels to see it.

**Do:** Find the button **INDEX** near the top, next to QUICK VIEW. Press it (iPhone: double-tap).

**You should hear:**
- Before pressing: **"INDEX, button"**, and something like "has pop-up" or "collapsed".
- After pressing: a panel called **"Portfolio index"** opens, and VoiceOver moves into it.
- Swiping right and left only moves **inside** the panel (the index links and **"Close the index"**). You can never swipe onto the venue cards behind it.

**Then:** Close it with the **"Close the index"** button, or **Escape** (Mac), or the two-finger scrub (iPhone).

**You should hear:** the panel goes away, and VoiceOver is back on the **INDEX** button, not at the top of the page.

- [ ] OK   [ ] Not OK   Note: ______________________________________________

---

## 4. One cricket game (Reduce Motion on)

**Do:** From the Hub, press PLAY on **CRICKET GROUND**. Listen for the title. Then wait. With Reduce Motion on, the three balls play themselves.

**You should hear:**
- The heading **"BOWL AT ME, heading level 1"** after the page loads.
- After each ball, VoiceOver says the call on its own, without you moving: **"DOT BALL."**, **"FOUR."** or **"SIX."**, followed by the part of Yash's career that ball unlocked. (This is a quiet announcement, so it may wait for VoiceOver to finish its current sentence.)
- When the over ends, VoiceOver says how it ended, and the cursor lands on a button by itself.

**Check the end buttons:** the first one is **"SEE THE FULL SCORECARD"** (or "SEE FULL TIME" if you have already played all three venues, or "WATCH THE HIGHLIGHT INSTEAD" after two losses). Press **Tab** (iPhone: swipe right) and you should reach **"BOWL AGAIN"**, then (iPhone only) **"BACK TO THE HUB"**.

**Optional, with Reduce Motion off (Mac):** Tab to **"BOWL BALL"** and press **Space** or **Enter** to bowl. Missing the timing is fine. You only want to hear that the call is still announced.

- [ ] OK   [ ] Not OK   Note: ______________________________________________

---

## 5. Full Time

You need all three games played for the full result. With Reduce Motion on, go back to the Hub and play **CENTRE COURT** and **BADMINTON HALL** the same way (about 10 seconds each). The last game's main end button is now **SEE FULL TIME**. Press it.

**You should hear:**
- A heading that is one of **"GOOD TRY."**, **"NICE EFFORT."** or **"SO CLOSE."** (heading level 1). Which one depends on how you did.
- The scoreboard read as one thing: **"Final score: You 0, Yash 3"**. It should say this once, not number by number.
- Then a line of commentary, a card inviting you to TEAM UP, and the links PLAY AGAIN and SEE THE PLAYER CARD.

If you open Full Time before finishing all three games, you should instead hear **"NOT YET."** and **"1 of 3 venues played."** (or 0 or 2), with a card sending you to the next venue.

- [ ] OK   [ ] Not OK   Note: ______________________________________________

---

## 6. Team Up: form errors

**Do:** Open **Team Up** (from the Full Time card, or the Hub). Move to the format choices, then to the fields. Press **Tab** (iPhone: swipe right) through the form.

**You should hear:**
- A group called **"CHOOSE YOUR FORMAT"** with three radio choices: **SIGN A PLAYER**, **DOUBLES**, **FRIENDLY RALLY**. Each says "radio button" and "1 of 3", and which one is selected.
- The fields **YOUR NAME**, **EMAIL**, **THE CHALLENGE**, each with its name read before "edit text".
- If you played a game first, THE CHALLENGE already contains **"Good game, Yash."** and you hear that text.

**Now make mistakes on purpose.** Leave everything empty and press **SEND CHALLENGE**.

**You should hear:** focus jumps to the **YOUR NAME** field, and VoiceOver says its name, that it is **invalid** (it may say "invalid data"), and the message: **"Tell me who's challenging."**

Type a name, then an email of just `abc`, a message of just `hi`, and press SEND CHALLENGE again.

**You should hear:** focus goes to **EMAIL**: **"That email doesn't look right."** Fix it and press SEND once more: the next problem is THE CHALLENGE: **"Add a line or two about the challenge (at least 10 characters)."**

**Do not finish and send.** (Without a form service set up, a real send opens your mail app.)

- [ ] OK   [ ] Not OK   Note: ______________________________________________

---

## 7. Quick View

**Do:** From any page, press **QUICK VIEW** (it is in the top bar). This is the recruiter page.

**You should hear:**
- A heading **"YASH SARDA, heading level 1"**.
- A **"Sections"** navigation with CAREER, HIGHLIGHTS, ATTRIBUTES, TROPHIES and TEAM UP.
- Open the rotor to **Headings**: one heading per part (career, highlights, and so on) in a sensible order.
- A **"REQUEST RESUME"** control (there is no public PDF yet).
- Pressing a Sections link moves VoiceOver to that part, and the next swipe or Tab starts from there.

- [ ] OK   [ ] Not OK   Note: ______________________________________________

---

## 8. OUT OF BOUNDS (a wrong address)

**Do:** In Safari type a wrong address such as `…/arena/nope` and press Enter.

**You should hear:**
- The title **"Out of Bounds — The Arena"**.
- A heading **"OUT OF BOUNDS, heading level 1"**.
- A line naming what you tried: **"You tried /arena/nope"**.
- Three links: **BACK TO THE HUB**, **QUICK VIEW** and **HOME**. Each one works.

- [ ] OK   [ ] Not OK   Note: ______________________________________________

---

## When you are done

1. Turn VoiceOver off (Command + F5 on the Mac, or triple-click the side button on the iPhone).
2. Turn **Reduce Motion** off again if you want the animations back.
3. Send me this file with the boxes filled in. Anything marked **Not OK** becomes a fix, with your note telling me what you heard.

**Overall:** [ ] Nothing in my way   [ ] Some parts were confusing   [ ] I got stuck

Anything else you noticed: ______________________________________________

---

## Words used here

- **VoiceOver (VO):** Apple's built-in screen reader. It reads what is on screen aloud and lets you move around without looking.
- **Screen reader:** software that speaks a page and lets you navigate it with the keyboard or gestures.
- **Rotor:** VoiceOver's menu of "kinds of things" (headings, links, buttons) so you can jump between them instead of going one by one.
- **Heading level 1:** the main title of a page. Each page should have exactly one.
- **Focus:** the thing currently selected, the one that gets the next key press. VoiceOver's own pointer is called the "cursor"; on a well-built page it follows focus.
- **Live announcement (polite):** a message the page speaks by itself without taking focus. "Polite" means it waits until VoiceOver finishes its sentence.
- **Dialog / drawer:** a pop-up panel. A proper one keeps VoiceOver (and the keyboard) inside until it closes.
- **Invalid:** what VoiceOver says for a form field that has an error message attached to it.
- **Reduce Motion:** a system setting asking apps to avoid movement. This site answers it by playing the games for you.
