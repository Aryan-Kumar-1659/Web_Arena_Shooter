/**
 * assetLoader.js
 * Centralized Asset Registry and Loader for Web Arena Shooter.
 * Owned by Member 4 (UI + Audio + Assets + QA).
 * 
 * Strict Contract Compliance:
 * - All assets loaded directly from /assets/ (no subfolders).
 * - Safe primitive fallbacks if assets are missing/fail to load.
 * - Headless/Node test compatible (never crashes if window/Image/Audio is undefined).
 */

export const CANONICAL_ASSETS = {
  // Player
  'player_idle.png': { type: 'image', required: true },
  'player_walk_1.png': { type: 'image', required: true },
  'player_walk_2.png': { type: 'image', required: true },
  'player_shoot.png': { type: 'image', required: false },

  // Enemies
  'enemy_basic_idle.png': { type: 'image', required: true },
  'enemy_basic_walk_1.png': { type: 'image', required: true },
  'enemy_basic_walk_2.png': { type: 'image', required: false },
  'enemy_fast_idle.png': { type: 'image', required: true },
  'enemy_fast_walk_1.png': { type: 'image', required: false },
  'enemy_fast_walk_2.png': { type: 'image', required: false },
  'enemy_tank_idle.png': { type: 'image', required: true },
  'enemy_tank_walk_1.png': { type: 'image', required: false },
  'enemy_tank_walk_2.png': { type: 'image', required: false },

  // Weapons & Projectiles
  'rifle.png': { type: 'image', required: true },
  'shotgun.png': { type: 'image', required: true },
  'bullet.png': { type: 'image', required: true },

  // Effects
  'muzzle_flash.png': { type: 'image', required: false },
  'hit_effect.png': { type: 'image', required: false },
  'explosion.png': { type: 'image', required: false },

  // Pickups
  'health_pickup.png': { type: 'image', required: true },
  'ammo_pickup.png': { type: 'image', required: true },

  // Environment
  'arena_floor.png': { type: 'image', required: false },
  'wall.png': { type: 'image', required: false },
  'crate.png': { type: 'image', required: false },

  // UI
  'health_icon.png': { type: 'image', required: true },
  'ammo_icon.png': { type: 'image', required: true },
  'score_icon.png': { type: 'image', required: true },
  'crosshair.png': { type: 'image', required: true },

  // Audio
  'rifle_fire.wav': { type: 'audio', required: true },
  'shotgun_fire.wav': { type: 'audio', required: true },
  'enemy_hit.wav': { type: 'audio', required: true },
  'enemy_death.wav': { type: 'audio', required: true },
  'player_hit.wav': { type: 'audio', required: true },
  'pickup_health.wav': { type: 'audio', required: true },
  'pickup_ammo.wav': { type: 'audio', required: true },
  'wave_start.wav': { type: 'audio', required: true },
  'game_over.wav': { type: 'audio', required: true },
  'button_click.wav': { type: 'audio', required: true },
  'background_music.ogg': { type: 'audio', required: false }
};

export class AssetLoader {
  constructor(basePath = 'assets/') {
    this.basePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
    this.cache = new Map();
    this.status = new Map(); // filename -> 'loading' | 'loaded' | 'failed'
  }

  /**
   * Generates a safe fallback object for an asset.
   * @param {string} filename 
   * @param {'image' | 'audio'} type 
   */
  createFallback(filename, type) {
    if (type === 'image') {
      return {
        isFallback: true,
        complete: false,
        naturalWidth: 0,
        naturalHeight: 0,
        filename
      };
    }
    return {
      isFallback: true,
      play: () => Promise.resolve(),
      pause: () => {},
      filename
    };
  }

  /**
   * Retrieves an image from the cache or returns a safe fallback.
   * Never throws.
   * @param {string} filename 
   * @returns {HTMLImageElement|object}
   */
  getImage(filename) {
    if (!this.cache.has(filename)) {
      return this.createFallback(filename, 'image');
    }
    return this.cache.get(filename);
  }

  /**
   * Retrieves an audio object from the cache or returns a safe fallback.
   * Never throws.
   * @param {string} filename 
   * @returns {HTMLAudioElement|object}
   */
  getAudio(filename) {
    if (!this.cache.has(filename)) {
      return this.createFallback(filename, 'audio');
    }
    return this.cache.get(filename);
  }

  /**
   * Checks if an asset is successfully loaded.
   * @param {string} filename 
   * @returns {boolean}
   */
  isLoaded(filename) {
    return this.status.get(filename) === 'loaded';
  }

  /**
   * Loads a single image asset.
   * @param {string} filename 
   * @returns {Promise<HTMLImageElement|object>}
   */
  loadImage(filename) {
    if (this.cache.has(filename)) {
      return Promise.resolve(this.cache.get(filename));
    }

    this.status.set(filename, 'loading');

    // In Node / non-browser test environment
    if (typeof Image === 'undefined') {
      const fallback = this.createFallback(filename, 'image');
      this.cache.set(filename, fallback);
      this.status.set(filename, 'loaded');
      return Promise.resolve(fallback);
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.src = `${this.basePath}${filename}`;
      img.onload = () => {
        this.cache.set(filename, img);
        this.status.set(filename, 'loaded');
        resolve(img);
      };
      img.onerror = () => {
        const fallback = this.createFallback(filename, 'image');
        this.cache.set(filename, fallback);
        this.status.set(filename, 'failed');
        resolve(fallback); // Resolve with fallback to prevent crashes
      };
    });
  }

  /**
   * Loads a single audio asset.
   * @param {string} filename 
   * @returns {Promise<HTMLAudioElement|object>}
   */
  loadAudio(filename) {
    if (this.cache.has(filename)) {
      return Promise.resolve(this.cache.get(filename));
    }

    this.status.set(filename, 'loading');

    // In Node / non-browser test environment
    if (typeof Audio === 'undefined') {
      const fallback = this.createFallback(filename, 'audio');
      this.cache.set(filename, fallback);
      this.status.set(filename, 'loaded');
      return Promise.resolve(fallback);
    }

    return new Promise((resolve) => {
      const audio = new Audio();
      audio.src = `${this.basePath}${filename}`;
      audio.oncanplaythrough = () => {
        this.cache.set(filename, audio);
        this.status.set(filename, 'loaded');
        resolve(audio);
      };
      audio.onerror = () => {
        const fallback = this.createFallback(filename, 'audio');
        this.cache.set(filename, fallback);
        this.status.set(filename, 'failed');
        resolve(fallback); // Resolve with fallback to prevent crashes
      };
    });
  }

  /**
   * Loads all canonical assets. Missing/failed assets will resolve with fallbacks.
   * @returns {Promise<{ loaded: number, failed: number }>}
   */
  async loadAll() {
    const promises = Object.entries(CANONICAL_ASSETS).map(async ([filename, meta]) => {
      if (meta.type === 'image') {
        return this.loadImage(filename);
      } else {
        return this.loadAudio(filename);
      }
    });

    await Promise.all(promises);

    let loadedCount = 0;
    let failedCount = 0;
    for (const status of this.status.values()) {
      if (status === 'loaded') loadedCount++;
      if (status === 'failed') failedCount++;
    }

    return { loaded: loadedCount, failed: failedCount };
  }
}
