# WEB ARENA SHOOTER — TEAM ROLES & RESPONSIBILITIES

## 1. Team Structure
Four members own separate but connected modules. Each member has a recognizable technical contribution and a defined integration boundary.

| Member | Role | Difficulty | Branch | Assignee |
|---|---|---|---|---|
| **1** | Team Lead + Core Engine + Player | Highest | `Aryan/Lead` | Aryan |
| **2 & 4** | Weapons + Combat & UI + Audio + Asset/QA | High | `aarish/weapons-combat` | Aarish |
| **3** | Enemies + Gameplay Developer | Medium-Hard | `divyansh/enemies-gameplay` | Divyansh |

---

## 2. Dependency Flow
```text
Member 1: Core / Player / GameState
    │
    ▼
Member 2: Weapons / Bullets / Combat
    │
    ▼
Member 3: Enemies / Waves / Pickups
    │
    ▼
Member 4: UI / Audio / Assets / QA
    │
    ▼
Final integration by Member 1
```

---

## 3. MEMBER 1 — TEAM LEAD + CORE ENGINE + PLAYER
- Own main game loop, GameState and shared interfaces.
- Implement player movement and boundaries.
- Define Canvas coordinate/timing conventions.
- Maintain `CONTRACT.md`.
- Review PRs and resolve integration conflicts.
- Run final clean-clone integration test.

### Primary files
- `src/core/gameLoop.js`
- `src/core/gameState.js`
- `src/core/input.js`
- `src/core/collision.js`
- `src/player/player.js`
- `src/player/playerController.js`
- `CONTRACT.md`

### Must not
- Do not implement the complete weapon system.
- Do not implement enemy AI/waves.
- Do not redesign UI/audio without coordination.

---

## 4. MEMBER 2 — WEAPONS + COMBAT
- Implement rifle/shotgun configuration, cooldown, ammo and reload.
- Implement bullets and combat/damage interfaces.
- Use canonical weapon/effect assets.
- Write weapon/combat tests.

### Primary files
- `src/weapons/weaponData.js`
- `src/weapons/weaponSystem.js`
- `src/weapons/bullet.js`
- `src/weapons/combat.js`
- `tests/weapons.test.js`
- `tests/combat.test.js`

---

## 5. MEMBER 3 — ENEMIES + GAMEPLAY
- Implement basic/fast/tank enemies.
- Implement chase, health and defeat.
- Implement waves, pickups and score progression.
- Use canonical enemy/pickup assets.
- Write enemy/wave/pickup tests.

### Primary files
- `src/enemies/enemyData.js`
- `src/enemies/enemy.js`
- `src/enemies/enemySpawner.js`
- `src/gameplay/waves.js`
- `src/gameplay/pickups.js`
- `src/gameplay/score.js`
- `tests/enemies.test.js`
- `tests/waves.test.js`

---

## 6. MEMBER 4 — UI + AUDIO + ASSETS + QA
- Implement menu, HUD, game-over and restart UI.
- Implement centralized asset loading and safe fallbacks.
- Implement audio manager.
- Maintain the single `/assets` folder with no subfolders.
- Use Antigravity to source missing assets when appropriate; verify usage rights and rename to canonical names.
- Run integration tests and report cross-module failures.

### Primary files
- `src/ui/hud.js`
- `src/ui/menu.js`
- `src/ui/gameOver.js`
- `src/audio/audioManager.js`
- `src/core/assetLoader.js`
- `assets/*`
- `tests/ui.test.js`
- `tests/assets.test.js`

---

## 7. Individual Definition of Done

| Member | Complete when... |
|---|---|
| **1** | Core loop, GameState, player and shared interfaces work; tests pass; contract is maintained. |
| **2** | Rifle/shotgun, bullets, cooldown/ammo and damage work; tests pass. |
| **3** | Three enemy types, waves, pickups and score work; tests pass. |
| **4** | HUD/menu/game-over/audio/asset loader work; assets load/fallback safely; integration tests pass. |
