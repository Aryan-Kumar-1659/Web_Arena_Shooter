/**
 * @file core.test.js
 * @description Unit tests for GameStateManager, EventBus, and Collision detection functions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  EventBus,
  GameStateManager,
  GAME_STATUS,
  EVENTS,
  createPlayerState,
  createWeaponState,
  createEnemyState,
  createBulletState,
  createPickupState,
  createInitialState
} from '../src/core/gameState.js';
import {
  distanceSq,
  distance,
  checkCircleCollision,
  getCircleOverlap,
  checkCircleRectCollision,
  isPointInCircle,
  clampEntityToBounds
} from '../src/core/collision.js';

describe('EventBus', () => {
  let bus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it('should register listener and trigger on emit', () => {
    const handler = vi.fn();
    bus.on('test:event', handler);
    bus.emit('test:event', { foo: 'bar' });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ foo: 'bar' });
  });

  it('should allow unsubscribing via off and returned cleanup function', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const unsub1 = bus.on('test:event', handler1);
    bus.on('test:event', handler2);

    unsub1();
    bus.off('test:event', handler2);

    bus.emit('test:event', 123);
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
  });

  it('should clear specific event or all listeners', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    bus.on('event1', fn1);
    bus.on('event2', fn2);

    bus.clear('event1');
    bus.emit('event1');
    bus.emit('event2');

    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).toHaveBeenCalledTimes(1);

    bus.clear();
    bus.emit('event2');
    expect(fn2).toHaveBeenCalledTimes(1);
  });
});

describe('GameState Schema & Manager', () => {
  let bus;
  let manager;

  beforeEach(() => {
    bus = new EventBus();
    manager = new GameStateManager({ arenaWidth: 800, arenaHeight: 600 }, bus);
  });

  it('should create initial state with correct contract structure', () => {
    const state = manager.getState();
    expect(state.status).toBe(GAME_STATUS.MENU);
    expect(state.score).toBe(0);
    expect(state.wave).toBe(1);
    expect(state.player).toBeDefined();
    expect(state.player.health).toBe(100);
    expect(state.weapon.id).toBe('rifle');
    expect(Array.isArray(state.enemies)).toBe(true);
    expect(Array.isArray(state.bullets)).toBe(true);
    expect(Array.isArray(state.pickups)).toBe(true);
  });

  it('should update score on ENEMY_DEFEATED event', () => {
    bus.emit(EVENTS.ENEMY_DEFEATED, { enemyId: 'e1', scoreValue: 150 });
    expect(manager.getState().score).toBe(150);
  });

  it('should reduce player health and transition to GAME_OVER when health reaches 0', () => {
    manager.setStatus(GAME_STATUS.PLAYING);
    const gameOverSpy = vi.fn();
    bus.on(EVENTS.GAME_OVER, gameOverSpy);

    bus.emit(EVENTS.PLAYER_DAMAGED, { damage: 40 });
    expect(manager.getState().player.health).toBe(60);

    bus.emit(EVENTS.PLAYER_DAMAGED, { damage: 70 });
    expect(manager.getState().player.health).toBe(0);
    expect(manager.getState().status).toBe(GAME_STATUS.GAME_OVER);
    expect(gameOverSpy).toHaveBeenCalledWith({ score: 0, wave: 1 });
  });

  it('should process pickup collection', () => {
    manager.getState().player.health = 50;
    manager.getState().weapon.ammo = 5;

    bus.emit(EVENTS.PICKUP_COLLECTED, { pickupId: 'p1', type: 'health', value: 25 });
    expect(manager.getState().player.health).toBe(75);

    bus.emit(EVENTS.PICKUP_COLLECTED, { pickupId: 'p2', type: 'ammo', value: 15 });
    expect(manager.getState().weapon.ammo).toBe(20);
  });
});

describe('Collision Detection & Math', () => {
  it('should calculate Euclidean distance correctly', () => {
    expect(distanceSq(0, 0, 3, 4)).toBe(25);
    expect(distance(0, 0, 3, 4)).toBe(5);
  });

  it('should detect circle-circle collisions accurately', () => {
    const c1 = { x: 10, y: 10, radius: 10 };
    const c2 = { x: 25, y: 10, radius: 10 }; // distance = 15, sum of radii = 20 -> overlap
    const c3 = { x: 50, y: 10, radius: 10 }; // distance = 40, sum = 20 -> no overlap

    expect(checkCircleCollision(c1, c2)).toBe(true);
    expect(checkCircleCollision(c1, c3)).toBe(false);

    const overlap = getCircleOverlap(c1, c2);
    expect(overlap.collided).toBe(true);
    expect(overlap.overlap).toBe(5);
    expect(overlap.nx).toBe(1);
  });

  it('should detect circle-rectangle collisions', () => {
    const rect = { x: 100, y: 100, width: 50, height: 50 };
    const circleInside = { x: 120, y: 120, radius: 10 };
    const circleTouching = { x: 95, y: 100, radius: 10 };
    const circleFar = { x: 200, y: 200, radius: 10 };

    expect(checkCircleRectCollision(circleInside, rect)).toBe(true);
    expect(checkCircleRectCollision(circleTouching, rect)).toBe(true);
    expect(checkCircleRectCollision(circleFar, rect)).toBe(false);
  });

  it('should clamp entity strictly inside boundaries', () => {
    const bounds = { x: 0, y: 0, width: 800, height: 600 };
    const entity = { x: -50, y: 700, radius: 20 };

    clampEntityToBounds(entity, bounds);
    expect(entity.x).toBe(20);
    expect(entity.y).toBe(580);
  });
});
