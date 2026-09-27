/**
 * Unit tests for Member 3: Gameplay Systems
 * Covers: waves.js, pickups.js, score.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WaveManager, WAVE_STATUS, createWaveManager } from '../src/gameplay/waves.js';
import {
  Pickup,
  PickupManager,
  createPickup,
  createPickupManager,
  rollPickupDrop,
  updatePickups,
  renderPickups,
} from '../src/gameplay/pickups.js';
import { ScoreManager, createScoreManager } from '../src/gameplay/score.js';

describe('Wave Progression System (waves.js)', () => {
  let waveManager;
  let mockEventBus;

  beforeEach(() => {
    mockEventBus = { emit: vi.fn(), on: vi.fn() };
    waveManager = createWaveManager({ intermissionDuration: 2.0 });
  });

  it('starts a wave and emits canonical wave:started event with { wave }', () => {
    waveManager.startWave(1, mockEventBus);

    expect(waveManager.currentWave).toBe(1);
    expect(waveManager.status).toBe(WAVE_STATUS.ACTIVE);
    expect(mockEventBus.emit).toHaveBeenCalledWith('wave:started', { wave: 1 });
  });

  it('transitions to INTERMISSION when all enemies are defeated', () => {
    waveManager.startWave(1, mockEventBus);

    const gameState = {
      status: 'PLAYING',
      wave: 1,
      enemies: [], // No enemies left
    };

    waveManager.update(0.1, gameState, mockEventBus);

    expect(waveManager.status).toBe(WAVE_STATUS.INTERMISSION);
    expect(waveManager.intermissionTimer).toBe(2.0);
  });

  it('starts the next wave when intermission countdown completes', () => {
    waveManager.startWave(1, mockEventBus);
    const gameState = {
      status: 'PLAYING',
      wave: 1,
      enemies: [],
    };

    // First update: trigger intermission
    waveManager.update(0.1, gameState, mockEventBus);
    expect(waveManager.status).toBe(WAVE_STATUS.INTERMISSION);

    // Second update: finish intermission (elapsed > 2.0)
    waveManager.update(2.1, gameState, mockEventBus);

    expect(waveManager.currentWave).toBe(2);
    expect(waveManager.status).toBe(WAVE_STATUS.ACTIVE);
    expect(mockEventBus.emit).toHaveBeenCalledWith('wave:started', { wave: 2 });
  });

  it('resets wave status cleanly on game restart and registers event listeners', () => {
    const listeners = {};
    const bus = {
      on: (evt, cb) => {
        listeners[evt] = cb;
      },
      emit: vi.fn(),
    };

    waveManager.registerEventListeners(bus);
    waveManager.startWave(3, bus);
    expect(waveManager.currentWave).toBe(3);

    // Trigger game:restart
    expect(listeners['game:restart']).toBeDefined();
    listeners['game:restart']();

    expect(waveManager.currentWave).toBe(0);
    expect(waveManager.status).toBe(WAVE_STATUS.NOT_STARTED);
  });
});

describe('Pickups System (pickups.js)', () => {
  let mockEventBus;

  beforeEach(() => {
    mockEventBus = { emit: vi.fn() };
  });

  it('initializes pickup conforming strictly to PickupState schema', () => {
    const pickup = createPickup('health', 50, 75, 25, 'pickup_test_1');
    const state = pickup.toState();

    expect(state).toEqual({
      id: 'pickup_test_1',
      type: 'health',
      x: 50,
      y: 75,
      radius: 12,
      value: 25,
    });
  });

  it('collects pickup upon player overlap, restores player health, and emits pickup:collected', () => {
    const pickup = createPickup('health', 50, 50, 25, 'health_1');
    const mockPlayer = { x: 55, y: 50, radius: 16, health: 60, maxHealth: 100 };

    const collected = pickup.checkCollection(mockPlayer, mockEventBus);

    expect(collected).toBe(true);
    expect(pickup.isCollected).toBe(true);
    expect(mockPlayer.health).toBe(85); // 60 + 25
    expect(mockEventBus.emit).toHaveBeenCalledWith('pickup:collected', {
      pickupId: 'health_1',
      type: 'health',
      value: 25,
    });
  });

  it('manages pickups list in PickupManager and removes collected ones', () => {
    const manager = createPickupManager();
    const p1 = createPickup('ammo', 100, 100);
    manager.add(p1);

    expect(manager.pickups.length).toBe(1);

    const mockPlayer = { x: 102, y: 100, radius: 16 };
    manager.update(0.1, mockPlayer, mockEventBus);

    expect(manager.pickups.length).toBe(0); // Collected and removed
  });

  it('supports functional updatePickups and renderPickups', () => {
    const pickups = [createPickup('health', 100, 100)];
    const mockPlayer = { x: 105, y: 100, radius: 16, health: 50, maxHealth: 100 };

    updatePickups(pickups, mockPlayer, mockEventBus, 0.1);
    expect(pickups.length).toBe(0); // Collected

    const mockCtx = {
      save: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
    };
    expect(() => renderPickups(mockCtx, [createPickup('ammo', 200, 200)])).not.toThrow();
  });

  it('rolls pickup drop with given probability', () => {
    const guaranteedDrop = rollPickupDrop(100, 100, 1.0);
    expect(guaranteedDrop).not.toBeNull();
    expect(['health', 'ammo']).toContain(guaranteedDrop.type);

    const noDrop = rollPickupDrop(100, 100, 0.0);
    expect(noDrop).toBeNull();
  });
});

describe('Score Progression System (score.js)', () => {
  let scoreManager;
  let mockGameState;

  beforeEach(() => {
    scoreManager = createScoreManager({ comboWindow: 2.0, maxMultiplier: 3.0 });
    mockGameState = { score: 0 };
  });

  it('accumulates score directly from points', () => {
    scoreManager.addScore(100);
    expect(scoreManager.getScore()).toBe(100);
  });

  it('handles enemy:defeated event and syncs score with GameState', () => {
    scoreManager.handleEnemyDefeated({ enemyId: 'enemy_1', scoreValue: 100 }, mockGameState);

    expect(scoreManager.getScore()).toBe(100);
    expect(mockGameState.score).toBe(100);
  });

  it('registers event listeners and responds to enemy:defeated event automatically', () => {
    const listeners = {};
    const bus = {
      on: (evt, cb) => {
        listeners[evt] = cb;
      },
    };

    scoreManager.registerEventListeners(bus, mockGameState);
    expect(listeners['enemy:defeated']).toBeDefined();

    listeners['enemy:defeated']({ enemyId: 'enemy_1', scoreValue: 200 });
    expect(scoreManager.getScore()).toBe(200);
    expect(mockGameState.score).toBe(200);
  });

  it('increases multiplier on rapid successive defeats', () => {
    scoreManager.handleEnemyDefeated({ enemyId: 'enemy_1', scoreValue: 100 }, mockGameState);
    expect(scoreManager.getMultiplier()).toBe(1.0);

    // Second defeat within combo window (2.0s)
    scoreManager.handleEnemyDefeated({ enemyId: 'enemy_2', scoreValue: 100 }, mockGameState);
    expect(scoreManager.getMultiplier()).toBe(1.25);
    // Total: 100 + 125 = 225
    expect(scoreManager.getScore()).toBe(225);
  });

  it('resets multiplier back to 1.0 when combo timer expires', () => {
    scoreManager.handleEnemyDefeated({ enemyId: 'enemy_1', scoreValue: 100 }, mockGameState);
    scoreManager.handleEnemyDefeated({ enemyId: 'enemy_2', scoreValue: 100 }, mockGameState);
    expect(scoreManager.getMultiplier()).toBe(1.25);

    // Time elapsed exceeds combo window
    scoreManager.update(2.5, mockGameState);
    expect(scoreManager.getMultiplier()).toBe(1.0);
  });

  it('resets score cleanly on game restart', () => {
    scoreManager.addScore(500);
    scoreManager.reset(mockGameState);

    expect(scoreManager.getScore()).toBe(0);
    expect(mockGameState.score).toBe(0);
  });
});
