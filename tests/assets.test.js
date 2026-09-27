import { describe, it, expect } from 'vitest';
import { AssetLoader, CANONICAL_ASSETS } from '../src/core/assetLoader.js';
import { AudioManager, SOUND_MAPPINGS } from '../src/audio/audioManager.js';

describe('Canonical Assets & Registry', () => {
  it('should register all canonical assets defined in CONTRACT.md', () => {
    const expectedAssets = [
      'player_idle.png', 'player_walk_1.png', 'player_walk_2.png', 'player_shoot.png',
      'enemy_basic_idle.png', 'enemy_basic_walk_1.png', 'enemy_basic_walk_2.png',
      'enemy_fast_idle.png', 'enemy_fast_walk_1.png', 'enemy_fast_walk_2.png',
      'enemy_tank_idle.png', 'enemy_tank_walk_1.png', 'enemy_tank_walk_2.png',
      'rifle.png', 'shotgun.png', 'bullet.png',
      'muzzle_flash.png', 'hit_effect.png', 'explosion.png',
      'health_pickup.png', 'ammo_pickup.png',
      'arena_floor.png', 'wall.png', 'crate.png',
      'health_icon.png', 'ammo_icon.png', 'score_icon.png', 'crosshair.png',
      'rifle_fire.wav', 'shotgun_fire.wav',
      'enemy_hit.wav', 'enemy_death.wav', 'player_hit.wav',
      'pickup_health.wav', 'pickup_ammo.wav',
      'wave_start.wav', 'game_over.wav', 'button_click.wav',
      'background_music.ogg'
    ];

    for (const assetName of expectedAssets) {
      expect(CANONICAL_ASSETS[assetName]).toBeDefined();
    }
  });

  it('should provide safe fallbacks for missing images without throwing', () => {
    const loader = new AssetLoader();
    const missingImg = loader.getImage('non_existent_sprite.png');

    expect(missingImg).toBeDefined();
    expect(missingImg.isFallback).toBe(true);
    expect(missingImg.complete).toBe(false);
    expect(missingImg.naturalWidth).toBe(0);
  });

  it('should provide safe fallbacks for missing audio without throwing', () => {
    const loader = new AssetLoader();
    const missingAudio = loader.getAudio('non_existent_sound.wav');

    expect(missingAudio).toBeDefined();
    expect(missingAudio.isFallback).toBe(true);
    expect(typeof missingAudio.play).toBe('function');
  });

  it('should complete loadAll gracefully in headless/test environments', async () => {
    const loader = new AssetLoader();
    const result = await loader.loadAll();

    expect(typeof result.loaded).toBe('number');
    expect(typeof result.failed).toBe('number');
    expect(result.loaded).toBeGreaterThanOrEqual(0);
  });
});

describe('AudioManager Behavior & Event Handling', () => {
  it('should map event sounds correctly', () => {
    expect(SOUND_MAPPINGS.rifle_fire).toBe('rifle_fire.wav');
    expect(SOUND_MAPPINGS.shotgun_fire).toBe('shotgun_fire.wav');
    expect(SOUND_MAPPINGS.enemy_hit).toBe('enemy_hit.wav');
    expect(SOUND_MAPPINGS.enemy_death).toBe('enemy_death.wav');
    expect(SOUND_MAPPINGS.player_hit).toBe('player_hit.wav');
    expect(SOUND_MAPPINGS.pickup_health).toBe('pickup_health.wav');
    expect(SOUND_MAPPINGS.pickup_ammo).toBe('pickup_ammo.wav');
    expect(SOUND_MAPPINGS.wave_start).toBe('wave_start.wav');
    expect(SOUND_MAPPINGS.game_over).toBe('game_over.wav');
  });

  it('should handle muting and unmuting', () => {
    const loader = new AssetLoader();
    const audio = new AudioManager(loader);

    expect(audio.isMuted).toBe(false);
    audio.toggleMute();
    expect(audio.isMuted).toBe(true);
    audio.setMuted(false);
    expect(audio.isMuted).toBe(false);
  });

  it('should handle contract events safely without crashing', () => {
    const loader = new AssetLoader();
    const audio = new AudioManager(loader);

    expect(() => {
      audio.handleEvent('player:shoot', { weaponId: 'rifle' });
      audio.handleEvent('player:shoot', { weaponId: 'shotgun' });
      audio.handleEvent('enemy:hit', { enemyId: 'enemy_1', damage: 25 });
      audio.handleEvent('enemy:defeated', { enemyId: 'enemy_1', scoreValue: 100 });
      audio.handleEvent('player:damaged', { damage: 10, health: 90 });
      audio.handleEvent('pickup:collected', { pickupId: 'p1', type: 'health', value: 25 });
      audio.handleEvent('pickup:collected', { pickupId: 'p2', type: 'ammo', value: 15 });
      audio.handleEvent('wave:started', { wave: 2 });
      audio.handleEvent('game:over', { score: 1000, wave: 5 });
      audio.handleEvent('ui:click');
    }).not.toThrow();
  });
});
