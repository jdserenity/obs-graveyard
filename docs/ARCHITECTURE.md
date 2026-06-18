# Graveyard — Architecture

Obsidian plugin **Graveyard** (`graveyard`).

- `###### Graveyard:` — progress bar minigame (alive tasks above the heading) + `n 🪦 🏆` badge on the heading.
- `###### Done:` — `n ✅` badge on the heading only (checked tasks below); no progress bar or confetti.

## UI

- **Progress bar** (Graveyard only): `n of n alive tasks` + 😇 angels inline to the right, `n%` right-aligned, confetti at 100%.
- **Section badges** (no brackets): Graveyard `n 🪦 🏆`, Done `n ✅`.

## Confetti

Vendored in-repo: `src/ui/confetti.js` + `src/vendor/canvas-confetti.js`. No runtime npm deps.

Tests: `npm test`. Deploy: `obs-deploy`.
