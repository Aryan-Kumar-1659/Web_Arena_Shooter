import { describe, it, expect } from 'vitest';
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
    expect(WEAPON_CONFIGS.rifle).toBeDefined();
    expect(WEAPON_CONFIGS.shotgun).toBeDefined();
  });

  it('should create a valid Rifle WeaponState conforming to CONTRACT.md', () => {
    const state = createWeaponState('rifle');
    expect(state.id).toBe('rifle');
    expect(typeof state.ammo).toBe('number');
    expect(typeof state.magazineSize).toBe('number');
    expect(typeof state.cooldownMs).toBe('number');
    expect(typeof state.damage).toBe('number');
    expect(state.ammo).toBe(30);
    expect(state.magazineSize).toBe(30);
  });

  it('should create a valid Shotgun WeaponState conforming to CONTRACT.md', () => {
    const state = createWeaponState('shotgun');
    expect(state.id).toBe('shotgun');
    expect(typeof state.ammo).toBe('number');
    expect(typeof state.magazineSize).toBe('number');
    expect(typeof state.cooldownMs).toBe('number');
    expect(typeof state.damage).toBe('number');
    expect(state.ammo).toBe(8);
    expect(state.magazineSize).toBe(8);
  });

  it('should throw an error when requesting an invalid weapon ID', () => {
    expect(() => {
      createWeaponState('laser_gun');
    }).toThrow(/Unknown weaponId/);
  });

  it('should return immutable copy from getWeaponConfig', () => {
    const config1 = getWeaponConfig('rifle');
    config1.damage = 999;
    const config2 = getWeaponConfig('rifle');
    expect(config2.damage).not.toBe(999);
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

    expect(bullet.id).toBeDefined();
    expect(bullet.x).toBe(100);
    expect(bullet.y).toBe(200);
    expect(bullet.vx).toBe(500);
    expect(Math.round(bullet.vy)).toBe(0);
    expect(bullet.radius).toBe(4);
    expect(bullet.damage).toBe(25);
    expect(bullet.owner).toBe('player');
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

    expect(Math.round(bullet.x)).toBe(50);
    expect(Math.round(bullet.y)).toBe(150);
  });

  it('should spawn 1 bullet for rifle with correct damage', () => {
    const config = getWeaponConfig('rifle');
    const bullets = spawnBullets(config, 100, 100, 0);

    expect(bullets.length).toBe(1);
    expect(bullets[0].damage).toBe(25);
    expect(bullets[0].owner).toBe('player');
  });

  it('should spawn 5 spread pellets for shotgun', () => {
    const config = getWeaponConfig('shotgun');
    const bullets = spawnBullets(config, 100, 100, 0);

    expect(bullets.length).toBe(5);
    bullets.forEach((b) => {
      expect(b.damage).toBe(15);
      expect(b.owner).toBe('player');
    });

    const angles = bullets.map((b) => Math.atan2(b.vy, b.vx));
    const uniqueAngles = new Set(angles.map((a) => a.toFixed(3)));
    expect(uniqueAngles.size).toBe(5);
  });

  it('should detect when a bullet is out of bounds', () => {
    const bounds = { width: 800, height: 600 };
    const inside = createBullet({ x: 400, y: 300, angle: 0, speed: 100 });
    const outsideX = createBullet({ x: 820, y: 300, angle: 0, speed: 100 });
    const outsideY = createBullet({ x: 400, y: -20, angle: 0, speed: 100 });

    expect(isBulletOutOfBounds(inside, bounds)).toBe(false);
    expect(isBulletOutOfBounds(outsideX, bounds)).toBe(true);
    expect(isBulletOutOfBounds(outsideY, bounds)).toBe(true);
  });

  it('should clean up out-of-bounds bullets in updateBullets', () => {
    const bounds = { width: 800, height: 600 };
    const bullets = [
      createBullet({ x: 100, y: 100, angle: 0, speed: 100 }),
      createBullet({ x: 799, y: 100, angle: 0, speed: 100 }),
    ];

    const active = updateBullets(bullets, 0.5, bounds);
    expect(active.length).toBe(1);
    expect(active[0].x).toBe(150);
  });
});

describe('WeaponSystem State Machine & Cooldowns', () => {
  it('should initialize with default rifle WeaponState', () => {
    const ws = new WeaponSystem('rifle');
    const state = ws.getState();

    expect(state.id).toBe('rifle');
    expect(state.ammo).toBe(30);
    expect(state.magazineSize).toBe(30);
    expect(state.cooldownMs).toBe(150);
    expect(state.damage).toBe(25);
  });

  it('should deduct ammo and enforce cooldown on shoot', () => {
    const ws = new WeaponSystem('rifle');
    const bullets = ws.shoot(100, 100, 0);

    expect(bullets).toBeDefined();
    expect(bullets.length).toBe(1);
    expect(ws.getState().ammo).toBe(29);

    const blockedBullets = ws.shoot(100, 100, 0);
    expect(blockedBullets).toBeNull();
    expect(ws.getState().ammo).toBe(29);
  });

  it('should allow shooting again after cooldown expires via update', () => {
    const ws = new WeaponSystem('rifle');
    ws.shoot(100, 100, 0);

    ws.update(0.16);

    expect(ws.canShoot()).toBe(true);
    const bullets = ws.shoot(100, 100, 0);
    expect(bullets).toBeDefined();
    expect(ws.getState().ammo).toBe(28);
  });

  it('should switch weapons and reset states properly', () => {
    const ws = new WeaponSystem('rifle');
    ws.shoot(100, 100, 0);

    ws.switchWeapon('shotgun');
    const state = ws.getState();

    expect(state.id).toBe('shotgun');
    expect(state.ammo).toBe(8);
    expect(state.magazineSize).toBe(8);
    expect(state.cooldownMs).toBe(800);
    expect(state.damage).toBe(15);

    const pellets = ws.shoot(100, 100, 0);
    expect(pellets.length).toBe(5);
    expect(ws.getState().ammo).toBe(7);
  });

  it('should reload when empty and block firing during reload', () => {
    const ws = new WeaponSystem('shotgun');
    ws.state.ammo = 1;

    const bullets = ws.shoot(100, 100, 0);
    expect(bullets).toBeDefined();
    expect(ws.getState().ammo).toBe(0);
    expect(ws.isReloading).toBe(true);

    expect(ws.shoot(100, 100, 0)).toBeNull();

    ws.update(1.0);
    expect(ws.isReloading).toBe(true);
    expect(ws.getState().ammo).toBe(0);

    ws.update(1.1);
    expect(ws.isReloading).toBe(false);
    expect(ws.getState().ammo).toBe(8);
  });

  it('should restore ammo on addAmmo (pickup)', () => {
    const ws = new WeaponSystem('rifle');
    ws.state.ammo = 10;
    ws.addAmmo(15);
    expect(ws.getState().ammo).toBe(25);

    ws.addAmmo(20);
    expect(ws.getState().ammo).toBe(30);
  });
});
