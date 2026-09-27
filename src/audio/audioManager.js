/**
 * audioManager.js
 * Centralized Audio Manager for Web Arena Shooter.
 * Owned by Member 4 (UI + Audio + Assets + QA).
 * 
 * Strict Contract Compliance:
 * - Plays canonical sounds from CONTRACT.md.
 * - Handles autoplay restrictions and missing audio assets gracefully.
 * - Supports muting and volume control.
 */

export const SOUND_MAPPINGS = {
  rifle_fire: 'rifle_fire.wav',
  shotgun_fire: 'shotgun_fire.wav',
  enemy_hit: 'enemy_hit.wav',
  enemy_death: 'enemy_death.wav',
  player_hit: 'player_hit.wav',
  pickup_health: 'pickup_health.wav',
  pickup_ammo: 'pickup_ammo.wav',
  wave_start: 'wave_start.wav',
  game_over: 'game_over.wav',
  button_click: 'button_click.wav',
  music: 'background_music.ogg'
};

export class AudioManager {
  /**
   * @param {import('../core/assetLoader.js').AssetLoader} assetLoader 
   */
  constructor(assetLoader = null) {
    this.assetLoader = assetLoader;
    this.isMuted = false;
    this.volume = 0.7;
    this.musicElement = null;
  }

  /**
   * Toggles master audio mute.
   * @returns {boolean} New mute state
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.musicElement) {
      this.musicElement.muted = this.isMuted;
    }
    return this.isMuted;
  }

  /**
   * Sets master audio mute state.
   * @param {boolean} muted 
   */
  setMuted(muted) {
    this.isMuted = Boolean(muted);
    if (this.musicElement) {
      this.musicElement.muted = this.isMuted;
    }
  }

  /**
   * Plays a one-shot sound effect.
   * Safe to call even in headless/test environments or if asset failed to load.
   * 
   * @param {string} soundKey - Either canonical filename (e.g. 'rifle_fire.wav') or alias (e.g. 'rifle_fire')
   */
  play(soundKey) {
    if (this.isMuted) return;

    const filename = SOUND_MAPPINGS[soundKey] || soundKey;
    if (!this.assetLoader) return;

    const sound = this.assetLoader.getAudio(filename);
    if (!sound) return;

    try {
      if (typeof sound.cloneNode === 'function') {
        const instance = sound.cloneNode();
        instance.volume = this.volume;
        instance.play().catch(() => {
          // Autoplay blocked by browser policy - ignore safely
        });
      } else if (typeof sound.play === 'function') {
        sound.play().catch(() => {});
      }
    } catch {
      // Fallback safely if browser audio fails
    }
  }

  /**
   * Plays looping background music.
   */
  playMusic() {
    if (this.musicElement || !this.assetLoader) return;

    const music = this.assetLoader.getAudio('background_music.ogg');
    if (!music || music.isFallback) return;

    try {
      this.musicElement = music;
      this.musicElement.loop = true;
      this.musicElement.volume = this.volume * 0.5;
      this.musicElement.muted = this.isMuted;
      this.musicElement.play().catch(() => {});
    } catch {
      // Audio autoplay policy catch
    }
  }

  /**
   * Stops background music.
   */
  stopMusic() {
    if (this.musicElement) {
      try {
        this.musicElement.pause();
        this.musicElement.currentTime = 0;
      } catch {}
      this.musicElement = null;
    }
  }

  /**
   * Helper to bind audio playback directly to contract events.
   * @param {string} eventName
   * @param {object} payload
   */
  handleEvent(eventName, payload = {}) {
    switch (eventName) {
      case 'player:shoot':
        if (payload.weaponId === 'shotgun') {
          this.play('shotgun_fire');
        } else {
          this.play('rifle_fire');
        }
        break;
      case 'enemy:hit':
        this.play('enemy_hit');
        break;
      case 'enemy:defeated':
        this.play('enemy_death');
        break;
      case 'player:damaged':
        this.play('player_hit');
        break;
      case 'pickup:collected':
        if (payload.type === 'health') {
          this.play('pickup_health');
        } else {
          this.play('pickup_ammo');
        }
        break;
      case 'wave:started':
        this.play('wave_start');
        break;
      case 'game:over':
        this.play('game_over');
        this.stopMusic();
        break;
      case 'ui:click':
        this.play('button_click');
        break;
    }
  }
}
