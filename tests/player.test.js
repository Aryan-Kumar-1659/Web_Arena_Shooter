/**
 * @file player.test.js
 * @description Unit tests for Player entity, PlayerController, movement, aiming, and boundary collisions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Player } from '../src/player/player.js';
import { PlayerController } from '../src/player/playerController.js';
import { InputManager } from '../src/core/input.js';
import { EventBus, EVENTS } from '../src/core/gameState.js';

describe('Player Entity', () => {
  let player;

  beforeEach(() => {
    player = new Player({ x: 400, y: 300, health: 100, maxHealth: 100, speed: 240 });
  });

  it('should initialize with default CONTRACT.md properties', () => {
    expect(player.id).toBe('player_1');
    expect(player.x).toBe(400);
    expect(player.y).toBe(300);
    expect(player.radius).toBe(20);
    expect(player.health).toBe(100);
    expect(player.speed).toBe(240);
    expect(player.isAlive()).toBe(true);
  });

  it('should handle damage properly and not drop below zero', () => {
    player.takeDamage(30);
    expect(player.health).toBe(70);
    expect(player.isAlive()).toBe(true);

    player.takeDamage(100);
    expect(player.health).toBe(0);
    expect(player.isAlive()).toBe(false);
  });

  it('should heal player up to maxHealth', () => {
    player.takeDamage(50);
    player.heal(20);
    expect(player.health).toBe(70);

    player.heal(100);
    expect(player.health).toBe(100); // Clamped to maxHealth
  });

  it('should serialize to PlayerState and deserialize from PlayerState', () => {
    const state = player.toState();
    expect(state).toEqual({
      id: 'player_1',
      x: 400,
      y: 300,
      radius: 20,
      health: 100,
      maxHealth: 100,
      speed: 240,
      angle: 0
    });

    player.fromState({ x: 500, y: 250, health: 80, angle: Math.PI / 2 });
    expect(player.x).toBe(500);
    expect(player.y).toBe(250);
    expect(player.health).toBe(80);
    expect(player.angle).toBe(Math.PI / 2);
  });
});

describe('PlayerController', () => {
  let player;
  let input;
  let bus;
  let controller;
  const bounds = { x: 0, y: 0, width: 800, height: 600 };

  beforeEach(() => {
    player = new Player({ x: 400, y: 300, speed: 200 });
    input = new InputManager();
    bus = new EventBus();
    controller = new PlayerController(player, input, { bus, bounds });
  });

  it('should move player right when "d" is pressed', () => {
    input.keys.add('d');
    controller.update(0.1); // dt = 0.1s -> dx = 1 * 200 * 0.1 = 20px

    expect(player.x).toBe(420);
    expect(player.y).toBe(300);
    expect(player.isMoving).toBe(true);
  });

  it('should normalize diagonal movement so diagonal speed matches straight speed', () => {
    input.keys.add('w');
    input.keys.add('d');
    controller.update(0.1);

    const expectedDelta = (1 / Math.SQRT2) * 200 * 0.1;
    expect(player.x).toBeCloseTo(400 + expectedDelta, 3);
    expect(player.y).toBeCloseTo(300 - expectedDelta, 3);
  });

  it('should calculate aiming angle towards mouse position', () => {
    input.mouse.x = 500;
    input.mouse.y = 300;
    controller.update(0.016);

    expect(player.angle).toBeCloseTo(0, 4); // Aiming directly right

    input.mouse.x = 400;
    input.mouse.y = 400;
    controller.update(0.016);
    expect(player.angle).toBeCloseTo(Math.PI / 2, 4); // Aiming down
  });

  it('should clamp player within arena bounds', () => {
    player.x = 10;
    player.y = 10;
    input.keys.add('a');
    input.keys.add('w');

    controller.update(1.0); // Attempt to move far out of bounds

    expect(player.x).toBe(player.radius); // Clamped at minX = radius (20)
    expect(player.y).toBe(player.radius); // Clamped at minY = radius (20)
  });

  it('should dispatch player:shoot event when mouse is down', () => {
    const shootSpy = vi.fn();
    bus.on(EVENTS.PLAYER_SHOOT, shootSpy);

    input.mouse.x = 500;
    input.mouse.y = 300;
    input.mouse.isDown = true;

    controller.update(0.016, { id: 'shotgun' });

    expect(shootSpy).toHaveBeenCalledTimes(1);
    const payload = shootSpy.mock.calls[0][0];
    expect(payload.weaponId).toBe('shotgun');
    expect(payload.angle).toBeCloseTo(0, 4);
    expect(payload.x).toBeGreaterThan(player.x); // Muzzle offset
  });
});
