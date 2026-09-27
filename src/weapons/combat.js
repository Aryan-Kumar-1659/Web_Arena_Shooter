


/**
 * Fast 2D circular collision check using squared distance (avoids costly Math.sqrt).
 * 
 * @param {{ x: number, y: number, radius: number }} entityA
 * @param {{ x: number, y: number, radius: number }} entityB
 * @returns {boolean} True if entities overlap
 */
export function checkCircleCollision(entityA, entityB) {
  const dx = entityA.x - entityB.x;
  const dy = entityA.y - entityB.y;
  const radiusSum = entityA.radius + entityB.radius;
  return (dx * dx + dy * dy) <= (radiusSum * radiusSum);
}

/**
 * Evaluates collisions between active player bullets and active enemies.
 * Removes colliding bullets and triggers the contract event callback `enemy:hit`.
 * 
 * @param {Array<object>} bullets - Array of BulletState objects
 * @param {Array<object>} enemies - Array of EnemyState objects
 * @param {Function} [onEnemyHit] - Callback function for the "enemy:hit" event: ({ enemyId, damage }) => void
 * @returns {{ remainingBullets: Array<object>, hitEvents: Array<{ enemyId: string|number, damage: number, x: number, y: number }> }}
 */
export function processBulletCollisions(bullets, enemies, onEnemyHit = null) {
  const remainingBullets = [];
  const hitEvents = [];
  const consumedBulletIds = new Set();

  for (let b = 0; b < bullets.length; b++) {
    const bullet = bullets[b];
    let bulletHit = false;

    for (let e = 0; e < enemies.length; e++) {
      const enemy = enemies[e];

      // Check collision if enemy has health remaining
      if (enemy.health > 0 && checkCircleCollision(bullet, enemy)) {
        bulletHit = true;
        consumedBulletIds.add(bullet.id);

        const eventPayload = {
          enemyId: enemy.id,
          damage: bullet.damage
        };

        hitEvents.push({
          ...eventPayload,
          x: bullet.x,
          y: bullet.y
        });

        // Dispatch contract event
        if (typeof onEnemyHit === 'function') {
          onEnemyHit(eventPayload);
        }

        // Bullet is consumed after hitting an enemy
        break;
      }
    }

    if (!bulletHit) {
      remainingBullets.push(bullet);
    }
  }

  return {
    remainingBullets,
    hitEvents
  };
}

/**
 * Creates a visual hit effect descriptor for rendering hit feedback.
 * 
 * @param {number} x
 * @param {number} y
 * @param {number} [duration=0.15] - Duration in seconds
 * @returns {object} HitEffect
 */
export function createHitEffect(x, y, duration = 0.15) {
  return {
    x,
    y,
    duration,
    remainingTime: duration
  };
}

/**
 * Updates active visual hit effects.
 * 
 * @param {Array<object>} effects
 * @param {number} dt - Delta time in seconds
 * @returns {Array<object>} Active effects
 */
export function updateHitEffects(effects, dt) {
  const active = [];
  for (let i = 0; i < effects.length; i++) {
    const effect = effects[i];
    effect.remainingTime -= dt;
    if (effect.remainingTime > 0) {
      active.push(effect);
    }
  }
  return active;
}

/**
 * Renders hit effects using hit_effect.png or a fallback spark burst.
 * 
 * @param {Array<object>} effects
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} [hitSprite]
 */
export function renderHitEffects(effects, ctx, hitSprite = null) {
  if (!ctx || effects.length === 0) return;

  for (let i = 0; i < effects.length; i++) {
    const effect = effects[i];
    const alpha = Math.max(0, effect.remainingTime / effect.duration);

    ctx.save();
    ctx.globalAlpha = alpha;

    if (hitSprite && hitSprite.complete && hitSprite.naturalWidth !== 0) {
      const size = 32;
      ctx.drawImage(hitSprite, effect.x - size / 2, effect.y - size / 2, size, size);
    } else {
      // Fallback hit flash
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 8 * (1 - alpha + 0.5), 0, Math.PI * 2);
      ctx.fillStyle = '#ff5722';
      ctx.fill();
    }

    ctx.restore();
  }
}
