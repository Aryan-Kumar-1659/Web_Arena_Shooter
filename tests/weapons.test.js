import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WEAPON_CONFIGS, createWeaponState, getWeaponConfig } from '../src/weapons/weaponData.js';
import {
  createBullet,
  spawnBullets,
  updateBullet,
  isBulletOutOfBounds,
  updateBullets
} from '../src/weapons/bullet.js';

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

describe('Bullet Kinematics & Lifecycle', () => {
  it('should create a BulletState conforming strictly to CONTRACT.md', () => {
    const bullet = createBullet({
      x: 100,
      y: 200,
      angle: 0, // Moving right along +X
      speed: 500,
      radius: 4,
      damage: 25
    });

    assert.ok(bullet.id, 'Bullet must have an id');
    assert.equal(bullet.x, 100);
    assert.equal(bullet.y, 200);
    assert.equal(bullet.vx, 500); // cos(0) * 500
    assert.equal(Math.round(bullet.vy), 0); // sin(0) * 500
    assert.equal(bullet.radius, 4);
    assert.equal(bullet.damage, 25);
    assert.equal(bullet.owner, 'player');
  });

  it('should update bullet position based on velocity and delta time', () => {
    const bullet = createBullet({
      x: 50,
      y: 50,
      angle: Math.PI / 2, // Moving down along +Y
      speed: 200,
      radius: 4,
      damage: 20
    });

    const dt = 0.5; // 0.5 seconds
    updateBullet(bullet, dt);

    assert.equal(Math.round(bullet.x), 50);
    assert.equal(Math.round(bullet.y), 150); // 50 + 200 * 0.5
  });

  it('should spawn 1 bullet for rifle with correct damage', () => {
    const config = getWeaponConfig('rifle');
    const bullets = spawnBullets(config, 100, 100, 0);

    assert.equal(bullets.length, 1);
    assert.equal(bullets[0].damage, 25);
    assert.equal(bullets[0].owner, 'player');
  });

  it('should spawn 5 spread pellets for shotgun', () => {
    const config = getWeaponConfig('shotgun');
    const bullets = spawnBullets(config, 100, 100, 0);

    assert.equal(bullets.length, 5);
    bullets.forEach((b) => {
      assert.equal(b.damage, 15);
      assert.equal(b.owner, 'player');
    });

    // Check that pellets have distinct trajectory angles
    const angles = bullets.map((b) => Math.atan2(b.vy, b.vx));
    const uniqueAngles = new Set(angles.map((a) => a.toFixed(3)));
    assert.equal(uniqueAngles.size, 5, 'Shotgun pellets should have different angles in the spread cone');
  });

  it('should detect when a bullet is out of bounds', () => {
    const bounds = { width: 800, height: 600 };
    const inside = createBullet({ x: 400, y: 300, angle: 0, speed: 100 });
    const outsideX = createBullet({ x: 820, y: 300, angle: 0, speed: 100 });
    const outsideY = createBullet({ x: 400, y: -20, angle: 0, speed: 100 });

    assert.equal(isBulletOutOfBounds(inside, bounds), false);
    assert.equal(isBulletOutOfBounds(outsideX, bounds), true);
    assert.equal(isBulletOutOfBounds(outsideY, bounds), true);
  });

  it('should clean up out-of-bounds bullets in updateBullets', () => {
    const bounds = { width: 800, height: 600 };
    const bullets = [
      createBullet({ x: 100, y: 100, angle: 0, speed: 100 }), // stays inside
      createBullet({ x: 799, y: 100, angle: 0, speed: 100 }), // flies out after dt=0.5
    ];

    const active = updateBullets(bullets, 0.5, bounds);
    assert.equal(active.length, 1);
    assert.equal(active[0].x, 150);
  });
});
