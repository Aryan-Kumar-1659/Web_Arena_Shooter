import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WEAPON_CONFIGS, createWeaponState, getWeaponConfig } from '../src/weapons/weaponData.js';

describe('Weapon Data & Specifications', () => {
  it('should define configs for both rifle and shotgun', () => {
    assert.ok(WEAPON_CONFIGS.rifle, 'Rifle config should exist');
    assert.ok(WEAPON_CONFIGS.shotgun, 'Shotgun config should exist');
  });

  it('should create a valid Rifle WeaponState conforming to CONTRACT.md', () => {
    const state = createWeaponState('rifle');
    assert.equal(state.id, 'rifle');
    assert.equal(typeof state.ammo, 'number');
    assert.equal(typeof state.magazineSize, 'number');
    assert.equal(typeof state.cooldownMs, 'number');
    assert.equal(typeof state.damage, 'number');
    assert.equal(state.ammo, 30);
    assert.equal(state.magazineSize, 30);
  });

  it('should create a valid Shotgun WeaponState conforming to CONTRACT.md', () => {
    const state = createWeaponState('shotgun');
    assert.equal(state.id, 'shotgun');
    assert.equal(typeof state.ammo, 'number');
    assert.equal(typeof state.magazineSize, 'number');
    assert.equal(typeof state.cooldownMs, 'number');
    assert.equal(typeof state.damage, 'number');
    assert.equal(state.ammo, 8);
    assert.equal(state.magazineSize, 8);
  });

  it('should throw an error when requesting an invalid weapon ID', () => {
    assert.throws(() => {
      createWeaponState('laser_gun');
    }, /Unknown weaponId/);
  });

  it('should return immutable copy from getWeaponConfig', () => {
    const config1 = getWeaponConfig('rifle');
    config1.damage = 999;
    const config2 = getWeaponConfig('rifle');
    assert.notEqual(config2.damage, 999, 'Original config should not be mutated');
  });
});
