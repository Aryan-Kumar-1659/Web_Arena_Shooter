/**
 * Web Arena Shooter - Heads Up Display (HUD)
 * Member 4: UI + Audio + Asset/QA Developer
 * 
 * Renders health bars, ammo & reload indicators, active weapon display,
 * score counters, wave status, damage vignettes, and custom crosshair.
 */

import { assetLoader } from '../core/assetLoader.js';

export class HUD {
  constructor(loader = assetLoader) {
    this.loader = loader;
    this.damageFlashAlpha = 0;
    this.floatingTexts = [];
    this.crosshairX = 0;
    this.crosshairY = 0;
    this.crosshairAngle = 0;
  }

  /**
   * Updates HUD animations and floating numbers
   */
  update(deltaTime) {
    // Fade out damage flash vignette
    if (this.damageFlashAlpha > 0) {
      this.damageFlashAlpha = Math.max(0, this.damageFlashAlpha - deltaTime * 2.5);
    }

    // Spin crosshair slightly or animate
    this.crosshairAngle += deltaTime * 1.5;

    // Update floating combat texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const text = this.floatingTexts[i];
      text.y -= deltaTime * 40;
      text.alpha -= deltaTime * 1.2;
      if (text.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  /**
   * Sets mouse aiming position for crosshair rendering
   */
  setCrosshairPosition(x, y) {
    this.crosshairX = x;
    this.crosshairY = y;
  }

  /**
   * Triggers a red screen flash when player takes damage
   */
  triggerDamageFlash() {
    this.damageFlashAlpha = 0.5;
  }

  /**
   * Adds floating damage/score text at world coordinates
   */
  addFloatingText(text, x, y, color = '#ffffff') {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      alpha: 1.0
    });
  }

  /**
   * Main HUD Render Pass
   * @param {CanvasRenderingContext2D} ctx 
   * @param {Object} state - Current game state snapshot
   */
  render(ctx, state = {}) {
    if (!ctx) return;

    const {
      canvasWidth = ctx.canvas?.width || 800,
      canvasHeight = ctx.canvas?.height || 600,
      player = { health: 100, maxHealth: 100, currentWeapon: 'rifle' },
      weapon = { name: 'Rifle', currentAmmo: 30, maxAmmo: 30, reserveAmmo: 120, isReloading: false, reloadProgress: 0 },
      score = 0,
      wave = 1,
      enemiesRemaining = 0,
      waveTimer = 0
    } = state;

    ctx.save();

    // 1. Critical Health Vignette / Damage Flash
    this._renderDamageFlash(ctx, canvasWidth, canvasHeight, player);

    // 2. Health Bar (Top-Left)
    this._renderHealthBar(ctx, 24, 24, 240, 24, player);

    // 3. Score & Wave Information (Top-Right)
    this._renderScoreAndWave(ctx, canvasWidth - 24, 24, score, wave, enemiesRemaining);

    // 4. Weapon & Ammo Status (Bottom-Left)
    this._renderWeaponStatus(ctx, 24, canvasHeight - 34, weapon);

    // 5. Floating Texts (e.g. +100 Score, Critical Hit)
    this._renderFloatingTexts(ctx);

    // 6. Custom Tactical Crosshair
    this._renderCrosshair(ctx);

    ctx.restore();
  }

  _renderDamageFlash(ctx, width, height, player) {
    let alpha = this.damageFlashAlpha;

    // Pulsing vignette when HP is low (< 25%)
    if (player.health > 0 && player.health <= (player.maxHealth || 100) * 0.25) {
      const pulse = (Math.sin(Date.now() / 200) + 1) * 0.15;
      alpha = Math.max(alpha, 0.2 + pulse);
    }

    if (alpha > 0) {
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, width * 0.3,
        width / 2, height / 2, width * 0.7
      );
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0)');
      gradient.addColorStop(1, `rgba(239, 68, 68, ${alpha})`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
  }

  _renderHealthBar(ctx, x, y, width, height, player) {
    const health = Math.max(0, player.health ?? 100);
    const maxHealth = Math.max(1, player.maxHealth ?? 100);
    const healthRatio = Math.min(1, health / maxHealth);

    // Panel Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    this._roundRect(ctx, x - 8, y - 8, width + 48, height + 16, 8, true, true);

    // Health Icon
    const icon = this.loader.getImage('health_icon');
    if (icon) {
      try {
        ctx.drawImage(icon, x, y - 2, 28, 28);
      } catch (e) {
        this._drawFallbackHeart(ctx, x + 14, y + 12, 10);
      }
    } else {
      this._drawFallbackHeart(ctx, x + 14, y + 12, 10);
    }

    const barX = x + 36;
    const barWidth = width - 4;

    // Bar Empty Track
    ctx.fillStyle = '#1e293b';
    this._roundRect(ctx, barX, y, barWidth, height, 4, true, false);

    // Bar Fill Color (Green -> Yellow -> Red)
    let fillColor = '#10b981'; // Green
    if (healthRatio <= 0.25) {
      fillColor = '#ef4444'; // Red
    } else if (healthRatio <= 0.5) {
      fillColor = '#f59e0b'; // Amber
    }

    if (healthRatio > 0) {
      ctx.fillStyle = fillColor;
      this._roundRect(ctx, barX, y, barWidth * healthRatio, height, 4, true, false);
    }

    // Health Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.ceil(health)} / ${maxHealth}`, barX + barWidth / 2, y + height / 2 + 1);
  }

  _renderScoreAndWave(ctx, rightX, y, score, wave, enemiesRemaining) {
    ctx.textAlign = 'right';

    // Panel Box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    this._roundRect(ctx, rightX - 220, y - 8, 220, 68, 8, true, true);

    // Score Icon
    const scoreIcon = this.loader.getImage('score_icon');
    if (scoreIcon) {
      try {
        ctx.drawImage(scoreIcon, rightX - 210, y + 2, 20, 20);
      } catch (e) {}
    }

    // Score Text
    ctx.fillStyle = '#facc15'; // Gold
    ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`SCORE: ${Number(score).toLocaleString()}`, rightX - 16, y + 14);

    // Wave & Enemies Text
    ctx.fillStyle = '#38bdf8'; // Cyan
    ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`WAVE ${wave}`, rightX - 16, y + 36);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`Enemies left: ${enemiesRemaining}`, rightX - 16, y + 52);
  }

  _renderWeaponStatus(ctx, x, bottomY, weapon) {
    const isReloading = weapon.isReloading || false;
    const currentAmmo = weapon.currentAmmo ?? 30;
    const maxAmmo = weapon.maxAmmo ?? 30;
    const reserveAmmo = weapon.reserveAmmo ?? '∞';
    const weaponName = (weapon.name || 'Rifle').toUpperCase();

    const panelWidth = 240;
    const panelHeight = 72;
    const panelY = bottomY - panelHeight;

    // Panel Box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    this._roundRect(ctx, x, panelY, panelWidth, panelHeight, 8, true, true);

    // Weapon Icon
    const iconKey = weaponName.toLowerCase().includes('shotgun') ? 'shotgun' : 'rifle';
    const weaponIcon = this.loader.getImage(iconKey);
    if (weaponIcon) {
      try {
        ctx.drawImage(weaponIcon, x + 12, panelY + 14, 48, 48);
      } catch (e) {}
    }

    ctx.textAlign = 'left';

    // Weapon Name
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
    ctx.fillText(weaponName, x + 70, panelY + 24);

    if (isReloading) {
      // Reloading Bar
      const progress = weapon.reloadProgress ?? 0;
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
      ctx.fillText('RELOADING...', x + 70, panelY + 44);

      ctx.fillStyle = '#1e293b';
      this._roundRect(ctx, x + 70, panelY + 50, 150, 8, 3, true, false);
      ctx.fillStyle = '#f59e0b';
      this._roundRect(ctx, x + 70, panelY + 50, 150 * Math.min(1, progress), 8, 3, true, false);
    } else {
      // Ammo Numbers
      const ammoIcon = this.loader.getImage('ammo_icon');
      if (ammoIcon) {
        try {
          ctx.drawImage(ammoIcon, x + 70, panelY + 34, 20, 20);
        } catch (e) {}
      }

      ctx.fillStyle = currentAmmo <= 5 ? '#ef4444' : '#e2e8f0';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`${currentAmmo}`, x + 96, panelY + 52);

      ctx.fillStyle = '#64748b';
      ctx.font = '14px monospace';
      ctx.fillText(`/ ${reserveAmmo}`, x + 132, panelY + 52);
    }
  }

  _renderFloatingTexts(ctx) {
    for (const item of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, item.alpha);
      ctx.fillStyle = item.color;
      ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(item.text, item.x, item.y);
      ctx.restore();
    }
  }

  _renderCrosshair(ctx) {
    if (this.crosshairX === 0 && this.crosshairY === 0) return;

    ctx.save();
    ctx.translate(this.crosshairX, this.crosshairY);

    const crosshairImg = this.loader.getImage('crosshair');
    if (crosshairImg) {
      try {
        ctx.drawImage(crosshairImg, -16, -16, 32, 32);
      } catch (e) {
        this._drawProceduralCrosshair(ctx);
      }
    } else {
      this._drawProceduralCrosshair(ctx);
    }

    ctx.restore();
  }

  _drawProceduralCrosshair(ctx) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;

    // Circle
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.stroke();

    // Cross ticks
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(0, -4);
    ctx.moveTo(0, 4);
    ctx.lineTo(0, 14);
    ctx.moveTo(-14, 0);
    ctx.lineTo(-4, 0);
    ctx.moveTo(4, 0);
    ctx.lineTo(14, 0);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawFallbackHeart(ctx, x, y, size) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x - size / 2, y, size / 2, Math.PI, 0, false);
    ctx.arc(x + size / 2, y, size / 2, Math.PI, 0, false);
    ctx.lineTo(x, y + size);
    ctx.closePath();
    ctx.fill();
  }

  _roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === 'number') {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }
}

export const hud = new HUD();
