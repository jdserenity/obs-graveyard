# Graveyard — Architecture

Obsidian plugin **Graveyard** (`graveyard`). Activates on notes with `###### Graveyard:`.

## UI

- **Progress bar**: `n of n alive tasks` + 😇 angels inline to the right, `n%` right-aligned, confetti at 100%.
- **Graveyard badge**: `n 🪦 🏆` on the heading (no brackets).

## Confetti

Vendored in-repo: `src/ui/confetti.js` + `src/vendor/canvas-confetti.js`. No runtime npm deps.

Tests: `npm test`. Deploy: `obs-deploy`.
