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
   * Renders the complete HUD overlay onto the HTML5 Canvas scaled for 1080p.
   * 
   * @param {CanvasRenderingContext2D} ctx 
   * @param {object} gameState 
   * @param {import('../core/assetLoader.js').AssetLoader} [assetLoader] 
   * @param {{ x: number, y: number }} [mousePos]
   */
  static render(ctx, gameState, assetLoader = null, mousePos = null) {
    if (!ctx || !gameState || gameState.status !== 'PLAYING') return;

    const data = this.extractDisplayData(gameState);
    const canvasW = ctx.canvas?.width || 1920;
    const canvasH = ctx.canvas?.height || 1080;

    if (ctx.save) ctx.save();

    // Helper to draw clean rounded rectangles
    const drawCard = (x, y, w, h, bg = 'rgba(15, 23, 42, 0.90)', border = '#334155', radius = 8) => {
      ctx.fillStyle = bg;
      if (ctx.beginPath && ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);
        ctx.fill();
        if (border && ctx.stroke) {
          ctx.strokeStyle = border;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } else if (ctx.fillRect) {
        ctx.fillRect(x, y, w, h);
        if (border && ctx.strokeRect) {
          ctx.strokeStyle = border;
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);
        }
      }
    };

    // 1. HEALTH PANEL (Top Left)
    const cardX = 28;
    const cardY = 24;
    const cardW = 320;
    const cardH = 50;
    drawCard(cardX, cardY, cardW, cardH);

    // Health Icon
    const healthIcon = assetLoader?.getImage('health_icon.png');
    if (healthIcon && healthIcon.complete && healthIcon.naturalWidth !== 0 && ctx.drawImage) {
      ctx.drawImage(healthIcon, cardX + 12, cardY + 11, 28, 28);
    } else if (ctx.fillText) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('❤', cardX + 14, cardY + 32);
    }

    // Health Bar Gauge
    const barX = cardX + 48;
    const barY = cardY + 12;
    const barW = 256;
    const barH = 26;

    // Bar Background
    ctx.fillStyle = '#1e293b';
    if (ctx.beginPath && ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 5);
      ctx.fill();
    } else if (ctx.fillRect) {
      ctx.fillRect(barX, barY, barW, barH);
    }

    // Bar Fill
    if (data.healthRatio > 0) {
      ctx.fillStyle = data.healthRatio > 0.5 ? '#10b981' : data.healthRatio > 0.25 ? '#f59e0b' : '#ef4444';
      if (ctx.beginPath && ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * data.healthRatio, barH, 5);
        ctx.fill();
      } else if (ctx.fillRect) {
        ctx.fillRect(barX, barY, barW * data.healthRatio, barH);
      }
    }

    // Health Bar Border & Text
    if (ctx.stroke) {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    if (ctx.fillText) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(`HP: ${data.healthText}`, barX + barW / 2, barY + barH / 2);
      ctx.shadowBlur = 0;
    }

    // 2. WAVE BANNER (Top Center)
    const waveW = 200;
    const waveH = 46;
    const waveX = (canvasW - waveW) / 2;
    const waveY = 24;
    drawCard(waveX, waveY, waveW, waveH, 'rgba(15, 23, 42, 0.94)', '#06b6d4', 10);

    if (ctx.fillText) {
      ctx.fillStyle = '#22d3ee';
      ctx.font = '900 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(data.waveText, canvasW / 2, waveY + waveH / 2);
    }

    // 3. SCORE PANEL (Top Right)
    const scoreW = 240;
    const scoreH = 50;
    const scoreX = canvasW - scoreW - 28;
    const scoreY = 24;
    drawCard(scoreX, scoreY, scoreW, scoreH);

    const scoreIcon = assetLoader?.getImage('score_icon.png');
    if (scoreIcon && scoreIcon.complete && scoreIcon.naturalWidth !== 0 && ctx.drawImage) {
      ctx.drawImage(scoreIcon, scoreX + 14, scoreY + 12, 26, 26);
    } else if (ctx.fillText) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('★', scoreX + 14, scoreY + 32);
    }

    if (ctx.fillText) {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(`SCORE: ${data.scoreText}`, scoreX + scoreW - 16, scoreY + scoreH / 2);
    }

    // 4. WEAPON & AMMO CARD (Bottom Right)
    const weaponCardW = 250;
    const weaponCardH = 80;
    const weaponCardX = canvasW - weaponCardW - 28;
    const weaponCardY = canvasH - weaponCardH - 28;
    drawCard(weaponCardX, weaponCardY, weaponCardW, weaponCardH, 'rgba(15, 23, 42, 0.94)', '#334155', 8);

    const ammoIcon = assetLoader?.getImage('ammo_icon.png');
    if (ammoIcon && ammoIcon.complete && ammoIcon.naturalWidth !== 0 && ctx.drawImage) {
      ctx.drawImage(ammoIcon, weaponCardX + 14, weaponCardY + 16, 48, 48);
    }

    if (ctx.fillText) {
      // Weapon Name
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.font = '900 18px sans-serif';
      ctx.fillStyle = '#facc15';
      ctx.fillText(data.weaponName, weaponCardX + weaponCardW - 18, weaponCardY + 14);

      // Ammo Count
      ctx.font = 'bold 22px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`AMMO: ${data.ammoText}`, weaponCardX + weaponCardW - 18, weaponCardY + 40);
    }

    // 5. RETICLE / CROSSHAIR (at Mouse position)
    if (mousePos) {
      const crosshair = assetLoader?.getImage('crosshair.png');
      if (crosshair && crosshair.complete && crosshair.naturalWidth !== 0 && ctx.drawImage) {
        ctx.drawImage(crosshair, mousePos.x - 20, mousePos.y - 20, 40, 40);
      } else if (ctx.beginPath) {
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 10, 0, Math.PI * 2);
        ctx.moveTo(mousePos.x - 16, mousePos.y);
        ctx.lineTo(mousePos.x + 16, mousePos.y);
        ctx.moveTo(mousePos.x, mousePos.y - 16);
        ctx.lineTo(mousePos.x, mousePos.y + 16);
        if (ctx.stroke) ctx.stroke();
      }
    }

    if (ctx.restore) ctx.restore();
  }
}
