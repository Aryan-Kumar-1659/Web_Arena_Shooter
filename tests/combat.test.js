import { describe, it, expect } from 'vitest';
import {
  checkCircleCollision,
  processBulletCollisions,
  createHitEffect,
  updateHitEffects
} from '../src/weapons/combat.js';
import { createBullet } from '../src/weapons/bullet.js';

describe('Combat Collision & Hit Detection', () => {
  it('should detect collision when two circles overlap', () => {
    const circleA = { x: 100, y: 100, radius: 10 };
    const circleB = { x: 110, y: 100, radius: 10 };
    expect(checkCircleCollision(circleA, circleB)).toBe(true);
  });

  it('should detect no collision when two circles are apart', () => {
    const circleA = { x: 100, y: 100, radius: 10 };
    const circleB = { x: 200, y: 200, radius: 10 };
    expect(checkCircleCollision(circleA, circleB)).toBe(false);
  });

  it('should detect collision when circles touch boundaries', () => {
    const circleA = { x: 100, y: 100, radius: 10 };
    const circleB = { x: 120, y: 100, radius: 10 };
    expect(checkCircleCollision(circleA, circleB)).toBe(true);
  });

  it('should process hit, remove bullet, and emit enemy:hit event payload conforming to CONTRACT.md', () => {
    const bullet = createBullet({
      id: 'bullet_1',
      x: 100,
      y: 100,
      angle: 0,
      speed: 100,
      radius: 4,
      damage: 25
    });

    const enemy = {
      id: 'enemy_basic_1',
      type: 'basic',
      x: 105,
      y: 100,
      radius: 16,
      health: 50,
      maxHealth: 50,
      speed: 100,
      damage: 10
    };

    const emittedEvents = [];
    const onEnemyHit = (payload) => {
      emittedEvents.push(payload);
    };

    const result = processBulletCollisions([bullet], [enemy], onEnemyHit);

    expect(result.remainingBullets.length).toBe(0);
    expect(emittedEvents.length).toBe(1);
    expect(emittedEvents[0]).toEqual({
      enemyId: 'enemy_basic_1',
      damage: 25
    });
  });

  it('should not consume bullets that do not hit any enemy', () => {
    const bullet = createBullet({
      id: 'bullet_miss',
      x: 500,
      y: 500,
      angle: 0,
      speed: 100,
      radius: 4,
      damage: 25
    });

    const enemy = {
      id: 'enemy_1',
      x: 100,
      y: 100,
      radius: 16,
      health: 50
    };

    const emittedEvents = [];
    const result = processBulletCollisions([bullet], [enemy], (p) => emittedEvents.push(p));

    expect(result.remainingBullets.length).toBe(1);
    expect(result.remainingBullets[0].id).toBe('bullet_miss');
    expect(emittedEvents.length).toBe(0);
  });

  it('should ignore enemies that already have health <= 0', () => {
    const bullet = createBullet({
      id: 'bullet_dead_target',
      x: 100,
      y: 100,
      angle: 0,
      speed: 100,
      radius: 4,
      damage: 25
    });

    const deadEnemy = {
      id: 'enemy_dead',
      x: 100,
      y: 100,
      radius: 16,
      health: 0
    };

    const emittedEvents = [];
    const result = processBulletCollisions([bullet], [deadEnemy], (p) => emittedEvents.push(p));

    expect(result.remainingBullets.length).toBe(1);
    expect(emittedEvents.length).toBe(0);
  });

  it('should correctly handle hit effect lifespans', () => {
    const effect = createHitEffect(100, 100, 0.2);
    expect(effect.remainingTime).toBe(0.2);

    const active1 = updateHitEffects([effect], 0.1);
    expect(active1.length).toBe(1);

    const active2 = updateHitEffects(active1, 0.15);
    expect(active2.length).toBe(0);
  });
});
