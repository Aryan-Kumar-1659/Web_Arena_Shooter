/**
 * Web Arena Shooter - Game Over Screen UI
 * Member 4: UI + Audio + Asset/QA Developer
 * 
 * Game Over overlay, Mission Statistics, High Score tracking,
 * and Restart / Main Menu navigation.
 */

import { audioManager } from '../audio/audioManager.js';

export class GameOver {
  constructor(audio = audioManager) {
    this.audio = audio;
    this.buttons = [];
    this.onRestartCallback = null;
    this.onMenuCallback = null;
    this.mousePos = { x: 0, y: 0 };
    this.hoveredButton = null;
    this.soundPlayed = false;
    this.highScoreKey = 'web_arena_high_score';
  }

  onRestart(callback) {
    this.onRestartCallback = callback;
  }

  onMenu(callback) {
    this.onMenuCallback = callback;
  }

  reset() {
    this.soundPlayed = false;
    this.hoveredButton = null;
  }

  getHighScore() {
    try {
      if (typeof localStorage !== 'undefined') {
        return parseInt(localStorage.getItem(this.highScoreKey) || '0', 10);
      }
    } catch (e) {}
    return 0;
  }

  saveHighScore(score) {
    try {
      const current = this.getHighScore();
      if (score > current) {
        localStorage.setItem(this.highScoreKey, String(score));
        return true;
      }
    } catch (e) {}
    return false;
  }

  setMousePosition(x, y) {
    this.mousePos = { x, y };
    this.hoveredButton = this.buttons.find((b) => this._isPointInRect(x, y, b));
  }

  handleClick(x, y) {
    const clicked = this.buttons.find((b) => this._isPointInRect(x, y, b));
    if (clicked) {
      this.audio.playSfx('button_click');
      if (clicked.id === 'restart' && this.onRestartCallback) {
        this.reset();
        this.onRestartCallback();
      } else if (clicked.id === 'menu' && this.onMenuCallback) {
        this.reset();
        this.onMenuCallback();
      }
      return true;
    }
    return false;
  }

  _isPointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  }

  render(ctx, stats = {}) {
    if (!ctx) return;

    const width = ctx.canvas?.width || 800;
    const height = ctx.canvas?.height || 600;

    const score = stats.score || 0;
    const wave = stats.wave || 1;
    const enemiesKilled = stats.enemiesKilled || 0;
    const isNewHighScore = this.saveHighScore(score);
    const highScore = this.getHighScore();

    if (!this.soundPlayed) {
      this.audio.playSfx('game_over');
      this.soundPlayed = true;
    }

    this.buttons = []; // Recalculate

    ctx.save();

    // Dark red tinted backdrop overlay
    ctx.fillStyle = 'rgba(15, 7, 7, 0.92)';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 1. GAME OVER Title
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#ef4444';
    ctx.font = '900 52px "Segoe UI", Arial, sans-serif';
    ctx.fillText('MISSION FAILED', width / 2, height * 0.22);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
    ctx.fillText('OPERATIVE ELIMINATED', width / 2, height * 0.29);

    // 2. Statistics Card
    const cardWidth = Math.min(460, width - 48);
    const cardHeight = 180;
    const cardX = width / 2 - cardWidth / 2;
    const cardY = height * 0.35;

    ctx.fillStyle = 'rgba(24, 15, 15, 0.85)';
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 10, true, true);

    // Final Score
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`FINAL SCORE: ${score.toLocaleString()}`, width / 2, cardY + 38);

    if (isNewHighScore) {
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
      ctx.fillText('★ NEW HIGH SCORE! ★', width / 2, cardY + 64);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px "Segoe UI", Arial, sans-serif';
      ctx.fillText(`Best Record: ${highScore.toLocaleString()}`, width / 2, cardY + 64);
    }

    // Detail Grid
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`Waves Survived: ${wave}`, width / 2 - 90, cardY + 110);
    ctx.fillText(`Enemies Eliminated: ${enemiesKilled}`, width / 2 + 90, cardY + 110);

    // 3. Action Buttons
    const btnWidth = 200;
    const btnHeight = 50;
    const btnY = height * 0.68;

    // Restart Button
    const restartX = width / 2 - btnWidth - 12;
    const restartRect = { id: 'restart', x: restartX, y: btnY, width: btnWidth, height: btnHeight };
    this.buttons.push(restartRect);

    const isRestartHovered = this.hoveredButton?.id === 'restart';

    ctx.fillStyle = isRestartHovered ? '#16a34a' : '#15803d';
    ctx.strokeStyle = isRestartHovered ? '#86efac' : '#22c55e';
    ctx.lineWidth = isRestartHovered ? 3 : 2;
    this._roundRect(ctx, restartX, btnY, btnWidth, btnHeight, 8, true, true);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
    ctx.fillText('↻ PLAY AGAIN', restartX + btnWidth / 2, btnY + btnHeight / 2);

    // Main Menu Button
    const menuX = width / 2 + 12;
    const menuRect = { id: 'menu', x: menuX, y: btnY, width: btnWidth, height: btnHeight };
    this.buttons.push(menuRect);

    const isMenuHovered = this.hoveredButton?.id === 'menu';

    ctx.fillStyle = isMenuHovered ? '#475569' : '#334155';
    ctx.strokeStyle = isMenuHovered ? '#94a3b8' : '#64748b';
    ctx.lineWidth = isMenuHovered ? 3 : 2;
    this._roundRect(ctx, menuX, btnY, btnWidth, btnHeight, 8, true, true);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
    ctx.fillText('MAIN MENU', menuX + btnWidth / 2, btnY + btnHeight / 2);

    ctx.restore();
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

export const gameOver = new GameOver();
