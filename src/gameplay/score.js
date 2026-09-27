/**
 * Web Arena Shooter - Score Progression System
 * Member 3: Enemies + Gameplay
 *
 * Tracks player score, reacts to `enemy:defeated` events,
 * and maintains combo multipliers.
 */

export class ScoreManager {
  /**
   * @param {object} [options]
   * @param {number} [options.comboWindow=2.5] Seconds allowed between defeats to maintain multiplier
   * @param {number} [options.maxMultiplier=3.0] Maximum combo multiplier
   */
  constructor(options = {}) {
    this.score = 0;
    this.multiplier = 1.0;
    this.comboWindow = options.comboWindow ?? 2.5;
    this.comboTimer = 0;
    this.maxMultiplier = options.maxMultiplier ?? 3.0;
    this.highScore = 0;
  }

  /**
   * Registers event listeners for contract events like `enemy:defeated` and `game:restart`.
   * @param {object} [eventBus]
   * @param {object} [gameState]
   */
  registerEventListeners(eventBus = null, gameState = null) {
    if (eventBus && typeof eventBus.on === 'function') {
      eventBus.on('enemy:defeated', (payload) => {
        this.handleEnemyDefeated(payload, gameState);
      });
      eventBus.on('game:restart', () => {
        this.reset(gameState);
      });
    }

    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('enemy:defeated', (e) => {
        this.handleEnemyDefeated(e.detail, gameState);
      });
      window.addEventListener('game:restart', () => {
        this.reset(gameState);
      });
    }
  }

  /**
   * Adds base points multiplied by the current combo multiplier.
   * @param {number} basePoints
   * @returns {number} Points actually awarded
   */
  addScore(basePoints) {
    if (basePoints <= 0) return 0;
    const awarded = Math.round(basePoints * this.multiplier);
    this.score += awarded;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
    return awarded;
  }

  /**
   * Responds to canonical `enemy:defeated` event.
   * @param {object} payload { enemyId, scoreValue }
   * @param {object} [gameState] Optional GameState reference to keep score synchronized
   * @returns {number} Points awarded
   */
  handleEnemyDefeated(payload, gameState = null) {
    if (!payload) return 0;
    const scoreVal = payload.scoreValue || 100;

    // Extend or increase combo
    if (this.comboTimer > 0) {
      this.multiplier = Math.min(this.maxMultiplier, +(this.multiplier + 0.25).toFixed(2));
    }
    this.comboTimer = this.comboWindow;

    const awarded = this.addScore(scoreVal);

    if (gameState && typeof gameState === 'object') {
      gameState.score = this.score;
    }

    return awarded;
  }

  /**
   * Core loop tick: updates combo timer and resets multiplier when expired.
   * @param {number} dt Delta time in seconds
   * @param {object} [gameState]
   */
  update(dt, gameState = null) {
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboTimer = 0;
        this.multiplier = 1.0;
      }
    }

    if (gameState && typeof gameState === 'object') {
      gameState.score = this.score;
    }
  }

  /**
   * Returns the current score.
   * @returns {number}
   */
  getScore() {
    return this.score;
  }

  /**
   * Returns current combo multiplier.
   * @returns {number}
   */
  getMultiplier() {
    return this.multiplier;
  }

  /**
   * Resets score and combo back to baseline (for game restarts).
   * @param {object} [gameState]
   */
  reset(gameState = null) {
    this.score = 0;
    this.multiplier = 1.0;
    this.comboTimer = 0;

    if (gameState && typeof gameState === 'object') {
      gameState.score = 0;
    }
  }
}

/**
 * Factory helper for creating ScoreManager instances.
 * @param {object} [options]
 * @returns {ScoreManager}
 */
export function createScoreManager(options = {}) {
  return new ScoreManager(options);
}
