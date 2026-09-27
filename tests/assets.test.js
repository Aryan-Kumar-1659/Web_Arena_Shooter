import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AssetLoader, CANONICAL_ASSETS } from '../src/core/assetLoader.js';
import { AudioManager, SOUND_MAPPINGS } from '../src/audio/audioManager.js';

describe('Canonical Assets & Registry', () => {
  it('should register all canonical assets defined in CONTRACT.md', () => {
    // Total 39 assets
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
      assert.ok(CANONICAL_ASSETS[assetName], `Asset ${assetName} must be registered in CANONICAL_ASSETS`);
    }
  });

  it('should provide safe fallbacks for missing images without throwing', () => {
    const loader = new AssetLoader();
    const missingImg = loader.getImage('non_existent_sprite.png');

    assert.ok(missingImg, 'Should return a fallback object');
    assert.equal(missingImg.isFallback, true);
    assert.equal(missingImg.complete, false);
    assert.equal(missingImg.naturalWidth, 0);
  });

  it('should provide safe fallbacks for missing audio without throwing', () => {
    const loader = new AssetLoader();
    const missingAudio = loader.getAudio('non_existent_sound.wav');

    assert.ok(missingAudio, 'Should return a fallback audio object');
    assert.equal(missingAudio.isFallback, true);
    assert.equal(typeof missingAudio.play, 'function');
  });

  it('should complete loadAll gracefully in headless/test environments', async () => {
    const loader = new AssetLoader();
    const result = await loader.loadAll();

    assert.equal(typeof result.loaded, 'number');
    assert.equal(typeof result.failed, 'number');
    assert.ok(result.loaded >= 0);
  });
});

describe('AudioManager Behavior & Event Handling', () => {
  it('should map event sounds correctly', () => {
    assert.equal(SOUND_MAPPINGS.rifle_fire, 'rifle_fire.wav');
    assert.equal(SOUND_MAPPINGS.shotgun_fire, 'shotgun_fire.wav');
    assert.equal(SOUND_MAPPINGS.enemy_hit, 'enemy_hit.wav');
    assert.equal(SOUND_MAPPINGS.enemy_death, 'enemy_death.wav');
    assert.equal(SOUND_MAPPINGS.player_hit, 'player_hit.wav');
    assert.equal(SOUND_MAPPINGS.pickup_health, 'pickup_health.wav');
    assert.equal(SOUND_MAPPINGS.pickup_ammo, 'pickup_ammo.wav');
    assert.equal(SOUND_MAPPINGS.wave_start, 'wave_start.wav');
    assert.equal(SOUND_MAPPINGS.game_over, 'game_over.wav');
  });

  it('should handle muting and unmuting', () => {
    const loader = new AssetLoader();
    const audio = new AudioManager(loader);

    assert.equal(audio.isMuted, false);
    audio.toggleMute();
    assert.equal(audio.isMuted, true);
    audio.setMuted(false);
    assert.equal(audio.isMuted, false);
  });

  it('should handle contract events safely without crashing', () => {
    const loader = new AssetLoader();
    const audio = new AudioManager(loader);

    // Call all contract event handlers in headless mode
    assert.doesNotThrow(() => {
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
    });
  });
});
