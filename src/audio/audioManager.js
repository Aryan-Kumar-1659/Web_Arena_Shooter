/**
 * Web Arena Shooter - Audio Manager
 * Member 4: UI + Audio + Asset/QA Developer
 * 
 * Manages all sound effects (SFX), background music (BGM), audio volume scaling,
 * mute toggles, pooling, and autoplay unlocking with Web Audio synthesis fallback.
 */

import { assetLoader } from '../core/assetLoader.js';

export class AudioManager {
  constructor(loader = assetLoader) {
    this.loader = loader;
    this.masterVolume = 1.0;
    this.sfxVolume = 0.8;
    this.musicVolume = 0.5;
    this.muted = false;

    this.currentMusic = null;
    this.currentMusicKey = null;

    this.audioContext = null;
    this.isUnlocked = false;

    // SFX pool to prevent audio element exhaustion
    this.sfxPool = new Map();
    this.maxPoolSize = 8;

    this._setupAutoplayUnlock();
  }

  /**
   * Initializes or unlocks Web Audio Context on first user interaction
   */
  _setupAutoplayUnlock() {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      this.unlock();
      window.removeEventListener('click', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);
      window.removeEventListener('touchstart', unlockHandler);
      window.removeEventListener('pointerdown', unlockHandler);
    };

    window.addEventListener('click', unlockHandler, { once: true });
    window.addEventListener('keydown', unlockHandler, { once: true });
    window.addEventListener('touchstart', unlockHandler, { once: true });
    window.addEventListener('pointerdown', unlockHandler, { once: true });
  }

  unlock() {
    if (this.isUnlocked) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx && !this.audioContext) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      this.isUnlocked = true;
    } catch (e) {
      console.warn('[AudioManager] Web Audio unlock error:', e);
    }
  }

  /**
   * Master volume control (0.0 to 1.0)
   */
  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, Number(val) || 0));
    this._updateMusicVolume();
  }

  getMasterVolume() {
    return this.masterVolume;
  }

  /**
   * SFX volume control (0.0 to 1.0)
   */
  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, Number(val) || 0));
  }

  getSfxVolume() {
    return this.sfxVolume;
  }

  /**
   * Music volume control (0.0 to 1.0)
   */
  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, Number(val) || 0));
    this._updateMusicVolume();
  }

  getMusicVolume() {
    return this.musicVolume;
  }

  /**
   * Mute toggle
   */
  toggleMute() {
    this.muted = !this.muted;
    this._updateMusicVolume();
    return this.muted;
  }

  setMuted(isMuted) {
    this.muted = Boolean(isMuted);
    this._updateMusicVolume();
  }

  isMuted() {
    return this.muted;
  }

  _updateMusicVolume() {
    if (this.currentMusic) {
      if (this.muted) {
        this.currentMusic.volume = 0;
      } else {
        this.currentMusic.volume = this.masterVolume * this.musicVolume;
      }
    }
  }

  /**
   * Plays a sound effect with pooling and volume calculations
   */
  playSfx(key, volumeScale = 1.0) {
    if (this.muted) return;

    const baseAudio = this.loader.getAudio(key);
    const finalVolume = Math.max(0, Math.min(1, this.masterVolume * this.sfxVolume * volumeScale));

    if (!baseAudio) {
      this._playSyntheticFallback(key);
      return;
    }

    try {
      // Find or allocate a sound clone from pool
      let pool = this.sfxPool.get(key);
      if (!pool) {
        pool = [];
        this.sfxPool.set(key, pool);
      }

      let sound = pool.find((s) => s.ended || s.paused);
      if (!sound) {
        if (pool.length < this.maxPoolSize && typeof baseAudio.cloneNode === 'function') {
          sound = baseAudio.cloneNode(true);
          pool.push(sound);
        } else if (pool.length > 0) {
          sound = pool[0];
          sound.currentTime = 0;
        } else {
          sound = baseAudio;
        }
      }

      sound.volume = finalVolume;
      sound.currentTime = 0;
      const playPromise = sound.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Autoplay was blocked or audio failed - try synthetic fallback
          this._playSyntheticFallback(key);
        });
      }
    } catch (e) {
      this._playSyntheticFallback(key);
    }
  }

  /**
   * Plays background music with looping
   */
  playMusic(key = 'background_music', volumeScale = 1.0, loop = true) {
    if (this.currentMusicKey === key && this.currentMusic && !this.currentMusic.paused) {
      return;
    }

    this.stopMusic();

    const musicAudio = this.loader.getAudio(key);
    if (!musicAudio) return;

    try {
      this.currentMusic = typeof musicAudio.cloneNode === 'function' ? musicAudio.cloneNode(true) : musicAudio;
      this.currentMusicKey = key;
      this.currentMusic.loop = loop;
      this._updateMusicVolume();
      this.currentMusic.currentTime = 0;

      const playPromise = this.currentMusic.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((err) => {
          console.warn('[AudioManager] Background music autoplay blocked until user gesture:', err);
        });
      }
    } catch (e) {
      console.warn('[AudioManager] Error starting music:', e);
    }
  }

  stopMusic() {
    if (this.currentMusic) {
      try {
        this.currentMusic.pause();
        this.currentMusic.currentTime = 0;
      } catch (e) {}
      this.currentMusic = null;
      this.currentMusicKey = null;
    }
  }

  pauseMusic() {
    if (this.currentMusic) {
      try {
        this.currentMusic.pause();
      } catch (e) {}
    }
  }

  resumeMusic() {
    if (this.currentMusic && !this.muted) {
      try {
        this._updateMusicVolume();
        this.currentMusic.play().catch(() => {});
      } catch (e) {}
    }
  }

  /**
   * Web Audio procedural oscillator fallback when wav files are missing or blocked
   */
  _playSyntheticFallback(key) {
    if (this.muted || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.audioContext && AudioCtx) {
        this.audioContext = new AudioCtx();
      }
      if (!this.audioContext) return;

      const ctx = this.audioContext;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      const vol = this.masterVolume * this.sfxVolume * 0.15;

      // Synthesize tone based on sound type
      if (key.includes('fire') || key.includes('shoot')) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (key.includes('hit') || key.includes('damage')) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (key.includes('pickup') || key.includes('health') || key.includes('ammo')) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      } else {
        // Generic click / notification
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch (e) {
      // Graceful ignore
    }
  }
}

export const audioManager = new AudioManager();
