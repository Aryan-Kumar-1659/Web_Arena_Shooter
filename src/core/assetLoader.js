/**
 * Web Arena Shooter - Asset Loader
 * Member 4: UI + Audio + Asset/QA Developer
 * 
 * Centralized loader for all 2D textures, sprites, UI icons, and audio assets.
 * Implements robust fallback mechanisms so the game never crashes due to missing assets.
 */

export const CANONICAL_ASSET_MANIFEST = {
  images: {
    // Player
    player_idle: 'assets/player_idle.png',
    player_walk_1: 'assets/player_walk_1.png',
    player_walk_2: 'assets/player_walk_2.png',
    player_shoot: 'assets/player_shoot.png',
    // Enemies
    enemy_basic_idle: 'assets/enemy_basic_idle.png',
    enemy_basic_walk_1: 'assets/enemy_basic_walk_1.png',
    enemy_basic_walk_2: 'assets/enemy_basic_walk_2.png',
    enemy_fast_idle: 'assets/enemy_fast_idle.png',
    enemy_fast_walk_1: 'assets/enemy_fast_walk_1.png',
    enemy_fast_walk_2: 'assets/enemy_fast_walk_2.png',
    enemy_tank_idle: 'assets/enemy_tank_idle.png',
    enemy_tank_walk_1: 'assets/enemy_tank_walk_1.png',
    enemy_tank_walk_2: 'assets/enemy_tank_walk_2.png',
    // Weapons & Combat
    rifle: 'assets/rifle.png',
    shotgun: 'assets/shotgun.png',
    bullet: 'assets/bullet.png',
    muzzle_flash: 'assets/muzzle_flash.png',
    hit_effect: 'assets/hit_effect.png',
    explosion: 'assets/explosion.png',
    // Pickups
    health_pickup: 'assets/health_pickup.png',
    ammo_pickup: 'assets/ammo_pickup.png',
    // Environment
    arena_floor: 'assets/arena_floor.png',
    wall: 'assets/wall.png',
    crate: 'assets/crate.png',
    // UI
    health_icon: 'assets/health_icon.png',
    ammo_icon: 'assets/ammo_icon.png',
    score_icon: 'assets/score_icon.png',
    crosshair: 'assets/crosshair.png'
  },
  audio: {
    rifle_fire: 'assets/rifle_fire.wav',
    shotgun_fire: 'assets/shotgun_fire.wav',
    enemy_hit: 'assets/enemy_hit.wav',
    enemy_death: 'assets/enemy_death.wav',
    player_hit: 'assets/player_hit.wav',
    pickup_health: 'assets/pickup_health.wav',
    pickup_ammo: 'assets/pickup_ammo.wav',
    wave_start: 'assets/wave_start.wav',
    game_over: 'assets/game_over.wav',
    button_click: 'assets/button_click.wav',
    background_music: 'assets/background_music.ogg'
  }
};

export class AssetLoader {
  constructor(basePath = '') {
    this.basePath = basePath;
    this.images = new Map();
    this.audio = new Map();
    this.fallbacks = new Map();
    this.loading = false;
    this.loaded = false;
    this.totalCount = 0;
    this.loadedCount = 0;
    this.failedCount = 0;
    this.onProgressCallbacks = [];
  }

  /**
   * Subscribe to load progress events (0 to 1)
   */
  onProgress(callback) {
    if (typeof callback === 'function') {
      this.onProgressCallbacks.push(callback);
    }
  }

  getProgress() {
    if (this.totalCount === 0) return 1.0;
    return Math.min(1.0, (this.loadedCount + this.failedCount) / this.totalCount);
  }

  _notifyProgress() {
    const progress = this.getProgress();
    for (const cb of this.onProgressCallbacks) {
      try {
        cb(progress, this.loadedCount, this.totalCount);
      } catch (e) {
        console.error('Error in onProgress callback:', e);
      }
    }
  }

  /**
   * Normalizes path with optional basePath
   */
  _resolvePath(path) {
    if (!this.basePath) return path;
    const cleanBase = this.basePath.endsWith('/') ? this.basePath.slice(0, -1) : this.basePath;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${cleanBase}/${cleanPath}`;
  }

  /**
   * Loads a single image by key and source path
   */
  async loadImage(key, src) {
    return new Promise((resolve) => {
      if (typeof Image === 'undefined') {
        const fallback = this.getFallbackImage(key);
        this.images.set(key, fallback);
        this.loadedCount++;
        this._notifyProgress();
        resolve(fallback);
        return;
      }

      let settled = false;
      const done = (img, isSuccess) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (isSuccess) {
          this.images.set(key, img);
          this.loadedCount++;
        } else {
          const fallback = this.getFallbackImage(key);
          this.images.set(key, fallback);
          this.failedCount++;
        }
        this._notifyProgress();
        resolve(this.images.get(key));
      };

      // Safety timeout: If browser/test DOM does not emit onload/onerror in 800ms, use fallback
      const timer = setTimeout(() => {
        done(null, false);
      }, 800);

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => done(img, true);
      img.onerror = () => done(null, false);

      img.src = this._resolvePath(src);
      if (img.complete && (img.naturalWidth > 0 || img.width > 0)) {
        done(img, true);
      }
    });
  }

  async loadAudio(key, src) {
    return new Promise((resolve) => {
      if (typeof Audio === 'undefined') {
        const mockAudio = {
          key,
          src,
          play: () => Promise.resolve(),
          pause: () => {},
          cloneNode: () => mockAudio,
          currentTime: 0,
          volume: 1,
          loop: false
        };
        this.audio.set(key, mockAudio);
        this.loadedCount++;
        this._notifyProgress();
        resolve(mockAudio);
        return;
      }

      let settled = false;
      const done = (sound, isSuccess) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (isSuccess) {
          this.audio.set(key, sound);
          this.loadedCount++;
        } else {
          const mockAudio = {
            key,
            src,
            play: () => Promise.resolve(),
            pause: () => {},
            cloneNode: function() { return this; },
            currentTime: 0,
            volume: 1,
            loop: false
          };
          this.audio.set(key, mockAudio);
          this.failedCount++;
        }
        this._notifyProgress();
        resolve(this.audio.get(key));
      };

      const timer = setTimeout(() => {
        done(null, false);
      }, 800);

      const sound = new Audio();
      sound.preload = 'auto';

      sound.addEventListener('canplaythrough', () => done(sound, true), { once: true });
      sound.addEventListener('error', () => done(null, false), { once: true });

      try {
        sound.src = this._resolvePath(src);
        sound.load?.();
      } catch (e) {
        done(null, false);
      }
    });
  }

  /**
   * Preloads all assets defined in the manifest
   */
  async loadAll(manifest = CANONICAL_ASSET_MANIFEST) {
    this.loading = true;
    this.loaded = false;
    this.loadedCount = 0;
    this.failedCount = 0;

    const imageEntries = Object.entries(manifest.images || {});
    const audioEntries = Object.entries(manifest.audio || {});
    this.totalCount = imageEntries.length + audioEntries.length;

    if (this.totalCount === 0) {
      this.loaded = true;
      this.loading = false;
      this._notifyProgress();
      return;
    }

    const imagePromises = imageEntries.map(([key, src]) => this.loadImage(key, src));
    const audioPromises = audioEntries.map(([key, src]) => this.loadAudio(key, src));

    await Promise.all([...imagePromises, ...audioPromises]);

    this.loading = false;
    this.loaded = true;
  }

  /**
   * Safe getter for Image assets.
   * Returns loaded HTMLImageElement or an auto-generated canvas fallback.
   */
  getImage(key) {
    if (this.images.has(key)) {
      return this.images.get(key);
    }
    return this.getFallbackImage(key);
  }

  /**
   * Safe getter for Audio assets.
   * Returns loaded HTMLAudioElement or a safe dummy mock.
   */
  getAudio(key) {
    if (this.audio.has(key)) {
      return this.audio.get(key);
    }
    return {
      key,
      play: () => Promise.resolve(),
      pause: () => {},
      cloneNode: function() { return this; },
      currentTime: 0,
      volume: 1,
      loop: false
    };
  }

  /**
   * Generates a distinct procedural canvas texture fallback based on asset key
   */
  getFallbackImage(key) {
    if (this.fallbacks.has(key)) {
      return this.fallbacks.get(key);
    }

    if (typeof document === 'undefined') {
      // Headless / non-browser fallback
      const mockCanvas = { width: 32, height: 32, isFallback: true, key };
      this.fallbacks.set(key, mockCanvas);
      return mockCanvas;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Color palette based on key category
      let color = '#3b82f6'; // default blue
      let border = '#1d4ed8';

      if (key.startsWith('player')) {
        color = '#10b981'; // Green
        border = '#047857';
      } else if (key.startsWith('enemy_tank')) {
        color = '#7c3aed'; // Purple
        border = '#5b21b6';
      } else if (key.startsWith('enemy_fast')) {
        color = '#f59e0b'; // Amber
        border = '#b45309';
      } else if (key.startsWith('enemy')) {
        color = '#ef4444'; // Red
        border = '#b91c1c';
      } else if (key.includes('health')) {
        color = '#ec4899'; // Pink/Red cross
        border = '#be185d';
      } else if (key.includes('ammo')) {
        color = '#eab308'; // Yellow
        border = '#a16207';
      } else if (key.includes('wall') || key.includes('crate')) {
        color = '#64748b'; // Slate
        border = '#334155';
      }

      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 32, 32);
      ctx.lineWidth = 2;
      ctx.strokeStyle = border;
      ctx.strokeRect(1, 1, 30, 30);

      // Label text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = key.substring(0, 4).toUpperCase();
      ctx.fillText(label, 16, 16);
    }

    this.fallbacks.set(key, canvas);
    return canvas;
  }
}

export const assetLoader = new AssetLoader();
