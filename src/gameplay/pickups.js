/**
 * Web Arena Shooter - Pickups System
 * Member 3: Enemies + Gameplay
 *
 * Implements health and ammo pickups conforming strictly to PickupState:
 * { id, type: "health"|"ammo", x, y, radius, value }
 *
 * Emits canonical event:
 * - Event: pickup:collected
 * - Payload: { pickupId, type, value }
 */

let pickupIdCounter = 1;

export const PICKUP_CONFIGS = {
  health: {
    type: 'health',
    radius: 12,
    defaultValue: 25,
    assetKey: 'health_pickup.png',
    fallbackColor: '#2ecc71', // Green
  },
  ammo: {
    type: 'ammo',
    radius: 12,
    defaultValue: 30,
    assetKey: 'ammo_pickup.png',
    fallbackColor: '#3498db', // Blue
  },
};

export class Pickup {
  /**
   * @param {'health'|'ammo'} type
   * @param {number} x
   * @param {number} y
   * @param {number} [value]
   * @param {string|number} [id]
   * @param {number} [duration=15.0] Lifespan in seconds
   */
  constructor(type, x, y, value = null, id = null, duration = 15.0) {
    const config = PICKUP_CONFIGS[type] || PICKUP_CONFIGS.health;

    this.id = id !== null && id !== undefined ? String(id) : `pickup_${pickupIdCounter++}`;
    this.type = config.type;
    this.x = x;
    this.y = y;
    this.radius = config.radius;
    this.value = value !== null ? value : config.defaultValue;
    this.assetKey = config.assetKey;
    this.fallbackColor = config.fallbackColor;

    this.duration = duration;
    this.lifeTimer = 0;
    this.isExpired = false;
    this.isCollected = false;

    // Visual animation
    this.bobTimer = Math.random() * Math.PI * 2;
  }

  /**
   * Updates lifespan and visual bobbing animation.
   * @param {number} dt Delta time
   */
  update(dt) {
    if (this.isCollected || this.isExpired) return;

    this.lifeTimer += dt;
    this.bobTimer += dt * 3;

    if (this.lifeTimer >= this.duration) {
      this.isExpired = true;
    }
  }

  /**
   * Checks collision with player. If overlapping, collects the pickup,
   * emits `pickup:collected`, and updates player stats.
   *
   * @param {object} player PlayerState
   * @param {object} [eventBus]
   * @returns {boolean} True if collected
   */
  checkCollection(player, eventBus = null) {
    if (this.isCollected || this.isExpired || !player) return false;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    const minDistance = this.radius + (player.radius || 16);

    if (dist <= minDistance) {
      this.isCollected = true;

      // Apply benefit to player if present
      if (this.type === 'health' && typeof player.health === 'number') {
        const maxH = player.maxHealth || 100;
        player.health = Math.min(maxH, player.health + this.value);
      }

      const payload = {
        pickupId: this.id,
        type: this.type,
        value: this.value,
      };

      if (eventBus && typeof eventBus.emit === 'function') {
        eventBus.emit('pickup:collected', payload);
      } else if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('pickup:collected', { detail: payload }));
      }

      return true;
    }

    return false;
  }

  /**
   * Renders pickup on Canvas with sprite or safe primitive fallback.
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} [assets]
   */
  render(ctx, assets = null) {
    if (!ctx || this.isCollected || this.isExpired) return;

    // Blink when close to expiring (last 3 seconds)
    const timeLeft = this.duration - this.lifeTimer;
    if (timeLeft < 3.0 && Math.floor(timeLeft * 6) % 2 === 0) {
      return;
    }

    const bobOffset = Math.sin(this.bobTimer) * 3;
    const drawY = this.y + bobOffset;

    let sprite = null;
    if (assets) {
      if (typeof assets.getImage === 'function') {
        sprite = assets.getImage(this.assetKey);
      } else if (typeof assets.get === 'function') {
        sprite = assets.get(this.assetKey);
      } else if (assets[this.assetKey]) {
        sprite = assets[this.assetKey];
      }
    }

    ctx.save();
    if (sprite && sprite.complete && sprite.naturalWidth !== 0) {
      const size = this.radius * 3.5;
      ctx.drawImage(sprite, this.x - size / 2, drawY - size / 2, size, size);
    } else {
      // Safe Primitive Fallback
      const r = this.radius * 1.4;
      ctx.beginPath();
      ctx.arc(this.x, drawY, r, 0, Math.PI * 2);
      ctx.fillStyle = this.fallbackColor;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      if (this.type === 'health') {
        // White Plus Sign
        ctx.fillStyle = '#ffffff';
        const crossSize = r * 0.65;
        const thickness = Math.max(3, r * 0.25);
        ctx.fillRect(this.x - crossSize / 2, drawY - thickness / 2, crossSize, thickness);
        ctx.fillRect(this.x - thickness / 2, drawY - crossSize / 2, thickness, crossSize);
      } else {
        // Ammo Marker
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.floor(r * 1.1)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (typeof ctx.fillText === 'function') {
          ctx.fillText('A', this.x, drawY);
        }
      }
    }
    ctx.restore();
  }

  /**
   * Serializes to PickupState contract.
   * @returns {object} PickupState
   */
  toState() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      radius: this.radius,
      value: this.value,
    };
  }
}

/**
 * Creates a Pickup instance.
 * @param {'health'|'ammo'} type
 * @param {number} x
 * @param {number} y
 * @param {number} [value]
 * @param {string|number} [id]
 * @returns {Pickup}
 */
export function createPickup(type, x, y, value = null, id = null) {
  return new Pickup(type, x, y, value, id);
}

/**
 * Rolls whether a pickup should drop when an enemy is defeated.
 * @param {number} x Enemy X
 * @param {number} y Enemy Y
 * @param {number} [dropChance=0.3] Chance of drop (0 to 1)
 * @returns {Pickup|null}
 */
export function rollPickupDrop(x, y, dropChance = 0.3) {
  if (Math.random() > dropChance) return null;
  // 50% health, 50% ammo
  const type = Math.random() < 0.5 ? 'health' : 'ammo';
  return createPickup(type, x, y);
}

/**
 * Functional update helper for an array of pickups.
 * @param {Pickup[]} pickups
 * @param {object} player PlayerState
 * @param {object} [eventBus]
 * @param {number} [dt=0]
 */
export function updatePickups(pickups, player, eventBus = null, dt = 0) {
  if (!pickups) return;
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    if (typeof p.update === 'function') {
      p.update(dt);
    }
    if (p.isExpired) {
      pickups.splice(i, 1);
      continue;
    }
    if (player && typeof p.checkCollection === 'function' && p.checkCollection(player, eventBus)) {
      pickups.splice(i, 1);
    }
  }
}

/**
 * Functional render helper for an array of pickups.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Pickup[]} pickups
 * @param {object} [assets]
 */
export function renderPickups(ctx, pickups, assets = null) {
  if (!ctx || !pickups) return;
  for (const p of pickups) {
    if (typeof p.render === 'function') {
      p.render(ctx, assets);
    }
  }
}

/**
 * Manages active pickups on the field.
 */
export class PickupManager {
  constructor() {
    this.pickups = [];
  }

  /**
   * Adds a pickup to active list.
   * @param {Pickup} pickup
   */
  add(pickup) {
    if (pickup) {
      this.pickups.push(pickup);
    }
  }

  /**
   * Updates all pickups and handles player collection.
   * @param {number} dt Delta time
   * @param {object} player PlayerState
   * @param {object} [eventBus]
   */
  update(dt, player, eventBus = null) {
    updatePickups(this.pickups, player, eventBus, dt);
  }

  /**
   * Renders all active pickups.
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} [assets]
   */
  render(ctx, assets = null) {
    renderPickups(ctx, this.pickups, assets);
  }

  /**
   * Clears all pickups.
   */
  reset() {
    this.pickups = [];
  }

  /**
   * Returns array of canonical PickupState objects.
   * @returns {object[]}
   */
  getStates() {
    return this.pickups.map((p) => (typeof p.toState === 'function' ? p.toState() : p));
  }
}

/**
 * Factory helper for creating PickupManager instances.
 * @returns {PickupManager}
 */
export function createPickupManager() {
  return new PickupManager();
}
