/**
 * Web Arena Shooter - Enemy Entity
 * Member 3: Enemies + Gameplay
 *
 * Implements Enemy class conforming strictly to EnemyState:
 * { id, type, x, y, radius, health, maxHealth, speed, damage }
 *
 * Handles:
 * - Direct vector chase behavior toward player
 * - Contact collision damage & player:damaged event
 * - Taking damage & enemy:defeated event
 * - Canvas 2D rendering with sprite animation & robust geometric primitive fallback
 */

import { getEnemyConfig } from './enemyData.js';

let enemyIdCounter = 1;

export class Enemy {
  /**
   * @param {'basic'|'fast'|'tank'} type
   * @param {number} x
   * @param {number} y
   * @param {string|number} [id]
   */
  constructor(type, x = 0, y = 0, id = null) {
    const config = getEnemyConfig(type);

    this.id = id !== null && id !== undefined ? String(id) : `enemy_${enemyIdCounter++}`;
    this.type = config.type;
    this.x = x;
    this.y = y;
    this.radius = config.radius;
    this.health = config.health;
    this.maxHealth = config.maxHealth;
    this.speed = config.speed;
    this.damage = config.damage;
    this.scoreValue = config.scoreValue;
    this.attackCooldown = config.attackCooldown;
    this.attackTimer = 0; // Ready to attack immediately or cooldown

    this.angle = 0;
    this.isDead = false;

    // Visuals & animation
    this.assets = config.assets;
    this.fallbackColor = config.fallbackColor;
    this.animTimer = 0;
    this.animFrame = 0;
  }

  /**
   * Updates enemy position toward target (Player) using normalized vector math.
   * @param {number} targetX
   * @param {number} targetY
   * @param {number} dt Delta time in seconds
   */
  chase(targetX, targetY, dt) {
    if (this.isDead || dt <= 0) return;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    this.angle = Math.atan2(dy, dx);

    if (dist > 0.001) {
      const step = this.speed * dt;
      // Prevent overshooting if very close
      if (step >= dist) {
        this.x = targetX;
        this.y = targetY;
      } else {
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
      }

      // Update walk animation cycle
      this.animTimer += dt;
      if (this.animTimer >= 0.2) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 2;
      }
    }

    if (this.attackTimer > 0) {
      this.attackTimer = Math.max(0, this.attackTimer - dt);
    }
  }

  /**
   * Applies damage to this enemy.
   * Emits `enemy:defeated` if health falls to or below 0.
   * @param {number} amount
   * @param {object} [eventBus] Event bus instance
   * @returns {boolean} True if enemy was defeated by this hit
   */
  takeDamage(amount, eventBus = null) {
    if (this.isDead) return false;

    this.health = Math.max(0, this.health - amount);

    if (this.health <= 0) {
      this.isDead = true;
      const defeatPayload = {
        enemyId: this.id,
        scoreValue: this.scoreValue,
      };

      if (eventBus && typeof eventBus.emit === 'function') {
        eventBus.emit('enemy:defeated', defeatPayload);
      } else if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('enemy:defeated', { detail: defeatPayload }));
      }
      return true;
    }

    return false;
  }

  /**
   * Checks contact collision with player.
   * If colliding and attack cooldown is ready, applies damage and emits `player:damaged`.
   * @param {object} player PlayerState { x, y, radius, health }
   * @param {object} [eventBus] Event bus instance
   * @param {number} dt Delta time in seconds
   * @returns {boolean} True if damage was applied this frame
   */
  checkPlayerCollision(player, eventBus = null, dt = 0) {
    if (this.isDead || !player || player.health <= 0) return false;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.hypot(dx, dy);
    const minDistance = this.radius + (player.radius || 16);

    if (distance <= minDistance) {
      if (this.attackTimer <= 0) {
        player.health = Math.max(0, (player.health || 0) - this.damage);
        this.attackTimer = this.attackCooldown;

        const damagePayload = {
          damage: this.damage,
          health: player.health,
        };

        if (eventBus && typeof eventBus.emit === 'function') {
          eventBus.emit('player:damaged', damagePayload);
        } else if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('player:damaged', { detail: damagePayload }));
        }
        return true;
      }
    }
    return false;
  }

  /**
   * Responds to `enemy:hit` events from Combat module.
   * @param {string|number} enemyId Target enemy ID
   * @param {number} damage Damage amount
   * @param {object} [eventBus]
   */
  handleHit(enemyId, damage, eventBus = null) {
    if (String(enemyId) === String(this.id)) {
      return this.takeDamage(damage, eventBus);
    }
    return false;
  }

  /**
   * Renders the enemy on HTML5 Canvas.
   * Uses canonical assets if loaded; otherwise renders safe geometric fallback.
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} [assets] Asset registry or map
   */
  render(ctx, assets = null) {
    if (!ctx || this.isDead) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Try finding loaded sprite asset
    let sprite = null;
    const activeKey = this.animFrame === 1 ? this.assets.walk2 : this.assets.walk1;

    if (assets) {
      if (typeof assets.getImage === 'function') {
        sprite = assets.getImage(activeKey) || assets.getImage(this.assets.idle);
      } else if (typeof assets.get === 'function') {
        sprite = assets.get(activeKey) || assets.get(this.assets.idle);
      } else if (assets[activeKey] || assets[this.assets.idle]) {
        sprite = assets[activeKey] || assets[this.assets.idle];
      }
    }

    if (sprite && sprite.complete && sprite.naturalWidth !== 0) {
      const size = this.radius * 5.2;
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    } else {
      // Safe Primitive Fallback
      const r = this.radius * 2.0;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = this.fallbackColor;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#2c3e50';
      ctx.stroke();

      // Direction indicator (eye / cannon)
      ctx.beginPath();
      ctx.arc(r * 0.55, 0, Math.max(5, r * 0.25), 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(r * 0.65, 0, Math.max(2.5, r * 0.12), 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
    }

    ctx.restore();

    // Mini Health Bar above enemy if wounded
    if (this.health < this.maxHealth) {
      const barWidth = this.radius * 4.0;
      const barHeight = 8;
      const barX = this.x - barWidth / 2;
      const barY = this.y - this.radius * 2.0 - 16;
      const healthPct = Math.max(0, this.health / this.maxHealth);

      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      ctx.fillStyle = healthPct > 0.5 ? '#2ecc71' : healthPct > 0.25 ? '#f39c12' : '#e74c3c';
      ctx.fillRect(barX, barY, barWidth * healthPct, barHeight);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
      ctx.restore();
    }
  }

  /**
   * Serializes current state strictly according to EnemyState contract.
   * @returns {object} EnemyState
   */
  toState() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      radius: this.radius,
      health: this.health,
      maxHealth: this.maxHealth,
      speed: this.speed,
      damage: this.damage,
    };
  }
}

/**
 * Factory helper for creating Enemy instances.
 * @param {'basic'|'fast'|'tank'} type
 * @param {number} x
 * @param {number} y
 * @param {string|number} [id]
 * @returns {Enemy}
 */
export function createEnemy(type, x, y, id = null) {
  return new Enemy(type, x, y, id);
}
