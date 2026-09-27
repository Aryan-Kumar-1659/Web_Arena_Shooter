let nextBulletId = 1;

/**
 * Generates a unique bullet identifier.
 * @returns {string}
 */
export function generateBulletId() {
  return `bullet_${Date.now()}_${nextBulletId++}`;
}

/**
 * Creates a single BulletState conforming strictly to CONTRACT.md.
 * 
 * @param {object} params
 * @param {string} [params.id]
 * @param {number} params.x
 * @param {number} params.y
 * @param {number} params.angle - Angle in radians
 * @param {number} params.speed - Velocity in pixels per second
 * @param {number} params.radius - Collision radius
 * @param {number} params.damage - Damage inflicted on impact
 * @param {'player'} [params.owner='player']
 * @returns {object} BulletState
 */
export function createBullet({
  id = generateBulletId(),
  x,
  y,
  angle,
  speed,
  radius = 4,
  damage = 25,
  owner = 'player'
}) {
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;

  return {
    id,
    x,
    y,
    vx,
    vy,
    radius,
    damage,
    owner
  };
}

/**
 * Spawns an array of BulletStates based on a weapon configuration.
 * Handles single-shot (Rifle) and multi-pellet spread (Shotgun).
 * 
 * @param {object} weaponConfig - Config from weaponData.js
 * @param {number} originX - Player / gun muzzle X coordinate
 * @param {number} originY - Player / gun muzzle Y coordinate
 * @param {number} baseAngle - Aim direction in radians
 * @returns {Array<object>} Array of BulletState objects
 */
export function spawnBullets(weaponConfig, originX, originY, baseAngle) {
  const bullets = [];
  const pellets = weaponConfig.pellets || 1;
  const spread = weaponConfig.spreadAngle || 0;

  if (pellets === 1) {
    // Single shot (e.g. Rifle) - apply small random spread if configured
    const angleOffset = (Math.random() - 0.5) * spread;
    bullets.push(
      createBullet({
        x: originX,
        y: originY,
        angle: baseAngle + angleOffset,
        speed: weaponConfig.bulletSpeed,
        radius: weaponConfig.bulletRadius,
        damage: weaponConfig.damage,
        owner: 'player'
      })
    );
  } else {
    // Multi-pellet spread (e.g. Shotgun) - fan out evenly across spread angle
    const step = pellets > 1 ? spread / (pellets - 1) : 0;
    const startAngle = baseAngle - spread / 2;

    for (let i = 0; i < pellets; i++) {
      const angle = startAngle + step * i;
      bullets.push(
        createBullet({
          x: originX,
          y: originY,
          angle,
          speed: weaponConfig.bulletSpeed,
          radius: weaponConfig.bulletRadius,
          damage: weaponConfig.damage,
          owner: 'player'
        })
      );
    }
  }

  return bullets;
}

/**
 * Updates a single bullet's position using delta time (dt in seconds).
 * 
 * @param {object} bullet - BulletState
 * @param {number} dt - Elapsed time in seconds
 */
export function updateBullet(bullet, dt) {
  bullet.x += bullet.vx * dt;
  bullet.y += bullet.vy * dt;
}

/**
 * Checks if a bullet is outside the arena boundaries.
 * 
 * @param {object} bullet - BulletState
 * @param {{ width: number, height: number, minX?: number, minY?: number }} bounds
 * @returns {boolean}
 */
export function isBulletOutOfBounds(bullet, bounds = { width: 1280, height: 720, minX: 0, minY: 0 }) {
  const minX = bounds.minX ?? 0;
  const minY = bounds.minY ?? 0;
  const maxX = bounds.width;
  const maxY = bounds.height;

  return (
    bullet.x < minX - bullet.radius ||
    bullet.x > maxX + bullet.radius ||
    bullet.y < minY - bullet.radius ||
    bullet.y > maxY + bullet.radius
  );
}

/**
 * Updates an array of bullets and filters out any out-of-bounds projectiles.
 * 
 * @param {Array<object>} bullets - Array of BulletStates
 * @param {number} dt - Elapsed time in seconds
 * @param {object} bounds - Arena boundary dimensions
 * @returns {Array<object>} Filtered active bullets
 */
export function updateBullets(bullets, dt, bounds) {
  const activeBullets = [];

  for (let i = 0; i < bullets.length; i++) {
    const bullet = bullets[i];
    updateBullet(bullet, dt);

    if (!isBulletOutOfBounds(bullet, bounds)) {
      activeBullets.push(bullet);
    }
  }

  return activeBullets;
}

/**
 * Renders a bullet on the canvas. Uses sprite if loaded; otherwise primitive fallback.
 * 
 * @param {object} bullet - BulletState
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} [bulletSprite] - Optional loaded bullet sprite
 */
export function renderBullet(bullet, ctx, bulletSprite = null) {
  if (!ctx) return;

  if (bulletSprite && bulletSprite.complete && bulletSprite.naturalWidth !== 0) {
    const angle = Math.atan2(bullet.vy, bullet.vx);
    const size = bullet.radius * 2.5;

    ctx.save();
    ctx.translate(bullet.x, bullet.y);
    ctx.rotate(angle);
    ctx.drawImage(bulletSprite, -size / 2, -size / 2, size, size);
    ctx.restore();
  } else {
    // Primitive fallback
    ctx.save();
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffeb3b';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#f57f17';
    ctx.stroke();
    ctx.restore();
  }
}
