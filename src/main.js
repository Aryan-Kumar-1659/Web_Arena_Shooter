/**
 * @file main.js
 * @description Application entry point. Bootstraps and orchestrates the complete Web Arena Shooter:
 * - Member 1 (Lead / Core Engine / Player): GameLoop, GameState, InputManager, Player, PlayerController
 * - Member 2 (Weapons / Combat): WeaponSystem, BulletManager, Combat collision
 * - Member 3 (Enemies / Gameplay): EnemySpawner, WaveManager, PickupManager, ScoreManager
 * - Member 4 (UI / Audio / Assets / QA): AssetLoader, AudioManager, HUD, Menu, GameOverScreen
 */

import { GameLoop } from './core/gameLoop.js';
import { GameStateManager, GAME_STATUS, EVENTS, eventBus } from './core/gameState.js';
import { InputManager } from './core/input.js';
import { AssetLoader } from './core/assetLoader.js';
import { Player } from './player/player.js';
import { PlayerController } from './player/playerController.js';
import { WeaponSystem } from './weapons/weaponSystem.js';
import { updateBullets, renderBullet } from './weapons/bullet.js';
import { processBulletCollisions, createHitEffect, updateHitEffects, renderHitEffects } from './weapons/combat.js';
import { EnemySpawner } from './enemies/enemySpawner.js';
import { WaveManager } from './gameplay/waves.js';
import { PickupManager, rollPickupDrop } from './gameplay/pickups.js';
import { ScoreManager } from './gameplay/score.js';
import { AudioManager } from './audio/audioManager.js';
import { HUD } from './ui/hud.js';
import { Menu } from './ui/menu.js';
import { GameOverScreen } from './ui/gameOver.js';

async function initGame() {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.error('Canvas element "#gameCanvas" not found.');
    return;
  }

  const arenaBounds = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height
  };

  // 1. Initialize Asset Loader & Preload all assets
  const assetLoader = new AssetLoader('assets/');
  await assetLoader.loadAll();

  // 2. Initialize Central GameState & Audio
  const stateManager = new GameStateManager({
    arenaWidth: arenaBounds.width,
    arenaHeight: arenaBounds.height
  }, eventBus);

  const audioManager = new AudioManager(assetLoader);

  // 3. Initialize Input System
  const input = new InputManager(canvas);

  // 4. Initialize Player & Controller
  const player = new Player({
    x: arenaBounds.width / 2,
    y: arenaBounds.height / 2
  });
  const playerController = new PlayerController(player, input, {
    bus: eventBus,
    bounds: arenaBounds
  });

  // 5. Initialize Weapon & Combat System (Member 2)
  const weaponSystem = new WeaponSystem('rifle');
  let bullets = [];
  let hitEffects = [];

  // Update initial weapon state in GameStateManager
  stateManager.getState().weapon = weaponSystem.getState();

  // 6. Initialize Enemy, Wave, Pickup, and Score Systems (Member 3)
  const enemySpawner = new EnemySpawner(arenaBounds.width, arenaBounds.height);
  enemySpawner.registerEventListeners(eventBus);

  const waveManager = new WaveManager({
    arenaWidth: arenaBounds.width,
    arenaHeight: arenaBounds.height
  });
  waveManager.registerEventListeners(eventBus);

  const pickupManager = new PickupManager();
  const scoreManager = new ScoreManager();
  scoreManager.registerEventListeners(eventBus, stateManager.getState());

  // 7. Initialize UI Screens (Member 4)
  const menu = new Menu(() => {
    stateManager.setStatus(GAME_STATUS.PLAYING);
    eventBus.emit(EVENTS.GAME_START);
  });

  const gameOverScreen = new GameOverScreen(() => {
    stateManager.reset();
    player.reset(arenaBounds.width / 2, arenaBounds.height / 2);
    enemySpawner.reset();
    waveManager.reset();
    pickupManager.reset();
    scoreManager.reset(stateManager.getState());
    bullets = [];
    hitEffects = [];
    weaponSystem.switchWeapon('rifle');
    stateManager.getState().weapon = weaponSystem.getState();
    stateManager.setStatus(GAME_STATUS.PLAYING);
    eventBus.emit(EVENTS.GAME_RESTART);
  });

  // 8. Wire Event Bus Handlers
  eventBus.on(EVENTS.GAME_START, () => {
    waveManager.startWave(1, eventBus, enemySpawner, player);
    audioManager.playMusic();
  });

  eventBus.on(EVENTS.GAME_RESTART, () => {
    waveManager.startWave(1, eventBus, enemySpawner, player);
    audioManager.playMusic();
  });

  eventBus.on(EVENTS.PLAYER_SHOOT, (payload) => {
    if (stateManager.getState().status !== GAME_STATUS.PLAYING) return;
    const spawned = weaponSystem.shoot(payload.x, payload.y, payload.angle);
    if (spawned && spawned.length > 0) {
      bullets.push(...spawned);
      audioManager.handleEvent('player:shoot', payload);
    }
  });

  eventBus.on(EVENTS.ENEMY_HIT, (payload) => {
    audioManager.handleEvent('enemy:hit', payload);
  });

  eventBus.on(EVENTS.ENEMY_DEFEATED, (payload) => {
    audioManager.handleEvent('enemy:defeated', payload);
    const defeatedEnemy = enemySpawner.enemies.find((e) => String(e.id) === String(payload.enemyId));
    if (defeatedEnemy) {
      const drop = rollPickupDrop(defeatedEnemy.x, defeatedEnemy.y);
      if (drop) {
        pickupManager.add(drop);
      }
    }
  });

  eventBus.on(EVENTS.PLAYER_DAMAGED, (payload) => {
    audioManager.handleEvent('player:damaged', payload);
    player.takeDamage(payload.damage);
  });

  eventBus.on(EVENTS.PICKUP_COLLECTED, (payload) => {
    audioManager.handleEvent('pickup:collected', payload);
    if (payload.type === 'ammo') {
      weaponSystem.addAmmo(payload.value);
      stateManager.getState().weapon = weaponSystem.getState();
    }
  });

  eventBus.on(EVENTS.WAVE_STARTED, (payload) => {
    audioManager.handleEvent('wave:started', payload);
  });

  eventBus.on(EVENTS.GAME_OVER, (payload) => {
    audioManager.handleEvent('game:over', payload);
  });

  // Start/Restart transition trigger
  const handleStartOrRestart = () => {
    const currentState = stateManager.getState();
    if (currentState.status === GAME_STATUS.MENU) {
      audioManager.play('button_click');
      menu.triggerStart();
    } else if (currentState.status === GAME_STATUS.GAME_OVER) {
      audioManager.play('button_click');
      gameOverScreen.triggerRestart();
    }
  };

  // Canvas Click Interactions (UI Buttons)
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || canvas.width);
    const scaleY = canvas.height / (rect.height || canvas.height);
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;
    const currentState = stateManager.getState();

    if (currentState.status === GAME_STATUS.MENU) {
      if (menu.handleClick(clickX, clickY)) {
        audioManager.play('button_click');
      } else {
        // Safe fallback: clicking canvas starts the game
        handleStartOrRestart();
      }
    } else if (currentState.status === GAME_STATUS.GAME_OVER) {
      if (gameOverScreen.handleClick(clickX, clickY)) {
        audioManager.play('button_click');
      } else {
        handleStartOrRestart();
      }
    }
  });

  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    const currentState = stateManager.getState();
    if (currentState.status === GAME_STATUS.MENU && (e.code === 'Space' || e.code === 'Enter' || e.key === ' ' || e.key === 'Enter')) {
      handleStartOrRestart();
      return;
    }
    if (currentState.status === GAME_STATUS.GAME_OVER && (e.code === 'Space' || e.code === 'Enter' || e.key === ' ' || e.key === 'Enter')) {
      handleStartOrRestart();
      return;
    }
    if (currentState.status !== GAME_STATUS.PLAYING) return;
    if (e.key === '1') {
      weaponSystem.switchWeapon('rifle');
      stateManager.getState().weapon = weaponSystem.getState();
    } else if (e.key === '2') {
      weaponSystem.switchWeapon('shotgun');
      stateManager.getState().weapon = weaponSystem.getState();
    } else if (e.key === 'r' || e.key === 'R') {
      weaponSystem.reload();
    }
  });

  // 9. Initialize and Register Subsystems with GameLoop
  const gameLoop = new GameLoop({
    canvas,
    stateManager,
    input,
    player,
    playerController,
    assetLoader
  });

  // Register Member 2: Weapons subsystem
  gameLoop.registerSubsystem('weapons', {
    update: (dt, state) => {
      weaponSystem.update(dt);
      state.weapon = weaponSystem.getState();

      bullets = updateBullets(bullets, dt, arenaBounds);
      hitEffects = updateHitEffects(hitEffects, dt);

      // Collision detection between active player bullets and alive enemies
      const { remainingBullets, hitEvents } = processBulletCollisions(
        bullets,
        enemySpawner.enemies,
        (hitPayload) => {
          eventBus.emit(EVENTS.ENEMY_HIT, hitPayload);
          enemySpawner.onEnemyHit(hitPayload.enemyId, hitPayload.damage, eventBus);
        }
      );

      bullets = remainingBullets;
      for (const hit of hitEvents) {
        hitEffects.push(createHitEffect(hit.x, hit.y));
      }

      state.bullets = bullets;
    },
    render: (ctx, _, assets) => {
      const bulletSprite = assets?.getImage?.('bullet.png') || null;
      for (const bullet of bullets) {
        renderBullet(bullet, ctx, bulletSprite);
      }
      const hitSprite = assets?.getImage?.('hit_effect.png') || null;
      renderHitEffects(hitEffects, ctx, hitSprite);
    }
  });

  // Register Member 3: Enemies subsystem
  gameLoop.registerSubsystem('enemies', {
    update: (dt, state) => {
      enemySpawner.update(dt, player.toState(), eventBus);
      state.enemies = enemySpawner.getStates();
    },
    render: (ctx, _, assets) => {
      enemySpawner.render(ctx, assets);
    }
  });

  // Register Member 3: Gameplay subsystem (Waves, Pickups, Score)
  gameLoop.registerSubsystem('gameplay', {
    update: (dt, state) => {
      waveManager.update(dt, state, eventBus, enemySpawner);
      pickupManager.update(dt, player, eventBus);
      scoreManager.update(dt, state);

      state.pickups = pickupManager.getStates();
      state.score = scoreManager.getScore();
      state.wave = waveManager.currentWave;
    },
    renderPickups: (ctx, _, assets) => {
      pickupManager.render(ctx, assets);
    }
  });

  // Register Member 4: UI subsystem (Menu, HUD, GameOver)
  gameLoop.registerSubsystem('ui', {
    update: () => {},
    render: (ctx, state, assets) => {
      if (state.status === GAME_STATUS.MENU) {
        menu.render(ctx, arenaBounds.width, arenaBounds.height);
      } else if (state.status === GAME_STATUS.PLAYING) {
        HUD.render(ctx, state, assets, input.mouse);
      } else if (state.status === GAME_STATUS.GAME_OVER) {
        gameOverScreen.render(ctx, state, arenaBounds.width, arenaBounds.height);
      }
    }
  });

  // Register Member 4: Audio subsystem
  gameLoop.registerSubsystem('audio', {
    update: () => {}
  });

  // 10. Start the game loop
  gameLoop.start();

  // Expose global debug handle in development
  window.__GAME__ = {
    gameLoop,
    stateManager,
    player,
    playerController,
    weaponSystem,
    enemySpawner,
    waveManager,
    pickupManager,
    scoreManager,
    audioManager,
    input,
    eventBus
  };

  console.log('Web Arena Shooter initialized and integrated successfully.');
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
  } else {
    initGame();
  }
}
