/**
 * @file player.js
 * @description Player entity model, health management, animation state, and canvas rendering with primitive fallback.
 * Owned by Member 1 (Team Lead + Core Engine + Player).
 */

import { createPlayerState } from '../core/gameState.js';

export class Player {
  /**
   * @param {Partial<import('../core/gameState').PlayerState>} [config]
   */
  constructor(config = {}) {
    const defaults = createPlayerState(config);
    this.id = defaults.id;
    this.x = defaults.x;
    this.y = defaults.y;
    this.radius = defaults.radius;
    this.health = defaults.health;
    this.maxHealth = defaults.maxHealth;
    this.speed = defaults.speed;
    this.angle = defaults.angle;

    // Movement & animation state
    this.isMoving = false;
    this.animTimer = 0;
    this.walkFrame = 1; // 1 or 2
    this.walkAnimSpeed = 0.15; // Seconds per frame toggle

    // Visual feedback
    this.invulnerableTimer = 0;
    this.flashTimer = 0;
  }

  /**
   * Export as plain PlayerState object conforming to CONTRACT.md.
   */
  toState() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      radius: this.radius,
      health: this.health,
      maxHealth: this.maxHealth,
      speed: this.speed,
      angle: this.angle
    };
  }

  /**
   * Synchronize from a PlayerState object.
   * @param {Partial<import('../core/gameState').PlayerState>} state
   */
  fromState(state) {
    if (!state) return;
    if (state.id !== undefined) this.id = state.id;
    if (state.x !== undefined) this.x = state.x;
    if (state.y !== undefined) this.y = state.y;
    if (state.radius !== undefined) this.radius = state.radius;
    if (state.health !== undefined) this.health = state.health;
    if (state.maxHealth !== undefined) this.maxHealth = state.maxHealth;
    if (state.speed !== undefined) this.speed = state.speed;
    if (state.angle !== undefined) this.angle = state.angle;
  }

  /**
   * Apply damage to the player.
   * @param {number} amount
   * @returns {number} New health value
   */
  takeDamage(amount) {
    if (amount <= 0 || !this.isAlive()) return this.health;
    this.health = Math.max(0, this.health - amount);
    this.flashTimer = 0.15; // Brief hit flash
    return this.health;
  }

  /**
   * Heal player by a specified amount up to maxHealth.
   * @param {number} amount
   * @returns {number} New health value
   */
  heal(amount) {
    if (amount <= 0 || !this.isAlive()) return this.health;
    this.health = Math.min(this.maxHealth, this.health + amount);
    return this.health;
  }

  /**
   * Returns true if player health is greater than zero.
   * @returns {boolean}
   */
  isAlive() {
    return this.health > 0;
  }

  /**
   * Update internal visual and animation timers.
   * @param {number} dt Delta time in seconds
   */
  updateTimers(dt) {
    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - dt);
    }
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    }

    if (this.isMoving) {
      this.animTimer += dt;
      if (this.animTimer >= this.walkAnimSpeed) {
        this.animTimer = 0;
        this.walkFrame = this.walkFrame === 1 ? 2 : 1;
      }
    } else {
      this.animTimer = 0;
      this.walkFrame = 1;
    }
  }

  /**
   * Reset player to specified arena position and full health.
   * @param {number} x
   * @param {number} y
   */
  reset(x = 400, y = 300) {
    this.x = x;
    this.y = y;
    this.health = this.maxHealth;
    this.angle = 0;
    this.isMoving = false;
    this.animTimer = 0;
    this.flashTimer = 0;
    this.invulnerableTimer = 0;
  }

  /**
   * Render the player to the 2D canvas context.
   * Attempts to render loaded sprite assets; cleanly falls back to vector primitives.
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} [assetLoader]
   */
  render(ctx, assetLoader = null) {
    if (!ctx) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Hit flash tint effect
    if (this.flashTimer > 0) {
      ctx.globalAlpha = 0.7;
    }

    // Attempt sprite rendering via asset loader
    let spriteDrawn = false;
    if (assetLoader && typeof assetLoader.getImage === 'function') {
      const assetKey = this.isMoving
        ? (this.walkFrame === 1 ? 'player_walk_1.png' : 'player_walk_2.png')
        : 'player_idle.png';
      const sprite = assetLoader.getImage(assetKey);

      if (sprite && sprite.complete && sprite.naturalWidth > 0) {
        const size = this.radius * 3.8;
        ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
        spriteDrawn = true;
      }
    }

    // Safe primitive fallback rendering
    if (!spriteDrawn) {
      this._renderPrimitive(ctx);
    }

    ctx.restore();
  }

  /**
   * High-quality canvas primitive fallback for the player.
   * @private
   * @param {CanvasRenderingContext2D} ctx
   */
  _renderPrimitive(ctx) {
    const r = this.radius * 1.5;

    // Shadow
    ctx.beginPath();
    ctx.arc(3, 3, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();

    // Weapon / Barrel indicator
    ctx.fillStyle = '#475569';
    ctx.fillRect(r * 0.3, -6, r * 1.0, 12);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(r * 0.7, -4, r * 0.6, 8);

    // Player body
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = this.flashTimer > 0 ? '#ef4444' : '#3b82f6';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1d4ed8';
    ctx.stroke();

    // Hands/shoulders
    ctx.beginPath();
    ctx.arc(r * 0.5, -r * 0.5, 7, 0, Math.PI * 2);
    ctx.arc(r * 0.5, r * 0.5, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#2563eb';
    ctx.fill();
    ctx.strokeStyle = '#1e40af';
    ctx.stroke();

    // Visor / directional helm
    ctx.beginPath();
    ctx.arc(r * 0.3, 0, r * 0.45, -Math.PI / 3, Math.PI / 3);
    ctx.fillStyle = '#60a5fa';
    ctx.fill();
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
