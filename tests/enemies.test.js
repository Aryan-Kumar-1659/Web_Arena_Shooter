/**
 * Unit tests for Member 3: Enemies System
 * Covers: enemyData.js, enemy.js, enemySpawner.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ENEMY_CONFIGS, getEnemyConfig } from '../src/enemies/enemyData.js';
import { Enemy, createEnemy } from '../src/enemies/enemy.js';
import {
  EnemySpawner,
  createEnemySpawner,
  getSpawnPosition,
  getWaveComposition,
  spawnWaveEnemies,
  updateEnemies,
  renderEnemies,
} from '../src/enemies/enemySpawner.js';

describe('Enemy Configurations (enemyData.js)', () => {
  it('defines all 3 required enemy types: basic, fast, and tank', () => {
    expect(ENEMY_CONFIGS).toHaveProperty('basic');
    expect(ENEMY_CONFIGS).toHaveProperty('fast');
    expect(ENEMY_CONFIGS).toHaveProperty('tank');
  });

  it('provides distinct stats appropriate for each enemy type', () => {
    const basic = getEnemyConfig('basic');
    const fast = getEnemyConfig('fast');
    const tank = getEnemyConfig('tank');

    // Fast enemy should be faster than basic and tank
    expect(fast.speed).toBeGreaterThan(basic.speed);
    expect(basic.speed).toBeGreaterThan(tank.speed);

    // Tank enemy should have more health than basic and fast
    expect(tank.health).toBeGreaterThan(basic.health);
    expect(basic.health).toBeGreaterThan(fast.health);

    // Tank enemy should do higher damage
    expect(tank.damage).toBeGreaterThan(basic.damage);
  });

  it('throws an error when requesting an invalid enemy type', () => {
    expect(() => getEnemyConfig('nonexistent')).toThrow();
  });
});

describe('Enemy Entity (enemy.js)', () => {
  let enemy;
  let mockEventBus;

  beforeEach(() => {
    mockEventBus = {
      emit: vi.fn(),
    };
    enemy = new Enemy('basic', 100, 100, 'test_enemy_1');
  });

  it('initializes with properties matching the EnemyState contract', () => {
    const state = enemy.toState();

    expect(state).toHaveProperty('id', 'test_enemy_1');
    expect(state).toHaveProperty('type', 'basic');
    expect(state).toHaveProperty('x', 100);
    expect(state).toHaveProperty('y', 100);
    expect(state).toHaveProperty('radius', 16);
    expect(state).toHaveProperty('health', 50);
    expect(state).toHaveProperty('maxHealth', 50);
    expect(state).toHaveProperty('speed', 120);
    expect(state).toHaveProperty('damage', 10);
  });

  it('chases target coordinates by moving closer along normalized vector', () => {
    const initialDist = Math.hypot(200 - enemy.x, 100 - enemy.y);
    enemy.chase(200, 100, 0.5); // dt = 0.5s, step = 120 * 0.5 = 60px
    const newDist = Math.hypot(200 - enemy.x, 100 - enemy.y);

    expect(newDist).toBeLessThan(initialDist);
    expect(enemy.x).toBeCloseTo(160, 1);
    expect(enemy.y).toBe(100);
  });

  it('reduces health when taking damage', () => {
    const defeated = enemy.takeDamage(20, mockEventBus);
    expect(defeated).toBe(false);
    expect(enemy.health).toBe(30);
    expect(mockEventBus.emit).not.toHaveBeenCalled();
  });

  it('emits enemy:defeated with { enemyId, scoreValue } when health reaches 0', () => {
    const defeated = enemy.takeDamage(50, mockEventBus);
    expect(defeated).toBe(true);
    expect(enemy.health).toBe(0);
    expect(enemy.isDead).toBe(true);

    expect(mockEventBus.emit).toHaveBeenCalledWith('enemy:defeated', {
      enemyId: 'test_enemy_1',
      scoreValue: 100,
    });
  });

  it('deals contact damage to player and emits player:damaged with { damage, health }', () => {
    const mockPlayer = { x: 105, y: 100, radius: 16, health: 100 };

    const damaged = enemy.checkPlayerCollision(mockPlayer, mockEventBus, 0);
    expect(damaged).toBe(true);
    expect(mockPlayer.health).toBe(90);

    expect(mockEventBus.emit).toHaveBeenCalledWith('player:damaged', {
      damage: 10,
      health: 90,
    });

    // Immediate second check should respect attack cooldown
    const damagedImmediately = enemy.checkPlayerCollision(mockPlayer, mockEventBus, 0);
    expect(damagedImmediately).toBe(false);
  });

  it('handles enemy:hit event correctly', () => {
    const hitSuccess = enemy.handleHit('test_enemy_1', 25, mockEventBus);
    expect(hitSuccess).toBe(false); // not defeated yet
    expect(enemy.health).toBe(25);

    const hitOther = enemy.handleHit('different_id', 25, mockEventBus);
    expect(hitOther).toBe(false);
    expect(enemy.health).toBe(25); // unchanged
  });

  it('renders safely with geometric primitive fallback', () => {
    const mockCtx = {
      save: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    };

    expect(() => enemy.render(mockCtx, null)).not.toThrow();
    expect(mockCtx.arc).toHaveBeenCalled();
  });
});

describe('Enemy Spawner (enemySpawner.js)', () => {
  it('generates spawn positions within arena boundaries', () => {
    const pos = getSpawnPosition(800, 600, 400, 300, 100);
    expect(pos.x).toBeGreaterThanOrEqual(0);
    expect(pos.x).toBeLessThanOrEqual(800);
    expect(pos.y).toBeGreaterThanOrEqual(0);
    expect(pos.y).toBeLessThanOrEqual(600);

    // Distance from player should be maintained
    const dist = Math.hypot(pos.x - 400, pos.y - 300);
    expect(dist).toBeGreaterThanOrEqual(100);
  });

  it('scales enemy wave compositions appropriately', () => {
    const wave1 = getWaveComposition(1);
    expect(wave1).toContain('basic');
    expect(wave1).not.toContain('tank');

    const wave2 = getWaveComposition(2);
    expect(wave2).toContain('basic');
    expect(wave2).toContain('fast');

    const wave3 = getWaveComposition(3);
    expect(wave3).toContain('basic');
    expect(wave3).toContain('fast');
    expect(wave3).toContain('tank');
  });

  it('spawns wave enemies and manages them in EnemySpawner pool', () => {
    const spawner = createEnemySpawner(800, 600);
    const enemies = spawner.spawnWave(1);

    expect(enemies.length).toBeGreaterThan(0);
    expect(spawner.enemies.length).toBe(enemies.length);

    const states = spawner.getStates();
    expect(states[0]).toHaveProperty('id');
    expect(states[0]).toHaveProperty('health');
  });

  it('registers event listeners and responds to enemy:hit event', () => {
    const spawner = new EnemySpawner(800, 600);
    const listeners = {};
    const mockBus = {
      on: (evt, cb) => {
        listeners[evt] = cb;
      },
      emit: vi.fn(),
    };

    spawner.registerEventListeners(mockBus);
    const enemy = spawner.spawn('basic', 200, 200);

    expect(listeners['enemy:hit']).toBeDefined();
    // Simulate Combat module emitting enemy:hit
    listeners['enemy:hit']({ enemyId: enemy.id, damage: 30 });
    expect(enemy.health).toBe(20);
  });

  it('supports functional updateEnemies and renderEnemies', () => {
    const enemies = [createEnemy('basic', 100, 100)];
    const mockPlayer = { x: 200, y: 100, radius: 16, health: 100 };
    updateEnemies(enemies, mockPlayer, null, 0.1);

    expect(enemies[0].x).toBeGreaterThan(100);

    const mockCtx = {
      save: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      restore: vi.fn(),
    };
    expect(() => renderEnemies(mockCtx, enemies)).not.toThrow();
  });
});
