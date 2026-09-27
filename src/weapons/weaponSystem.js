/**
 * weaponSystem.js
 * Manages active weapon state, firing cooldowns, ammo tracking, reloading, and weapon switching.
 * Exposes WeaponState strictly matching CONTRACT.md:
 * WeaponState { id: "rifle"|"shotgun", ammo, magazineSize, cooldownMs, damage }
 */

import { WEAPON_CONFIGS, createWeaponState, getWeaponConfig } from './weaponData.js';
import { spawnBullets } from './bullet.js';

export class WeaponSystem {
  /**
   * @param {'rifle' | 'shotgun'} [initialWeaponId='rifle']
   */
  constructor(initialWeaponId = 'rifle') {
    this.switchWeapon(initialWeaponId);
  }

  /**
   * Switches the active weapon and loads its configuration.
   * @param {'rifle' | 'shotgun'} weaponId
   */
  switchWeapon(weaponId) {
    if (!WEAPON_CONFIGS[weaponId]) {
      throw new Error(`Cannot switch to unknown weapon: "${weaponId}"`);
    }

    this.activeConfig = getWeaponConfig(weaponId);
    this.state = createWeaponState(weaponId);
    this.cooldownTimerMs = 0;
    this.isReloading = false;
    this.reloadTimerMs = 0;
  }

  /**
   * Returns the current WeaponState conforming to CONTRACT.md.
   * @returns {object} WeaponState
   */
  getState() {
    return {
      id: this.state.id,
      ammo: this.state.ammo,
      magazineSize: this.state.magazineSize,
      cooldownMs: this.state.cooldownMs,
      damage: this.state.damage
    };
  }

  /**
   * Checks if the active weapon is ready to fire.
   * @returns {boolean}
   */
  canShoot() {
    return this.cooldownTimerMs <= 0 && !this.isReloading && this.state.ammo > 0;
  }

  /**
   * Initiates reload sequence.
   * @returns {boolean} Whether reload was started
   */
  reload() {
    if (this.isReloading || this.state.ammo >= this.state.magazineSize) {
      return false;
    }

    this.isReloading = true;
    this.reloadTimerMs = this.activeConfig.reloadTimeMs;
    return true;
  }

  /**
   * Updates cooldown and reload timers based on delta time.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    const dtMs = dt * 1000;

    // Tick cooldown timer
    if (this.cooldownTimerMs > 0) {
      this.cooldownTimerMs = Math.max(0, this.cooldownTimerMs - dtMs);
    }

    // Tick reload timer
    if (this.isReloading) {
      this.reloadTimerMs = Math.max(0, this.reloadTimerMs - dtMs);
      if (this.reloadTimerMs <= 0) {
        this.isReloading = false;
        this.state.ammo = this.state.magazineSize;
      }
    }
  }

  /**
   * Fires the weapon from the specified position towards the given angle.
   * Deducts ammo, sets cooldown, and returns array of spawned BulletStates.
   * 
   * @param {number} originX - Player X position
   * @param {number} originY - Player Y position
   * @param {number} angle - Aim angle in radians
   * @returns {Array<object>|null} Array of BulletState objects or null if cannot shoot
   */
  shoot(originX, originY, angle) {
    if (!this.canShoot()) {
      // Auto-reload if magazine is empty and not already reloading
      if (this.state.ammo === 0 && !this.isReloading) {
        this.reload();
      }
      return null;
    }

    // Deduct ammo & trigger cooldown
    this.state.ammo -= 1;
    this.cooldownTimerMs = this.state.cooldownMs;

    // Spawn bullets
    const bullets = spawnBullets(this.activeConfig, originX, originY, angle);

    // Auto-reload if last bullet was fired
    if (this.state.ammo === 0) {
      this.reload();
    }

    return bullets;
  }

  /**
   * Adds ammunition (e.g. from ammo pickups).
   * @param {number} amount
   */
  addAmmo(amount) {
    this.state.ammo = Math.min(this.state.magazineSize, this.state.ammo + amount);
    if (this.state.ammo > 0) {
      this.isReloading = false;
      this.reloadTimerMs = 0;
    }
  }
}
