# KILLER

A local, single-file party game — like *imposter*, but everyone's a suspect.

By **RisingForce** — [GitHub](https://github.com/risingforce1337-afk) · Discord `risingforce1337`

Pass one phone around. Each player **holds** to reveal their secret role:

- **Innocents** all see the same secret **word**.
- The **killer** sees only a vague **hint** — an *action* or a *feel* (e.g. word `KNOB` → hint `twist`), never enough to guess the word.

Then, out loud, everyone says **one word** tied to the secret word to prove they're innocent. The killer has to bluff off their hint without getting caught. Vote out the suspect.

## How to run

Open `index.html` in any browser — desktop or phone. No install, no server, no
internet needed (background, fonts, sounds and everything else are embedded).

On a phone it's worth using **Add to Home Screen** — it launches without browser
chrome, which keeps the address bar out of the way while the phone goes round.

## Features

- 4–16 players, 1 to half-the-table killers
- Fast hold-to-reveal with a charge ring and a haptic buzz
- The reveal screen is **identical** for killer and innocent — same colours, same
  label, only the words differ, so an onlooker learns nothing
- Settings are remembered between sessions
- **542 words** across animals, food, nature, objects, jobs, places, countries and
  more, each with a deliberately-vague hint so the killer can't reverse-engineer
  the word
- Works with a mouse, a touchscreen, or the keyboard (Tab to the circle, hold
  Space or Enter)

## Play

Everything happens on the phone only for role + word dealing. The talking,
bluffing, and voting happen out loud, in real life.

`QUIT` in the top-left of the pass screen abandons the round if you started one
by mistake; the counter in the top-right shows how far round the table you are.

## Tests

`node test-logic.js` runs the game logic headlessly (role dealing, the
players/killers clamps, settings persistence, and word-bank integrity — no
duplicate words, and no hint that gives its own word away). No dependencies.

## Credits

Game, design, code, art, sound and word bank by **RisingForce**.

- GitHub — <https://github.com/risingforce1337-afk>
- Discord — `risingforce1337`
