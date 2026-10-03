# Artboard reference renderer: known issues

The references in `design/references/` (gitignored, rebuilt by `pnpm references`) are static end-states of the handoff boards.

## How boards are settled

- CSS transitions are switched off, so they jump to their end state.
- Animations use the Web Animations API: infinite animations are paused at frame 0 (the authored look), finite ones are finished.
- There is no long wait for the Intro (the old 7s settle is gone). A short 300ms pause runs before the screenshot.
- Hover, game state and other JS-driven timelines are not emulated.

## Things that look wrong but are expected

- Main: the SOFTWARE ENGINEER tracking looks collapsed. The boot keyframe's end state has the letter spacing collapsed (audit risk #11). Do not copy this when building the real hero.
- Motion: the wipe is off-screen at frame 0, as that is where its animation rests at frame 0.
- QuickView is 1440x3300, not 1440x900. The bottom ~300px is empty page padding by design.
- Intro: the spotlight rigs slightly overlap the REPLAY and SKIP INTRO buttons at the top right, as authored.
- Resume PDF is not served, so any resume link is inert.
- No board renders blank or with raw `{{...}}` (all 23 scanned).

## Comparing renders

References are not byte-identical between runs, so compare with the tolerance diff in `tests/support/visual.ts`, never with a byte comparison.
