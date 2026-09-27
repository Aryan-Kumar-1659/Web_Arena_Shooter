/**
 * @file gameLoop.js
 * @description Core orchestrator owning requestAnimationFrame, delta timing, and pipeline execution.
 * Owned by Member 1 (Team Lead + Core Engine + Player).
 */

import { GAME_STATUS } from './gameState.js';

export class GameLoop {
  /**
   * @param {Object} options
   * @param {HTMLCanvasElement} options.canvas
   * @param {import('./gameState').GameStateManager} options.stateManager
   * @param {import('./input').InputManager} options.input
   * @param {import('../player/player').Player} options.player
   * @param {import('../player/playerController').PlayerController} options.playerController
   * @param {Object} [options.assetLoader] Optional asset loader from Member 4
   */
  constructor(options) {
    this.canvas = options.canvas;
    this.ctx = options.canvas?.getContext('2d') ?? null;
    this.stateManager = options.stateManager;
    this.input = options.input;
    this.player = options.player;
    this.playerController = options.playerController;
    this.assetLoader = options.assetLoader ?? null;

    // Timing
    this.isRunning = false;
    this.lastTime = 0;
    this.maxDt = 0.1; // Clamp maximum delta time to 100ms to avoid spiral of death
    this.animationFrameId = null;

    // Registered subsystem hooks for Members 2, 3, 4
    this.subsystems = {
      weapons: null,  // Member 2
      enemies: null,  // Member 3
      gameplay: null, // Member 3
      ui: null,       // Member 4
      audio: null     // Member 4
    };

    this._loop = this._loop.bind(this);
  }

  /**
   * Register or inject subsystem modules developed by other team members.
   * @param {string} name 'weapons' | 'enemies' | 'gameplay' | 'ui' | 'audio'
   * @param {Object} system System instance exposing update(dt) and/or render(ctx)
   */
  registerSubsystem(name, system) {
    if (name in this.subsystems) {
      this.subsystems[name] = system;
    }
  }

  /**
   * Start the main game loop.
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this._loop);
  }

  /**
   * Stop/cancel the game loop.
   */
  stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Internal requestAnimationFrame tick.
   * @private
   * @param {DOMHighResTimeStamp} timestamp
   */
  _loop(timestamp) {
    if (!this.isRunning) return;

    // 1. Calculate delta time (dt in seconds)
    let dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    if (dt > this.maxDt) {
      dt = this.maxDt;
    }
    if (dt < 0 || Number.isNaN(dt)) {
      dt = 0;
    }

    // 2. Execute pipeline steps per CONTRACT.md Section 9
    this.update(dt);
    this.render();

    // 3. Clear transient input frames
    if (this.input && typeof this.input.endFrame === 'function') {
      this.input.endFrame();
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this._loop);
  }

  /**
   * Update all gameplay systems in specified contract order.
   * @param {number} dt Delta time in seconds
   */
  update(dt) {
    const state = this.stateManager.getState();

    // Only update active gameplay mechanics when status is PLAYING
    if (state.status === GAME_STATUS.PLAYING) {
      // Step 2: Player movement & boundaries
      if (this.playerController && this.player) {
        this.playerController.update(dt, state.weapon);
        // Sync player state with central GameState
        state.player = this.player.toState();
      }

      // Step 3: Weapons / Bullets update (Member 2)
      if (this.subsystems.weapons && typeof this.subsystems.weapons.update === 'function') {
        this.subsystems.weapons.update(dt, state);
      }

      // Step 4: Enemies / Waves / Pickups update (Member 3)
      if (this.subsystems.enemies && typeof this.subsystems.enemies.update === 'function') {
        this.subsystems.enemies.update(dt, state);
      }
      if (this.subsystems.gameplay && typeof this.subsystems.gameplay.update === 'function') {
        this.subsystems.gameplay.update(dt, state);
      }
    }

    // Step 5: UI & Audio updates (Member 4)
    if (this.subsystems.ui && typeof this.subsystems.ui.update === 'function') {
      this.subsystems.ui.update(dt, state);
    }
    if (this.subsystems.audio && typeof this.subsystems.audio.update === 'function') {
      this.subsystems.audio.update(dt, state);
    }
  }

  /**
   * Render arena, entities, and UI in proper layering order.
   */
  render() {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const state = this.stateManager.getState();
    const width = this.canvas.width;
    const height = this.canvas.height;

    // 1. Clear Arena background
    this._renderBackground(ctx, width, height);

    // 2. Render Pickups (Member 3)
    if (this.subsystems.gameplay && typeof this.subsystems.gameplay.renderPickups === 'function') {
      this.subsystems.gameplay.renderPickups(ctx, state.pickups, this.assetLoader);
    }

    // 3. Render Enemies (Member 3)
    if (this.subsystems.enemies && typeof this.subsystems.enemies.render === 'function') {
      this.subsystems.enemies.render(ctx, state.enemies, this.assetLoader);
    }

    // 4. Render Bullets & Effects (Member 2)
    if (this.subsystems.weapons && typeof this.subsystems.weapons.render === 'function') {
      this.subsystems.weapons.render(ctx, state.bullets, this.assetLoader);
    }

    // 5. Render Player (Member 1)
    if (this.player && this.player.isAlive()) {
      this.player.render(ctx, this.assetLoader);
    }

    // 6. Render HUD & Overlays (Member 4 / Fallback)
    if (this.subsystems.ui && typeof this.subsystems.ui.render === 'function') {
      this.subsystems.ui.render(ctx, state, this.assetLoader);
    } else {
      this._renderDefaultHUD(ctx, state);
    }
  }

  /**
   * Render arena floor and boundaries.
   * @private
   */
  _renderBackground(ctx, width, height) {
    // 1. Deep solid dark sci-fi base
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    // 2. Tile the background image from assets as a repeating grid
    let floorTiled = false;
    if (this.assetLoader && typeof this.assetLoader.getImage === 'function') {
      const floorImg = this.assetLoader.getImage('arena_floor.png');
      if (floorImg && floorImg.complete && floorImg.naturalWidth > 0) {
        const tileW = 240;
        const tileH = 240;
        for (let x = 0; x < width; x += tileW) {
          for (let y = 0; y < height; y += tileH) {
            ctx.drawImage(floorImg, x, y, tileW, tileH);
          }
        }
        floorTiled = true;
      }
    }

    // 3. Fallback subtle sci-fi grid if image is missing
    if (!floorTiled) {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const gridSize = 60;

      ctx.beginPath();
      for (let x = 0; x <= width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    }

    // 4. Arena boundary walls with sleek glowing border
    ctx.save();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#0284c7';
    ctx.shadowColor = 'rgba(2, 132, 199, 0.5)';
    ctx.shadowBlur = 12;
    ctx.strokeRect(3, 3, width - 6, height - 6);
    ctx.restore();
  }

  /**
   * Fallback HUD rendering when Member 4 UI module is not yet attached.
   * @private
   */
  _renderDefaultHUD(ctx, state) {
    ctx.save();
    ctx.fillStyle = '#f3f4f6';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    // Player health bar
    if (this.player) {
      const hpPercent = Math.max(0, this.player.health / this.player.maxHealth);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(16, 16, 160, 18);
      ctx.fillStyle = hpPercent > 0.3 ? '#22c55e' : '#ef4444';
      ctx.fillRect(16, 16, 160 * hpPercent, 18);
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 1;
      ctx.strokeRect(16, 16, 160, 18);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`HP: ${Math.ceil(this.player.health)} / ${this.player.maxHealth}`, 22, 30);
    }

    // Status / Score / Wave
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(`Score: ${state.score}`, 200, 30);
    ctx.fillText(`Wave: ${state.wave}`, 320, 30);

    if (state.status === GAME_STATUS.MENU) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('WEB ARENA SHOOTER', this.canvas.width / 2, this.canvas.height / 2 - 30);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '16px sans-serif';
      ctx.fillText('Press any key or click to begin', this.canvas.width / 2, this.canvas.height / 2 + 15);
      ctx.textAlign = 'left';
    } else if (state.status === GAME_STATUS.GAME_OVER) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Final Score: ${state.score}  |  Wave Reached: ${state.wave}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.fillText('Click to restart', this.canvas.width / 2, this.canvas.height / 2 + 60);
      ctx.textAlign = 'left';
    }

    ctx.restore();
  }
}
