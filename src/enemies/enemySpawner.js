/**
 * Web Arena Shooter - Enemy Spawner
 * Member 3: Enemies + Gameplay
 *
 * Handles enemy instantiation, spawn positioning along arena boundaries,
 * wave enemy composition generation, and enemy lifecycle management.
 */

import { Enemy, createEnemy } from './enemy.js';

/**
 * Calculates a spawn coordinate along the arena perimeter, ensuring a safe
 * distance from the player so enemies never spawn directly on top of them.
 *
 * @param {number} arenaWidth Total arena width
 * @param {number} arenaHeight Total arena height
 * @param {number} [playerX] Current player X
 * @param {number} [playerY] Current player Y
 * @param {number} [minDistance=150] Minimum distance from player
 * @returns {{x: number, y: number}} Spawn coordinates
 */
export function getSpawnPosition(arenaWidth = 800, arenaHeight = 600, playerX = null, playerY = null, minDistance = 150) {
  const margin = 20;
  let attempts = 0;
  let x = 0;
  let y = 0;

  while (attempts < 10) {
    // Choose one of the 4 borders: 0 = top, 1 = right, 2 = bottom, 3 = left
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0: // Top
        x = Math.random() * arenaWidth;
        y = margin;
        break;
      case 1: // Right
        x = arenaWidth - margin;
        y = Math.random() * arenaHeight;
        break;
      case 2: // Bottom
        x = Math.random() * arenaWidth;
        y = arenaHeight - margin;
        break;
      case 3: // Left
        x = margin;
        y = Math.random() * arenaHeight;
        break;
    }

    if (playerX === null || playerY === null) {
      return { x, y };
    }

    const dist = Math.hypot(x - playerX, y - playerY);
    if (dist >= minDistance) {
      return { x, y };
    }
    attempts++;
  }

  return { x, y };
}

/**
 * Determines enemy type composition based on wave number.
 * Higher waves introduce fast enemies and tank enemies in increasing amounts.
 *
 * @param {number} waveNumber
 * @returns {Array<'basic'|'fast'|'tank'>} Array of enemy type names
 */
export function getWaveComposition(waveNumber = 1) {
  const safeWave = Math.max(1, Math.floor(waveNumber));
  const types = [];

  // Basic enemies scale linearly
  const basicCount = 4 + safeWave * 2;
  for (let i = 0; i < basicCount; i++) {
    types.push('basic');
  }

  // Fast enemies introduced in wave 2+
  if (safeWave >= 2) {
    const fastCount = Math.floor(safeWave * 1.5);
    for (let i = 0; i < fastCount; i++) {
      types.push('fast');
    }
  }

  // Tank enemies introduced in wave 3+
  if (safeWave >= 3) {
    const tankCount = Math.max(1, Math.floor((safeWave - 2) * 1.2));
    for (let i = 0; i < tankCount; i++) {
      types.push('tank');
    }
  }

  return types;
}

/**
 * Spawns all enemies for a given wave.
 *
 * @param {number} waveNumber
 * @param {number} arenaWidth
 * @param {number} arenaHeight
 * @param {object} [player]
 * @returns {Enemy[]} Array of instantiated Enemy objects
 */
export function spawnWaveEnemies(waveNumber, arenaWidth, arenaHeight, player = null) {
  const composition = getWaveComposition(waveNumber);
  const px = player ? player.x : arenaWidth / 2;
  const py = player ? player.y : arenaHeight / 2;

  return composition.map((type) => {
    const pos = getSpawnPosition(arenaWidth, arenaHeight, px, py);
    return createEnemy(type, pos.x, pos.y);
  });
}

/**
 * EnemySpawner manager class to manage an active collection of enemies.
 */
export class EnemySpawner {
  /**
   * @param {number} arenaWidth
   * @param {number} arenaHeight
   */
  constructor(arenaWidth = 800, arenaHeight = 600) {
    this.arenaWidth = arenaWidth;
    this.arenaHeight = arenaHeight;
    this.enemies = [];
  }

  /**
   * Registers event listeners for contract events like `enemy:hit` and `game:restart`.
   * @param {object} eventBus
   */
  registerEventListeners(eventBus = null) {
    if (eventBus && typeof eventBus.on === 'function') {
      eventBus.on('enemy:hit', (payload) => {
        if (payload) this.onEnemyHit(payload.enemyId, payload.damage, eventBus);
      });
      eventBus.on('game:restart', () => {
        this.reset();
      });
    }

    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('enemy:hit', (e) => {
        const detail = e.detail || {};
        this.onEnemyHit(detail.enemyId, detail.damage, eventBus);
      });
      window.addEventListener('game:restart', () => {
        this.reset();
      });
    }
  }

  /**
   * Spawns a single enemy into the active pool.
   * @param {'basic'|'fast'|'tank'} type
   * @param {number} [x]
   * @param {number} [y]
   * @returns {Enemy}
   */
  spawn(type, x = null, y = null) {
    let spawnX = x;
    let spawnY = y;
    if (spawnX === null || spawnY === null) {
      const pos = getSpawnPosition(this.arenaWidth, this.arenaHeight);
      spawnX = pos.x;
      spawnY = pos.y;
    }

    const enemy = createEnemy(type, spawnX, spawnY);
    this.enemies.push(enemy);
    return enemy;
  }

  /**
   * Spawns an entire wave's enemy roster.
   * @param {number} waveNumber
   * @param {object} [player]
   * @returns {Enemy[]}
   */
  spawnWave(waveNumber, player = null) {
    const newEnemies = spawnWaveEnemies(waveNumber, this.arenaWidth, this.arenaHeight, player);
    this.enemies.push(...newEnemies);
    return newEnemies;
  }

  /**
   * Updates all active enemies: chases player, checks collision damage,
   * and prunes defeated enemies.
   *
   * @param {number} dt Delta time
   * @param {object} player PlayerState
   * @param {object} [eventBus]
   */
  update(dt, player, eventBus = null) {
    updateEnemies(this.enemies, player, eventBus, dt);
  }

  /**
   * Handles combat hits directed at enemies.
   * @param {string|number} enemyId
   * @param {number} damage
   * @param {object} [eventBus]
   */
  onEnemyHit(enemyId, damage, eventBus = null) {
    for (const enemy of this.enemies) {
      if (String(enemy.id) === String(enemyId)) {
        return enemy.takeDamage(damage, eventBus);
      }
    }
    return false;
  }

  /**
   * Renders all active enemies.
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} [assets]
   */
  render(ctx, assets = null) {
    renderEnemies(ctx, this.enemies, assets);
  }

  /**
   * Clears all enemies (e.g. for restart/reset).
   */
  reset() {
    this.enemies = [];
  }

  /**
   * Returns array of canonical EnemyState objects.
   * @returns {object[]}
   */
  getStates() {
    return this.enemies.map((e) => (typeof e.toState === 'function' ? e.toState() : e));
  }
}

/**
 * Functional update helper for an array of enemies.
 * @param {Enemy[]} enemies
 * @param {object} player PlayerState
 * @param {object} [eventBus]
 * @param {number} [dt=0]
 */
export function updateEnemies(enemies, player, eventBus = null, dt = 0) {
  if (!enemies || !player) return;

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    if (enemy.isDead) {
      enemies.splice(i, 1);
      continue;
    }

    if (typeof enemy.chase === 'function') {
      enemy.chase(player.x, player.y, dt);
    }
    if (typeof enemy.checkPlayerCollision === 'function') {
      enemy.checkPlayerCollision(player, eventBus, dt);
    }
  }
}

/**
 * Functional render helper for an array of enemies.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Enemy[]} enemies
 * @param {object} [assets]
 */
export function renderEnemies(ctx, enemies, assets = null) {
  if (!ctx || !enemies) return;
  for (const enemy of enemies) {
    if (typeof enemy.render === 'function') {
      enemy.render(ctx, assets);
    }
  }
}

/**
 * Factory helper for creating EnemySpawner instances.
 * @param {number} arenaWidth
 * @param {number} arenaHeight
 * @returns {EnemySpawner}
 */
export function createEnemySpawner(arenaWidth = 800, arenaHeight = 600) {
  return new EnemySpawner(arenaWidth, arenaHeight);
}
