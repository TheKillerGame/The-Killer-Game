# KILLER

A local, single-file party game — like *imposter*, but everyone's a suspect.

By **RisingForce** — [GitHub](https://github.com/TheKillerGame/The-Killer-Game) · Discord `risingforce1337`

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
- The reveal screen colour-codes the role: **KILLER** in red, **INNOCENT** in
  green. The label and the word are styled the same either way, so only that one
  line differs — but colour reads from further off than text does, so hold the
  phone low when you look
- **Rare chaos rounds.** Nothing on screen announces them; each player's phone
  looks like a completely ordinary round and it only falls apart out loud:
  - **0.2%** — *everyone* is a killer. No innocents at all, everyone gets the
    same vague hint, and every single player thinks they're the only one bluffing.
  - **0.1%** — everyone is innocent, but **no two players share a word**. Every
    answer is honest and every answer sounds like a bluff.
- **No repeat words.** Every word in the bank is dealt once before any word
  comes back, and the phone remembers which ones you have had, so closing
  the game or playing another day never brings an old word back early
- Background music loops quietly on every screen (it starts on the first tap,
  because browsers block sound until then); the speaker button on the home
  screen mutes it, and that choice is remembered
- Settings are remembered between sessions
- **1500 words** across animals, insects, sea life, birds, myth, food, fruit,
  nature, space, household, tools, tech, jobs, sports, music, transport, places,
  clothing, materials, feelings, holidays, toys and countries — each with a
  deliberately-vague hint so the killer can't reverse-engineer the word
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

- Game, design, art and sound: **RisingForce**
- Code: **RisingForce** and **Infernus**
- Word bank: **Infernus**
- Music: *Somewhere in the Elevator* by **Peachtea** and **RisingForce**

- GitHub — <https://github.com/TheKillerGame/The-Killer-Game>
- Discord — `risingforce1337`
