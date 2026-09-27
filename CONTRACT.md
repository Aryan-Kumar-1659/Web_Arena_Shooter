# WEB ARENA SHOOTER — FIXED SKELETON / CONTRACT

## Single Source of Truth
This document freezes the technical contract for the four-member 2D web shooter. It prevents incompatible folder structures, state objects, events, asset names, module APIs, and update-loop implementations.

## Contract Freeze Rule
All four members agree before development. A required change must be explained, agreed, and documented before dependent implementation continues.

---

## 1. FIXED PROJECT STRUCTURE

```text
web-arena-shooter/
├── assets/
│   ├── player_idle.png
│   ├── player_walk_1.png
│   ├── player_walk_2.png
│   ├── player_shoot.png
│   ├── enemy_basic_idle.png
│   ├── enemy_basic_walk_1.png
│   ├── enemy_basic_walk_2.png
│   ├── enemy_fast_idle.png
│   ├── enemy_fast_walk_1.png
│   ├── enemy_fast_walk_2.png
│   ├── enemy_tank_idle.png
│   ├── enemy_tank_walk_1.png
│   ├── enemy_tank_walk_2.png
│   ├── rifle.png
│   ├── shotgun.png
│   ├── bullet.png
│   ├── muzzle_flash.png
│   ├── hit_effect.png
│   ├── explosion.png
│   ├── health_pickup.png
│   ├── ammo_pickup.png
│   ├── arena_floor.png
│   ├── wall.png
│   ├── crate.png
│   ├── health_icon.png
│   ├── ammo_icon.png
│   ├── score_icon.png
│   ├── crosshair.png
│   ├── rifle_fire.wav
│   ├── shotgun_fire.wav
│   ├── enemy_hit.wav
│   ├── enemy_death.wav
│   ├── player_hit.wav
│   ├── pickup_health.wav
│   ├── pickup_ammo.wav
│   ├── wave_start.wav
│   ├── game_over.wav
│   ├── button_click.wav
│   └── background_music.ogg
├── src/
│   ├── core/
│   │   ├── gameLoop.js
│   │   ├── gameState.js
│   │   ├── input.js
│   │   ├── collision.js
│   │   └── assetLoader.js (Member 4)
│   ├── player/
│   │   ├── player.js
│   │   └── playerController.js
│   ├── weapons/
│   │   ├── weaponData.js (Member 2)
│   │   ├── weaponSystem.js (Member 2)
│   │   ├── bullet.js (Member 2)
│   │   └── combat.js (Member 2)
│   ├── enemies/
│   │   ├── enemyData.js (Member 3)
│   │   ├── enemy.js (Member 3)
│   │   └── enemySpawner.js (Member 3)
│   ├── gameplay/
│   │   ├── waves.js (Member 3)
│   │   ├── pickups.js (Member 3)
│   │   └── score.js (Member 3)
│   ├── ui/
│   │   ├── hud.js (Member 4)
│   │   ├── menu.js (Member 4)
│   │   └── gameOver.js (Member 4)
│   ├── audio/
│   │   └── audioManager.js (Member 4)
│   └── main.js
├── tests/
│   ├── core.test.js
│   ├── player.test.js
│   ├── weapons.test.js
│   ├── combat.test.js
│   ├── enemies.test.js
│   ├── waves.test.js
│   ├── ui.test.js
│   └── assets.test.js
├── index.html
├── package.json
├── vite.config.js
├── CONTRACT.md
├── README.md
├── PRD.md
└── TEAM_ROLES.md
```

---

## 2. OWNERSHIP & RESPONSIBILITIES

| Member | Primary Ownership | Difficulty | Branch |
|---|---|---|---|
| **Member 1** | Core engine + Player + Shared state + Contract + Integration | Highest | `lead-core-player` |
| **Member 2** | Weapons + Bullets + Combat mechanics | Medium | `weapons-combat` |
| **Member 3** | Enemies + Waves + Pickups + Score progression | Medium-Hard | `enemies-gameplay` |
| **Member 4** | UI + Audio + Asset loader/fallback + QA | Medium | `ui-audio-qa` |

---

## 3. ASSET CONTRACT

All runtime assets **MUST** be direct children of `/assets`. No asset subfolders are permitted.

| Category | Required Filename | Purpose | MVP |
|---|---|---|---|
| Player | `player_idle.png` | Default player sprite | Yes |
| Player | `player_walk_1.png` / `player_walk_2.png` | 2-frame movement animation | Yes |
| Player | `player_shoot.png` | Shooting pose | Optional; fallback allowed |
| Enemies | `enemy_basic_idle.png` | Basic enemy | Yes |
| Enemies | `enemy_basic_walk_1.png` / `enemy_basic_walk_2.png` | Basic enemy animation | Yes |
| Enemies | `enemy_fast_idle.png` | Fast enemy | Yes |
| Enemies | `enemy_fast_walk_1.png` / `enemy_fast_walk_2.png` | Fast enemy animation | Optional |
| Enemies | `enemy_tank_idle.png` | Tank enemy | Yes |
| Enemies | `enemy_tank_walk_1.png` / `enemy_tank_walk_2.png` | Tank enemy animation | Optional |
| Weapons | `rifle.png` | Rifle visual | Yes |
| Weapons | `shotgun.png` | Shotgun visual | Yes |
| Weapons | `bullet.png` | Projectile visual | Yes |
| Effects | `muzzle_flash.png` | Muzzle effect | Optional |
| Effects | `hit_effect.png` | Hit feedback | Optional |
| Effects | `explosion.png` | Explosion effect | Optional |
| Pickups | `health_pickup.png` | Health pickup | Yes |
| Pickups | `ammo_pickup.png` | Ammo pickup | Yes |
| Environment | `arena_floor.png` | Arena floor texture | Optional |
| Environment | `wall.png` | Wall/obstacle texture | Optional |
| Environment | `crate.png` | Obstacle decoration | Optional |
| UI | `health_icon.png` / `ammo_icon.png` / `score_icon.png` | HUD icons | Yes |
| UI | `crosshair.png` | Mouse aiming crosshair | Yes |
| Audio | `rifle_fire.wav` | Rifle sound | Yes |
| Audio | `shotgun_fire.wav` | Shotgun sound | Yes |
| Audio | `enemy_hit.wav` / `enemy_death.wav` | Enemy feedback | Yes |
| Audio | `player_hit.wav` | Player damage | Yes |
| Audio | `pickup_health.wav` / `pickup_ammo.wav` | Pickup feedback | Yes |
| Audio | `wave_start.wav` | Wave transition | Yes |
| Audio | `game_over.wav` | Game over | Yes |
| Audio | `button_click.wav` | UI click | Yes |
| Audio | `background_music.ogg` | Background music | Optional |

---

## 4. ASSET LOADING RULES
- Member 4 owns the centralized asset registry/loader (`src/core/assetLoader.js`).
- Code uses canonical filenames/keys, never arbitrary downloaded filenames.
- Required assets have safe primitive fallbacks (Canvas shapes/colors) so the game never crashes if an asset is missing.
- Optional assets may be absent without blocking startup.
- Asset loading must never execute downloaded content.

---

## 5. MODULE BOUNDARIES & DATA FLOW

```text
       [ Browser Input Events ]
                  │
                  ▼
         [ src/core/input.js ]
                  │ (raw inputs: keys, mouse pos & clicks)
                  ▼
       [ src/core/gameLoop.js ] ── (Owns requestAnimationFrame)
                  │
     ┌────────────┼─────────────┬─────────────┐
     ▼            ▼             ▼             ▼
[ Player ]   [ Weapons ]   [ Enemies ]   [ Pickups ]
(Movement &  (Shooting &   (AI & Waves)  (Spawning &
Boundaries)   Cooldowns)                  Collection)
     │            │             │             │
     └────────────┴──────┬──────┴─────────────┘
                         ▼
             [ src/core/collision.js ]
                         │
                         ▼
             [ src/core/gameState.js ]
                         │ (State & Events)
                         ▼
             [ Canvas Rendering & UI ]
```

---

## 6. SHARED GAME STATE SCHEMA

```typescript
interface GameState {
  status: "MENU" | "PLAYING" | "PAUSED" | "GAME_OVER";
  score: number;
  wave: number;
  player: PlayerState;
  weapon: WeaponState;
  enemies: EnemyState[];
  bullets: BulletState[];
  pickups: PickupState[];
}
```

---

## 7. CORE ENTITY CONTRACTS

### PlayerState
```typescript
interface PlayerState {
  id: string;          // e.g. "player_1"
  x: number;           // Arena X coordinate (pixels)
  y: number;           // Arena Y coordinate (pixels)
  radius: number;      // Collision radius (e.g. 20)
  health: number;      // Current health points (e.g. 100)
  maxHealth: number;   // Maximum health points (e.g. 100)
  speed: number;       // Movement speed (pixels per second, e.g. 240)
  angle?: number;      // Aim angle in radians
}
```

### WeaponState
```typescript
interface WeaponState {
  id: "rifle" | "shotgun";
  ammo: number;            // Current ammunition count
  magazineSize: number;    // Maximum ammo capacity per magazine
  cooldownMs: number;      // Time between shots in ms
  damage: number;          // Damage dealt per bullet hit
}
```

### EnemyState
```typescript
interface EnemyState {
  id: string;                       // Unique identifier (e.g. "enemy_123")
  type: "basic" | "fast" | "tank"; // Enemy archetype
  x: number;                        // Arena X coordinate
  y: number;                        // Arena Y coordinate
  radius: number;                   // Collision radius (e.g. 15-25)
  health: number;                   // Current health points
  maxHealth: number;                // Maximum health points
  speed: number;                    // Movement speed (pixels/sec)
  damage: number;                   // Damage dealt on contact with player
}
```

### BulletState
```typescript
interface BulletState {
  id: string;           // Unique bullet id
  x: number;            // Current X position
  y: number;            // Current Y position
  vx: number;           // Velocity X (pixels/sec)
  vy: number;           // Velocity Y (pixels/sec)
  radius: number;       // Hitbox radius (e.g. 4)
  damage: number;       // Damage inflicted on hit
  owner: "player";      // Projectile source
}
```

### PickupState
```typescript
interface PickupState {
  id: string;                 // Unique pickup id
  type: "health" | "ammo";    // Pickup type
  x: number;                  // Arena X coordinate
  y: number;                  // Arena Y coordinate
  radius: number;             // Collision radius (e.g. 12)
  value: number;              // Amount restored (e.g. 25 health or 30 ammo)
}
```

---

## 8. EVENT CONTRACT

Events are dispatched via the centralized `EventBus` in `src/core/gameState.js`.

| Event | Payload | Producer $\to$ Consumer | Description |
|---|---|---|---|
| `game:start` | `undefined` | UI $\to$ Core | Start the game session |
| `game:restart` | `undefined` | UI $\to$ Core | Reset state and restart game |
| `player:shoot` | `{ weaponId, x, y, angle }` | Core/Weapon $\to$ Combat | Player fired weapon at target angle |
| `enemy:hit` | `{ enemyId, damage }` | Combat $\to$ Enemy | Bullet connected with enemy |
| `enemy:defeated` | `{ enemyId, scoreValue }` | Enemy $\to$ Gameplay/UI | Enemy killed; triggers score and pickup chance |
| `player:damaged` | `{ damage, health }` | Enemy $\to$ Core/UI | Player took contact or combat damage |
| `pickup:collected` | `{ pickupId, type, value }` | Gameplay $\to$ Core/UI | Player collected health/ammo pickup |
| `wave:started` | `{ wave }` | Gameplay $\to$ UI | New wave spawned |
| `game:over` | `{ score, wave }` | Core $\to$ UI | Player health reached 0 |

---

## 9. UPDATE LOOP RULE

```text
requestAnimationFrame(loop)
  ├── 1. Compute delta time (dt in seconds, capped to max 0.1s)
  ├── 2. Process inputs (keyboard, mouse position, buttons)
  ├── 3. Update player (movement, boundary clamping, rotation)
  ├── 4. Update weapons / bullets (cooldowns, bullet trajectories)
  ├── 5. Update enemies / waves / pickups (spawning, pathing, timers)
  ├── 6. Collision detection & resolution (bullet-enemy, player-enemy, player-pickup)
  ├── 7. State updates & event dispatch (health checks, score updates, game over trigger)
  ├── 8. Render Canvas (arena, floor, pickups, enemies, bullets, player, effects)
  └── 9. Render HUD & UI overlay
```

- **Only `src/core/gameLoop.js` owns `requestAnimationFrame`.**
- Other modules expose `update(dt)` and `render(ctx)` functions and do **not** instantiate nested or competing requestAnimationFrame loops.

---

## 10. CANVAS COORDINATE & TIMING CONVENTIONS
- **Origin `(0,0)`**: Top-left corner of the arena.
- **Arena Dimensions**: Standard Canvas resolution is `800 x 600` (configurable via GameState).
- **Delta Time (`dt`)**: Represented in **seconds** (float, e.g. `0.0166` for 60fps).
- **Velocities**: Units are strictly **pixels per second**. Position delta is calculated as:
  $$x_{\text{new}} = x_{\text{current}} + v_x \cdot dt$$
- **Angles**: Radians, with $0$ pointing right ($+X$ axis), $\frac{\pi}{2}$ pointing down ($+Y$ axis), normalized in $[-\pi, \pi]$ or $[0, 2\pi]$.

---

## 11. GIT & MERGE RULES
- **Branches**:
  - `lead-core-player` (Member 1)
  - `weapons-combat` (Member 2)
  - `enemies-gameplay` (Member 3)
  - `ui-audio-qa` (Member 4)
- Merge order:
  1. `lead-core-player`
  2. `weapons-combat`
  3. `enemies-gameplay`
  4. `ui-audio-qa`
  5. Final clean-clone integration test on `main`.
