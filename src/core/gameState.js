/**
 * @file gameState.js
 * @description Centralized GameState management, entity state schemas, and EventBus for Web Arena Shooter.
 * Owned by Member 1 (Team Lead + Core Engine + Player).
 */

export const GAME_STATUS = Object.freeze({
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER'
});

export const EVENTS = Object.freeze({
  GAME_START: 'game:start',
  GAME_RESTART: 'game:restart',
  PLAYER_SHOOT: 'player:shoot',
  ENEMY_HIT: 'enemy:hit',
  ENEMY_DEFEATED: 'enemy:defeated',
  PLAYER_DAMAGED: 'player:damaged',
  PICKUP_COLLECTED: 'pickup:collected',
  WAVE_STARTED: 'wave:started',
  GAME_OVER: 'game:over'
});

/**
 * Lightweight, decoupling EventBus for cross-module communication.
 */
export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe a listener to an event.
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError(`Event listener for "${event}" must be a function.`);
    }
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe a listener from an event.
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Dispatch an event to all registered listeners.
   * @param {string} event
   * @param {any} [payload]
   */
  emit(event, payload) {
    const set = this.listeners.get(event);
    if (set) {
      for (const callback of Array.from(set)) {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Error in event listener for "${event}":`, error);
        }
      }
    }
  }

  /**
   * Clear all listeners for an event or all events.
   * @param {string} [event]
   */
  clear(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// Global shared event bus instance
export const eventBus = new EventBus();

/**
 * Creates default PlayerState conforming to CONTRACT.md.
 * @param {Partial<import('./gameState').PlayerState>} [overrides]
 */
export function createPlayerState(overrides = {}) {
  return {
    id: overrides.id ?? 'player_1',
    x: overrides.x ?? 400,
    y: overrides.y ?? 300,
    radius: overrides.radius ?? 20,
    health: overrides.health ?? 100,
    maxHealth: overrides.maxHealth ?? 100,
    speed: overrides.speed ?? 240,
    angle: overrides.angle ?? 0
  };
}

/**
 * Creates default WeaponState conforming to CONTRACT.md.
 * @param {Partial<import('./gameState').WeaponState>} [overrides]
 */
export function createWeaponState(overrides = {}) {
  return {
    id: overrides.id ?? 'rifle',
    ammo: overrides.ammo ?? 30,
    magazineSize: overrides.magazineSize ?? 30,
    cooldownMs: overrides.cooldownMs ?? 150,
    damage: overrides.damage ?? 25
  };
}

/**
 * Creates default EnemyState conforming to CONTRACT.md.
 * @param {Partial<import('./gameState').EnemyState>} [overrides]
 */
export function createEnemyState(overrides = {}) {
  return {
    id: overrides.id ?? `enemy_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: overrides.type ?? 'basic',
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    radius: overrides.radius ?? 18,
    health: overrides.health ?? 50,
    maxHealth: overrides.maxHealth ?? 50,
    speed: overrides.speed ?? 120,
    damage: overrides.damage ?? 10
  };
}

/**
 * Creates default BulletState conforming to CONTRACT.md.
 * @param {Partial<import('./gameState').BulletState>} [overrides]
 */
export function createBulletState(overrides = {}) {
  return {
    id: overrides.id ?? `bullet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    vx: overrides.vx ?? 0,
    vy: overrides.vy ?? 0,
    radius: overrides.radius ?? 4,
    damage: overrides.damage ?? 25,
    owner: 'player'
  };
}

/**
 * Creates default PickupState conforming to CONTRACT.md.
 * @param {Partial<import('./gameState').PickupState>} [overrides]
 */
export function createPickupState(overrides = {}) {
  return {
    id: overrides.id ?? `pickup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: overrides.type ?? 'health',
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    radius: overrides.radius ?? 12,
    value: overrides.value ?? 25
  };
}

/**
 * Generates a fresh GameState instance conforming to CONTRACT.md.
 * @param {Object} [config]
 */
export function createInitialState(config = {}) {
  const arenaWidth = config.arenaWidth ?? 800;
  const arenaHeight = config.arenaHeight ?? 600;

  return {
    status: config.status ?? GAME_STATUS.MENU,
    score: 0,
    wave: 1,
    arena: {
      width: arenaWidth,
      height: arenaHeight
    },
    player: createPlayerState({
      x: arenaWidth / 2,
      y: arenaHeight / 2
    }),
    weapon: createWeaponState(),
    enemies: [],
    bullets: [],
    pickups: []
  };
}

/**
 * GameStateManager handles state mutations and event coordination.
 */
export class GameStateManager {
  constructor(initialConfig = {}, bus = eventBus) {
    this.bus = bus;
    this.initialConfig = initialConfig;
    this.state = createInitialState(initialConfig);
    this._setupCoreEventListeners();
  }

  /**
   * Get current state object.
   */
  getState() {
    return this.state;
  }

  /**
   * Set game status (MENU, PLAYING, PAUSED, GAME_OVER).
   * @param {keyof typeof GAME_STATUS} newStatus
   */
  setStatus(newStatus) {
    if (!Object.values(GAME_STATUS).includes(newStatus)) {
      console.warn(`Invalid game status: ${newStatus}`);
      return;
    }
    const previous = this.state.status;
    this.state.status = newStatus;
    if (newStatus === GAME_STATUS.GAME_OVER && previous !== GAME_STATUS.GAME_OVER) {
      this.bus.emit(EVENTS.GAME_OVER, {
        score: this.state.score,
        wave: this.state.wave
      });
    }
  }

  /**
   * Resets the game state to initial values.
   */
  reset() {
    const arenaWidth = this.state.arena?.width ?? 800;
    const arenaHeight = this.state.arena?.height ?? 600;
    this.state = createInitialState({
      ...this.initialConfig,
      status: GAME_STATUS.PLAYING,
      arenaWidth,
      arenaHeight
    });
  }

  /**
   * Wire standard core event reactions.
   * @private
   */
  _setupCoreEventListeners() {
    this.bus.on(EVENTS.GAME_START, () => {
      this.state.status = GAME_STATUS.PLAYING;
    });

    this.bus.on(EVENTS.GAME_RESTART, () => {
      this.reset();
    });

    this.bus.on(EVENTS.PLAYER_DAMAGED, (payload) => {
      if (!payload || typeof payload.damage !== 'number') return;
      this.state.player.health = Math.max(0, this.state.player.health - payload.damage);
      if (typeof payload.health === 'number') {
        this.state.player.health = Math.max(0, payload.health);
      }
      if (this.state.player.health <= 0 && this.state.status === GAME_STATUS.PLAYING) {
        this.setStatus(GAME_STATUS.GAME_OVER);
      }
    });

    this.bus.on(EVENTS.ENEMY_DEFEATED, (payload) => {
      if (payload && typeof payload.scoreValue === 'number') {
        this.state.score += payload.scoreValue;
      }
    });

    this.bus.on(EVENTS.WAVE_STARTED, (payload) => {
      if (payload && typeof payload.wave === 'number') {
        this.state.wave = payload.wave;
      }
    });

    this.bus.on(EVENTS.PICKUP_COLLECTED, (payload) => {
      if (!payload) return;
      if (payload.type === 'health') {
        this.state.player.health = Math.min(
          this.state.player.maxHealth,
          this.state.player.health + (payload.value ?? 25)
        );
      } else if (payload.type === 'ammo' && this.state.weapon) {
        this.state.weapon.ammo = Math.min(
          this.state.weapon.magazineSize,
          this.state.weapon.ammo + (payload.value ?? 30)
        );
      }
    });
  }
}
