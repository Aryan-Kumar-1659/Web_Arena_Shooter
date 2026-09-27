import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
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
    const circleB = { x: 110, y: 100, radius: 10 }; // distance = 10 < 20
    assert.equal(checkCircleCollision(circleA, circleB), true);
  });

  it('should detect no collision when two circles are apart', () => {
    const circleA = { x: 100, y: 100, radius: 10 };
    const circleB = { x: 200, y: 200, radius: 10 }; // distance ~ 141 > 20
    assert.equal(checkCircleCollision(circleA, circleB), false);
  });

  it('should detect collision when circles touch boundaries', () => {
    const circleA = { x: 100, y: 100, radius: 10 };
    const circleB = { x: 120, y: 100, radius: 10 }; // distance = 20 === 20
    assert.equal(checkCircleCollision(circleA, circleB), true);
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

    // Bullet should be consumed
    assert.equal(result.remainingBullets.length, 0);

    // Hit event should be emitted
    assert.equal(emittedEvents.length, 1);
    assert.deepEqual(emittedEvents[0], {
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

    assert.equal(result.remainingBullets.length, 1);
    assert.equal(result.remainingBullets[0].id, 'bullet_miss');
    assert.equal(emittedEvents.length, 0);
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

    assert.equal(result.remainingBullets.length, 1);
    assert.equal(emittedEvents.length, 0);
  });

  it('should correctly handle hit effect lifespans', () => {
    const effect = createHitEffect(100, 100, 0.2);
    assert.equal(effect.remainingTime, 0.2);

    // Update with 0.1s -> should still be active
    const active1 = updateHitEffects([effect], 0.1);
    assert.equal(active1.length, 1);

    // Update with another 0.15s -> total 0.25s -> should expire
    const active2 = updateHitEffects(active1, 0.15);
    assert.equal(active2.length, 0);
  });
});
