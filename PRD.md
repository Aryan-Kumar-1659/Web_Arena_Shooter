# WEB ARENA SHOOTER — PRODUCT REQUIREMENT DOCUMENT (PRD)

## 1. Product Overview
Web Arena Shooter is a browser-based 2D top-down shooting game. The player moves around an arena, aims with the mouse, shoots enemies, survives waves, collects health/ammunition pickups, and accumulates score.

## 2. Product Goal
Create a small but complete game while demonstrating modular JavaScript, Canvas rendering, gameplay systems, Git collaboration, testing, and integration.

## 3. Core User Flow
```text
Open Game → Start → Move + Aim → Shoot
  → Enemies Spawn → Damage/Defeat Enemies
  → Wave Progression → Pickups + Score
  → Player Dies? → Game Over → Restart
```

## 4. Functional Requirements
- **FR-01**: Modern desktop browser support.
- **FR-02**: WASD/arrow movement.
- **FR-03**: Mouse aiming.
- **FR-04**: Left mouse fires.
- **FR-05**: Rifle and shotgun in MVP.
- **FR-06**: Weapon cooldown, ammo and reload behavior.
- **FR-07**: Enemy wave spawning.
- **FR-08**: Basic/fast/tank enemy chase behavior.
- **FR-09**: Bullet-enemy collision and damage.
- **FR-10**: Player health and enemy damage.
- **FR-11**: Health and ammo pickups.
- **FR-12**: Score for defeated enemies.
- **FR-13**: HUD for health, ammo, score, wave and weapon.
- **FR-14**: Game-over and restart without page refresh.
- **FR-15**: Core audio when assets are available.

## 5. Non-Functional Requirements
- Modules must be independently testable.
- Missing optional assets must not crash the game.
- One coordinated `requestAnimationFrame` loop owns updates/rendering.
- Shared object/event formats come from `CONTRACT.md`.
- Avoid unnecessary browser permissions/APIs.

## 6. MVP Scope
- Canvas arena
- Player movement/collision
- Mouse aiming
- Rifle + shotgun
- Bullets
- Three enemy types
- Waves
- Health/ammo pickups
- Score
- HUD
- Game-over/restart
- Basic audio
- Asset fallback
- Automated tests

## 7. Out of Scope
- Online multiplayer
- Accounts
- 3D graphics
- Advanced pathfinding
- Complex physics engine
- Backend/database
- Required mobile touch controls

## 8. Definition of Done
- Clean clone installs
- Game starts
- Core gameplay works
- Assets load or fallback
- Tests pass
- Production build succeeds
- Four Git contributions are merged
- Main branch is playable
