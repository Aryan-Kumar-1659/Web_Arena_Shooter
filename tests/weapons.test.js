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
import { WeaponSystem } from '../src/weapons/weaponSystem.js';

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
      angle: 0,
      speed: 500,
      radius: 4,
      damage: 25
    });

    assert.ok(bullet.id, 'Bullet must have an id');
    assert.equal(bullet.x, 100);
    assert.equal(bullet.y, 200);
    assert.equal(bullet.vx, 500);
    assert.equal(Math.round(bullet.vy), 0);
    assert.equal(bullet.radius, 4);
    assert.equal(bullet.damage, 25);
    assert.equal(bullet.owner, 'player');
  });

  it('should update bullet position based on velocity and delta time', () => {
    const bullet = createBullet({
      x: 50,
      y: 50,
      angle: Math.PI / 2,
      speed: 200,
      radius: 4,
      damage: 20
    });

    const dt = 0.5;
    updateBullet(bullet, dt);

    assert.equal(Math.round(bullet.x), 50);
    assert.equal(Math.round(bullet.y), 150);
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

    const angles = bullets.map((b) => Math.atan2(b.vy, b.vx));
    const uniqueAngles = new Set(angles.map((a) => a.toFixed(3)));
    assert.equal(uniqueAngles.size, 5);
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
      createBullet({ x: 100, y: 100, angle: 0, speed: 100 }),
      createBullet({ x: 799, y: 100, angle: 0, speed: 100 }),
    ];

    const active = updateBullets(bullets, 0.5, bounds);
    assert.equal(active.length, 1);
    assert.equal(active[0].x, 150);
  });
});

describe('WeaponSystem State Machine & Cooldowns', () => {
  it('should initialize with default rifle WeaponState', () => {
    const ws = new WeaponSystem('rifle');
    const state = ws.getState();

    assert.equal(state.id, 'rifle');
    assert.equal(state.ammo, 30);
    assert.equal(state.magazineSize, 30);
    assert.equal(state.cooldownMs, 150);
    assert.equal(state.damage, 25);
  });

  it('should deduct ammo and enforce cooldown on shoot', () => {
    const ws = new WeaponSystem('rifle');
    const bullets = ws.shoot(100, 100, 0);

    assert.ok(bullets, 'Bullets should be spawned');
    assert.equal(bullets.length, 1);
    assert.equal(ws.getState().ammo, 29);

    // Immediate second shot should be blocked by cooldown
    const blockedBullets = ws.shoot(100, 100, 0);
    assert.equal(blockedBullets, null);
    assert.equal(ws.getState().ammo, 29);
  });

  it('should allow shooting again after cooldown expires via update', () => {
    const ws = new WeaponSystem('rifle');
    ws.shoot(100, 100, 0);

    // 150ms cooldown -> advance by 0.16 seconds (160ms)
    ws.update(0.16);

    assert.equal(ws.canShoot(), true);
    const bullets = ws.shoot(100, 100, 0);
    assert.ok(bullets);
    assert.equal(ws.getState().ammo, 28);
  });

  it('should switch weapons and reset states properly', () => {
    const ws = new WeaponSystem('rifle');
    ws.shoot(100, 100, 0); // ammo 29

    ws.switchWeapon('shotgun');
    const state = ws.getState();

    assert.equal(state.id, 'shotgun');
    assert.equal(state.ammo, 8);
    assert.equal(state.magazineSize, 8);
    assert.equal(state.cooldownMs, 800);
    assert.equal(state.damage, 15);

    // Shotgun fires 5 pellets
    const pellets = ws.shoot(100, 100, 0);
    assert.equal(pellets.length, 5);
    assert.equal(ws.getState().ammo, 7);
  });

  it('should reload when empty and block firing during reload', () => {
    const ws = new WeaponSystem('shotgun');
    // Force ammo to 1
    ws.state.ammo = 1;

    // Fire last round
    const bullets = ws.shoot(100, 100, 0);
    assert.ok(bullets);
    assert.equal(ws.getState().ammo, 0);
    assert.equal(ws.isReloading, true);

    // Cannot shoot during reload
    assert.equal(ws.shoot(100, 100, 0), null);

    // Advance halfway through 2000ms reload
    ws.update(1.0);
    assert.equal(ws.isReloading, true);
    assert.equal(ws.getState().ammo, 0);

    // Finish reload (1.1s more)
    ws.update(1.1);
    assert.equal(ws.isReloading, false);
    assert.equal(ws.getState().ammo, 8);
  });

  it('should restore ammo on addAmmo (pickup)', () => {
    const ws = new WeaponSystem('rifle');
    ws.state.ammo = 10;
    ws.addAmmo(15);
    assert.equal(ws.getState().ammo, 25);

    // Should not exceed magazine size
    ws.addAmmo(20);
    assert.equal(ws.getState().ammo, 30);
  });
});
