/**
 * @file playerController.js
 * @description Player input handling, physics movement, boundary collision resolution, and shooting event dispatch.
 * Owned by Member 1 (Team Lead + Core Engine + Player).
 */

import { clampEntityToBounds } from '../core/collision.js';
import { EVENTS, eventBus } from '../core/gameState.js';

export class PlayerController {
  /**
   * @param {import('./player').Player} player
   * @param {import('../core/input').InputManager} input
   * @param {Object} [options]
   * @param {import('../core/gameState').EventBus} [options.bus]
   * @param {{ width: number, height: number, x?: number, y?: number }} [options.bounds]
   */
  constructor(player, input, options = {}) {
    this.player = player;
    this.input = input;
    this.bus = options.bus ?? eventBus;
    this.bounds = options.bounds ?? { x: 0, y: 0, width: 800, height: 600 };
    this.enabled = true;
  }

  /**
   * Set or update arena boundaries for player clamping.
   * @param {{ width: number, height: number, x?: number, y?: number }} bounds
   */
  setBounds(bounds) {
    if (bounds) {
      this.bounds = {
        x: bounds.x ?? 0,
        y: bounds.y ?? 0,
        width: bounds.width ?? 800,
        height: bounds.height ?? 600
      };
    }
  }

  /**
   * Main update tick for player movement, aiming, and boundary enforcement.
   * @param {number} dt Delta time in seconds
   * @param {import('../core/gameState').WeaponState} [currentWeapon] Current active weapon for shoot event
   */
  update(dt, currentWeapon = null) {
    if (!this.enabled || !this.player.isAlive()) {
      this.player.isMoving = false;
      this.player.updateTimers(dt);
      return;
    }

    // 1. Process movement input
    const move = this.input.getMovementVector();
    this.player.isMoving = move.isMoving;

    if (move.isMoving) {
      this.player.x += move.x * this.player.speed * dt;
      this.player.y += move.y * this.player.speed * dt;
    }

    // 2. Aiming - calculate angle towards mouse position
    const dx = this.input.mouse.x - this.player.x;
    const dy = this.input.mouse.y - this.player.y;
    this.player.angle = Math.atan2(dy, dx);

    // 3. Arena boundary collision clamping
    clampEntityToBounds(this.player, this.bounds);

    // 4. Update animation & visual feedback timers
    this.player.updateTimers(dt);

    // 5. Handle shooting trigger (Member 1 dispatches player:shoot event per CONTRACT.md)
    if (this.input.mouse.isDown) {
      this._handleShooting(currentWeapon);
    }
  }

  /**
   * Dispatches the canonical player:shoot event to Combat/Weapon module (Member 2).
   * @private
   * @param {import('../core/gameState').WeaponState} [currentWeapon]
   */
  _handleShooting(currentWeapon) {
    const muzzleOffset = this.player.radius + 6;
    const muzzleX = this.player.x + Math.cos(this.player.angle) * muzzleOffset;
    const muzzleY = this.player.y + Math.sin(this.player.angle) * muzzleOffset;

    this.bus.emit(EVENTS.PLAYER_SHOOT, {
      weaponId: currentWeapon?.id ?? 'rifle',
      x: muzzleX,
      y: muzzleY,
      angle: this.player.angle
    });
  }
}
