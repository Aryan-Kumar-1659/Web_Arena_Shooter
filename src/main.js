/**
 * @file main.js
 * @description Application entry point. Bootstraps the Core Engine, Input, Player, and GameLoop.
 * Owned by Member 1 (Team Lead + Core Engine + Player).
 */

import { GameLoop } from './core/gameLoop.js';
import { GameStateManager, GAME_STATUS, EVENTS, eventBus } from './core/gameState.js';
import { InputManager } from './core/input.js';
import { Player } from './player/player.js';
import { PlayerController } from './player/playerController.js';

/**
 * Lightweight standalone asset helper for branch testing.
 * Full asset loader system is owned and implemented by Member 4 in src/core/assetLoader.js.
 */
function createAssetProvider() {
  const images = new Map();
  const preload = (names) => {
    return Promise.all(
      names.map((name) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = `assets/${name}`;
          img.onload = () => {
            images.set(name, img);
            resolve(img);
          };
          img.onerror = () => {
            // Safe fallback per CONTRACT.md
            resolve(null);
          };
        });
      })
    );
  };

  return {
    preload,
    getImage: (name) => images.get(name) || null
  };
}

async function initGame() {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.error('Canvas element "#gameCanvas" not found.');
    return;
  }

  // Preload initial player and arena assets for standalone verification
  const assetProvider = createAssetProvider();
  await assetProvider.preload([
    'player_idle.png',
    'player_walk_1.png',
    'player_walk_2.png',
    'player_shoot.png',
    'arena_floor.png'
  ]);

  const arenaBounds = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height
  };

  // 1. Initialize central GameState
  const stateManager = new GameStateManager({
    arenaWidth: arenaBounds.width,
    arenaHeight: arenaBounds.height
  }, eventBus);

  // 2. Initialize Input System
  const input = new InputManager(canvas);

  // 3. Initialize Player & Controller
  const player = new Player({
    x: arenaBounds.width / 2,
    y: arenaBounds.height / 2
  });
  const playerController = new PlayerController(player, input, {
    bus: eventBus,
    bounds: arenaBounds
  });

  // 4. Initialize Core GameLoop
  const gameLoop = new GameLoop({
    canvas,
    stateManager,
    input,
    player,
    playerController,
    assetLoader: assetProvider
  });

  // Simple canvas click handler for Start / Restart transitions
  canvas.addEventListener('click', () => {
    const currentState = stateManager.getState();
    if (currentState.status === GAME_STATUS.MENU) {
      stateManager.setStatus(GAME_STATUS.PLAYING);
      eventBus.emit(EVENTS.GAME_START);
    } else if (currentState.status === GAME_STATUS.GAME_OVER) {
      stateManager.reset();
      player.reset(arenaBounds.width / 2, arenaBounds.height / 2);
      stateManager.setStatus(GAME_STATUS.PLAYING);
      eventBus.emit(EVENTS.GAME_RESTART);
    }
  });

  // 5. Start the engine loop
  gameLoop.start();

  // Expose global debug handle in development
  window.__GAME__ = {
    gameLoop,
    stateManager,
    player,
    playerController,
    input,
    eventBus
  };

  console.log('Web Arena Shooter Core initialized successfully.');
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
  } else {
    initGame();
  }
}
