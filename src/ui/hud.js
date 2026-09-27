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
   * Renders the complete HUD overlay onto the HTML5 Canvas with modern, high-contrast dark cards.
   * 
   * @param {CanvasRenderingContext2D} ctx 
   * @param {object} gameState 
   * @param {import('../core/assetLoader.js').AssetLoader} [assetLoader] 
   * @param {{ x: number, y: number }} [mousePos]
   */
  static render(ctx, gameState, assetLoader = null, mousePos = null) {
    if (!ctx || !gameState || gameState.status !== 'PLAYING') return;

    const data = this.extractDisplayData(gameState);
    const canvasW = ctx.canvas?.width || 800;
    const canvasH = ctx.canvas?.height || 600;

    ctx.save();

    // Helper to draw clean rounded rectangles
    const drawCard = (x, y, w, h, bg = 'rgba(15, 23, 42, 0.88)', border = '#334155', radius = 6) => {
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, w, h, radius) : ctx.rect(x, y, w, h);
      ctx.fillStyle = bg;
      ctx.fill();
      if (border) {
        ctx.strokeStyle = border;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    };

    // 1. HEALTH PANEL (Top Left)
    const cardX = 16;
    const cardY = 16;
    const cardW = 240;
    const cardH = 38;
    drawCard(cardX, cardY, cardW, cardH);

    // Health Icon
    const healthIcon = assetLoader?.getImage('health_icon.png');
    if (healthIcon && healthIcon.complete && healthIcon.naturalWidth !== 0) {
      ctx.drawImage(healthIcon, cardX + 8, cardY + 8, 22, 22);
    } else {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('❤', cardX + 10, cardY + 24);
    }

    // Health Bar Gauge
    const barX = cardX + 36;
    const barY = cardY + 9;
    const barW = 190;
    const barH = 20;

    // Bar Background
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(barX, barY, barW, barH, 4) : ctx.rect(barX, barY, barW, barH);
    ctx.fill();

    // Bar Fill
    if (data.healthRatio > 0) {
      ctx.fillStyle = data.healthRatio > 0.5 ? '#10b981' : data.healthRatio > 0.25 ? '#f59e0b' : '#ef4444';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(barX, barY, barW * data.healthRatio, barH, 4) : ctx.rect(barX, barY, barW * data.healthRatio, barH);
      ctx.fill();
    }

    // Health Bar Border & Text
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 3;
    ctx.fillText(`HP: ${data.healthText}`, barX + barW / 2, barY + barH / 2);
    ctx.shadowBlur = 0;

    // 2. WAVE BANNER (Top Center)
    const waveW = 150;
    const waveH = 34;
    const waveX = (canvasW - waveW) / 2;
    const waveY = 16;
    drawCard(waveX, waveY, waveW, waveH, 'rgba(15, 23, 42, 0.92)', '#06b6d4', 8);

    ctx.fillStyle = '#22d3ee';
    ctx.font = '900 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.waveText, canvasW / 2, waveY + waveH / 2);

    // 3. SCORE PANEL (Top Right)
    const scoreW = 180;
    const scoreH = 38;
    const scoreX = canvasW - scoreW - 16;
    const scoreY = 16;
    drawCard(scoreX, scoreY, scoreW, scoreH);

    const scoreIcon = assetLoader?.getImage('score_icon.png');
    if (scoreIcon && scoreIcon.complete && scoreIcon.naturalWidth !== 0) {
      ctx.drawImage(scoreIcon, scoreX + 10, scoreY + 9, 20, 20);
    } else {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('★', scoreX + 10, scoreY + 24);
    }

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`SCORE: ${data.scoreText}`, scoreX + scoreW - 12, scoreY + scoreH / 2);

    // 4. WEAPON & AMMO CARD (Bottom Right)
    const weaponCardW = 190;
    const weaponCardH = 60;
    const weaponCardX = canvasW - weaponCardW - 16;
    const weaponCardY = canvasH - weaponCardH - 16;
    drawCard(weaponCardX, weaponCardY, weaponCardW, weaponCardH, 'rgba(15, 23, 42, 0.92)', '#334155', 6);

    const ammoIcon = assetLoader?.getImage('ammo_icon.png');
    if (ammoIcon && ammoIcon.complete && ammoIcon.naturalWidth !== 0) {
      ctx.drawImage(ammoIcon, weaponCardX + 10, weaponCardY + 12, 36, 36);
    }

    // Weapon Name
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.font = '900 14px sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.fillText(data.weaponName, weaponCardX + weaponCardW - 14, weaponCardY + 10);

    // Ammo Count
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`AMMO: ${data.ammoText}`, weaponCardX + weaponCardW - 14, weaponCardY + 30);

    // 5. RETICLE / CROSSHAIR (at Mouse position)
    if (mousePos) {
      const crosshair = assetLoader?.getImage('crosshair.png');
      if (crosshair && crosshair.complete && crosshair.naturalWidth !== 0) {
        ctx.drawImage(crosshair, mousePos.x - 16, mousePos.y - 16, 32, 32);
      } else {
        ctx.strokeStyle = '#22d3ee';
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
