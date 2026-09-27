import { describe, it, expect, beforeEach } from 'vitest';
import { AssetLoader, CANONICAL_ASSET_MANIFEST } from '../src/core/assetLoader.js';

describe('AssetLoader (Member 4 QA)', () => {
  let loader;

  beforeEach(() => {
    loader = new AssetLoader();
  });

  it('should contain all canonical asset keys in manifest', () => {
    const requiredImages = [
      'player_idle', 'player_walk_1', 'player_walk_2', 'player_shoot',
      'enemy_basic_idle', 'enemy_basic_walk_1', 'enemy_basic_walk_2',
      'enemy_fast_idle', 'enemy_tank_idle',
      'rifle', 'shotgun', 'bullet',
      'health_pickup', 'ammo_pickup',
      'health_icon', 'ammo_icon', 'score_icon', 'crosshair'
    ];

    const requiredAudio = [
      'rifle_fire', 'shotgun_fire', 'enemy_hit', 'enemy_death',
      'player_hit', 'pickup_health', 'pickup_ammo',
      'wave_start', 'game_over', 'button_click', 'background_music'
    ];

    for (const key of requiredImages) {
      expect(CANONICAL_ASSET_MANIFEST.images[key]).toBeDefined();
    }

    for (const key of requiredAudio) {
      expect(CANONICAL_ASSET_MANIFEST.audio[key]).toBeDefined();
    }
  });

  it('should safely return fallback canvas texture for missing image assets', () => {
    const fallback = loader.getImage('non_existent_sprite');
    expect(fallback).toBeDefined();
    expect(fallback.width).toBe(32);
    expect(fallback.height).toBe(32);
  });

  it('should safely return mock audio object for missing audio assets', () => {
    const audio = loader.getAudio('non_existent_sound');
    expect(audio).toBeDefined();
    expect(typeof audio.play).toBe('function');
    expect(typeof audio.pause).toBe('function');
    expect(typeof audio.cloneNode).toBe('function');
  });

  it('should report progress correctly during loading cycle', async () => {
    const progressUpdates = [];
    loader.onProgress((progress, loaded, total) => {
      progressUpdates.push({ progress, loaded, total });
    });

    await loader.loadAll({
      images: { test1: 'fake1.png', test2: 'fake2.png' },
      audio: { sfx1: 'fake1.wav' }
    });

    expect(loader.loaded).toBe(true);
    expect(loader.getProgress()).toBe(1.0);
    expect(progressUpdates.length).toBeGreaterThan(0);
  });

  it('should cache fallback elements so identical keys return cached textures', () => {
    const f1 = loader.getFallbackImage('player_idle');
    const f2 = loader.getFallbackImage('player_idle');
    expect(f1).toBe(f2);
  });
});
