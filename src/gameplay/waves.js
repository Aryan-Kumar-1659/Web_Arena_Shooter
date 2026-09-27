/**
 * Web Arena Shooter - Wave Progression System
 * Member 3: Enemies + Gameplay
 *
 * Implements wave management, scaling difficulty, round intermission,
 * and wave event emissions conforming to:
 * - Event: wave:started
 * - Payload: { wave: number }
 */

import { spawnWaveEnemies } from '../enemies/enemySpawner.js';

export const WAVE_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  ACTIVE: 'ACTIVE',
  INTERMISSION: 'INTERMISSION',
};

export class WaveManager {
  /**
   * @param {object} [options]
   * @param {number} [options.intermissionDuration=3.0] Intermission time in seconds between waves
   * @param {number} [options.arenaWidth=800]
   * @param {number} [options.arenaHeight=600]
   */
  constructor(options = {}) {
    this.currentWave = 0;
    this.status = WAVE_STATUS.NOT_STARTED;
    this.intermissionDuration = options.intermissionDuration ?? 3.0;
    this.intermissionTimer = 0;
    this.arenaWidth = options.arenaWidth ?? 800;
    this.arenaHeight = options.arenaHeight ?? 600;
  }

  /**
   * Registers event listeners for game lifecycle events like `game:restart`.
   * @param {object} [eventBus]
   */
  registerEventListeners(eventBus = null) {
    if (eventBus && typeof eventBus.on === 'function') {
      eventBus.on('game:restart', () => {
        this.reset();
      });
    }

    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('game:restart', () => {
        this.reset();
      });
    }
  }

  /**
   * Starts a specific wave, spawning enemies and emitting `wave:started`.
   * @param {number} waveNumber Wave index to begin (defaults to next wave)
   * @param {object} [eventBus] Event bus instance
   * @param {object} [spawner] EnemySpawner instance
   * @param {object} [player] Player object for safe spawn distances
   * @returns {Enemy[]} Spawned enemies
   */
  startWave(waveNumber = null, eventBus = null, spawner = null, player = null) {
    this.currentWave = waveNumber !== null ? waveNumber : this.currentWave + 1;
    this.status = WAVE_STATUS.ACTIVE;
    this.intermissionTimer = 0;

    const payload = { wave: this.currentWave };

    // Emit canonical wave:started event
    if (eventBus && typeof eventBus.emit === 'function') {
      eventBus.emit('wave:started', payload);
    } else if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('wave:started', { detail: payload }));
    }

    if (spawner && typeof spawner.spawnWave === 'function') {
      return spawner.spawnWave(this.currentWave, player);
    }

    return spawnWaveEnemies(this.currentWave, this.arenaWidth, this.arenaHeight, player);
  }

  /**
   * Core update loop hook called by the engine loop.
   * Checks wave completion, ticks intermission timers, and advances waves.
   *
   * @param {number} dt Delta time in seconds
   * @param {object} gameState Shared GameState
   * @param {object} [eventBus]
   * @param {object} [spawner]
   */
  update(dt, gameState, eventBus = null, spawner = null) {
    if (!gameState || gameState.status === 'MENU' || gameState.status === 'GAME_OVER') {
      return;
    }

    // Keep gameState.wave synced
    gameState.wave = this.currentWave;

    if (this.status === WAVE_STATUS.ACTIVE) {
      // Check if all enemies in this wave have been cleared
      const enemyCount = spawner ? spawner.enemies.length : (gameState.enemies?.length ?? 0);

      if (enemyCount === 0) {
        this.status = WAVE_STATUS.INTERMISSION;
        this.intermissionTimer = this.intermissionDuration;
      }
    } else if (this.status === WAVE_STATUS.INTERMISSION) {
      this.intermissionTimer -= dt;

      if (this.intermissionTimer <= 0) {
        const nextWave = this.currentWave + 1;
        const newEnemies = this.startWave(nextWave, eventBus, spawner, gameState.player);

        if (gameState.enemies && !spawner) {
          gameState.enemies.push(...newEnemies.map((e) => (typeof e.toState === 'function' ? e.toState() : e)));
        }
      }
    }
  }

  /**
   * Resets wave manager to initial state (for game restarts).
   */
  reset() {
    this.currentWave = 0;
    this.status = WAVE_STATUS.NOT_STARTED;
    this.intermissionTimer = 0;
  }
}

/**
 * Factory helper for creating WaveManager instances.
 * @param {object} [options]
 * @returns {WaveManager}
 */
export function createWaveManager(options = {}) {
  return new WaveManager(options);
}
