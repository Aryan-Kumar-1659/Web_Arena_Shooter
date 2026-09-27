import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioManager } from '../src/audio/audioManager.js';
import { AssetLoader } from '../src/core/assetLoader.js';

describe('AudioManager (Member 4 QA)', () => {
  let audio;
  let loader;

  beforeEach(() => {
    loader = new AssetLoader();
    audio = new AudioManager(loader);
  });

  it('should initialize with default volume settings', () => {
    expect(audio.getMasterVolume()).toBe(1.0);
    expect(audio.getSfxVolume()).toBe(0.8);
    expect(audio.getMusicVolume()).toBe(0.5);
    expect(audio.isMuted()).toBe(false);
  });

  it('should clamp volume inputs within [0.0, 1.0]', () => {
    audio.setMasterVolume(1.5);
    expect(audio.getMasterVolume()).toBe(1.0);

    audio.setMasterVolume(-0.5);
    expect(audio.getMasterVolume()).toBe(0.0);

    audio.setSfxVolume(2.0);
    expect(audio.getSfxVolume()).toBe(1.0);

    audio.setMusicVolume(-1.0);
    expect(audio.getMusicVolume()).toBe(0.0);
  });

  it('should toggle mute state reliably', () => {
    expect(audio.isMuted()).toBe(false);
    audio.toggleMute();
    expect(audio.isMuted()).toBe(true);
    audio.toggleMute();
    expect(audio.isMuted()).toBe(false);
  });

  it('should not throw errors when playing missing or uninitialized SFX', () => {
    expect(() => {
      audio.playSfx('non_existent_sfx');
    }).not.toThrow();
  });

  it('should control background music playback without crashing', () => {
    expect(() => {
      audio.playMusic('background_music');
      audio.pauseMusic();
      audio.resumeMusic();
      audio.stopMusic();
    }).not.toThrow();
  });

  it('should respect mute state and not play sounds when muted', () => {
    audio.setMuted(true);
    const mockAudio = {
      play: vi.fn().mockResolvedValue(),
      cloneNode: function() { return this; }
    };
    loader.audio.set('test_sfx', mockAudio);

    audio.playSfx('test_sfx');
    expect(mockAudio.play).not.toHaveBeenCalled();
  });
});
