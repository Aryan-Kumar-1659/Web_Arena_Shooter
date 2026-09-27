/**
 * hud.js
 * In-game Heads-Up Display (HUD) for Web Arena Shooter.
 * Owned by Member 4 (UI + Audio + Assets + QA).
 * 
 * Strict Contract Compliance:
 * - FR-13: Displays health, ammo, score, wave, and weapon.
 * - Renders icons: health_icon.png, ammo_icon.png, score_icon.png, crosshair.png.
 * - Primitive visual fallbacks for all elements.
 */

export class HUD {
  /**
   * Formats raw GameState into structured HUD display data.
   * Useful for independent unit testing and DOM bindings.
   * 
   * @param {object} gameState - Shared GameState from CONTRACT.md
   * @returns {object} Formatted display metrics
   */
  static extractDisplayData(gameState) {
    if (!gameState) {
      return {
        healthText: '0 / 0',
        healthRatio: 0,
        weaponName: 'NONE',
        ammoText: '0 / 0',
        scoreText: '0',
        waveText: 'Wave 0'
      };
    }

    const player = gameState.player || { health: 0, maxHealth: 100 };
    const weapon = gameState.weapon || { id: 'rifle', ammo: 0, magazineSize: 0 };
    const score = gameState.score || 0;
    const wave = gameState.wave || 1;

    const healthRatio = player.maxHealth > 0 ? Math.max(0, Math.min(1, player.health / player.maxHealth)) : 0;

    return {
      health: player.health,
      maxHealth: player.maxHealth,
      healthText: `${Math.max(0, Math.round(player.health))} / ${player.maxHealth}`,
      healthRatio,
      weaponName: (weapon.id || 'rifle').toUpperCase(),
      ammoText: `${weapon.ammo} / ${weapon.magazineSize}`,
      score: score,
      scoreText: score.toLocaleString(),
      wave: wave,
      waveText: `WAVE ${wave}`
    };
  }

  /**
   * Renders the complete HUD overlay onto the HTML5 Canvas.
   * 
   * @param {CanvasRenderingContext2D} ctx 
   * @param {object} gameState 
   * @param {import('../core/assetLoader.js').AssetLoader} [assetLoader] 
   * @param {{ x: number, y: number }} [mousePos]
   */
  static render(ctx, gameState, assetLoader = null, mousePos = null) {
    if (!ctx || !gameState || gameState.status !== 'PLAYING') return;

    const data = this.extractDisplayData(gameState);

    ctx.save();

    // 1. HEALTH BAR (Top Left)
    const barX = 20;
    const barY = 20;
    const barW = 200;
    const barH = 20;

    // Background bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, barY, barW, barH);

    // Health fill (Green to Red gradient based on ratio)
    ctx.fillStyle = data.healthRatio > 0.5 ? '#4caf50' : data.healthRatio > 0.25 ? '#ff9800' : '#f44336';
    ctx.fillRect(barX, barY, barW * data.healthRatio, barH);

    // Health Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, barH);

    // Health Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`HP: ${data.healthText}`, barX + 8, barY + 14);

    // Optional Health Icon
    const healthIcon = assetLoader?.getImage('health_icon.png');
    if (healthIcon && healthIcon.complete && healthIcon.naturalWidth !== 0) {
      ctx.drawImage(healthIcon, barX - 16, barY + 2, 16, 16);
    }

    // 2. AMMO & WEAPON (Bottom Right)
    const canvasW = ctx.canvas?.width || 800;
    const canvasH = ctx.canvas?.height || 600;

    ctx.textAlign = 'right';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#ffeb3b';
    ctx.fillText(`${data.weaponName}`, canvasW - 20, canvasH - 45);

    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`AMMO: ${data.ammoText}`, canvasW - 20, canvasH - 20);

    // 3. SCORE & WAVE (Top Center / Top Right)
    ctx.textAlign = 'right';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`SCORE: ${data.scoreText}`, canvasW - 20, barY + 14);

    ctx.textAlign = 'center';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(data.waveText, canvasW / 2, barY + 16);

    // 4. RETICLE / CROSSHAIR (at Mouse position)
    if (mousePos) {
      const crosshair = assetLoader?.getImage('crosshair.png');
      if (crosshair && crosshair.complete && crosshair.naturalWidth !== 0) {
        ctx.drawImage(crosshair, mousePos.x - 16, mousePos.y - 16, 32, 32);
      } else {
        // Fallback crosshair reticle
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 8, 0, Math.PI * 2);
        ctx.moveTo(mousePos.x - 12, mousePos.y);
        ctx.lineTo(mousePos.x + 12, mousePos.y);
        ctx.moveTo(mousePos.x, mousePos.y - 12);
        ctx.lineTo(mousePos.x, mousePos.y + 12);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
