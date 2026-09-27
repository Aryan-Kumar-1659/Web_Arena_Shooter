/**
 * Web Arena Shooter - Main Menu UI
 * Member 4: UI + Audio + Asset/QA Developer
 * 
 * Title screen, Start Game button, Controls guide, and Audio Toggle.
 */

import { audioManager } from '../audio/audioManager.js';

export class Menu {
  constructor(audio = audioManager) {
    this.audio = audio;
    this.buttons = [];
    this.onStartCallback = null;
    this.mousePos = { x: 0, y: 0 };
    this.hoveredButton = null;
  }

  onStart(callback) {
    this.onStartCallback = callback;
  }

  setMousePosition(x, y) {
    this.mousePos = { x, y };
    this.hoveredButton = this.buttons.find((b) => this._isPointInRect(x, y, b));
  }

  handleClick(x, y) {
    const clicked = this.buttons.find((b) => this._isPointInRect(x, y, b));
    if (clicked) {
      this.audio.playSfx('button_click');
      if (clicked.id === 'start' && this.onStartCallback) {
        this.onStartCallback();
      } else if (clicked.id === 'audio') {
        this.audio.toggleMute();
      }
      return true;
    }
    return false;
  }

  _isPointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  }

  render(ctx, state = {}) {
    if (!ctx) return;

    const width = ctx.canvas?.width || 800;
    const height = ctx.canvas?.height || 600;

    this.buttons = []; // Recalculate button coordinates for responsiveness

    ctx.save();

    // Dark backdrop overlay with subtle arena grid
    ctx.fillStyle = 'rgba(10, 15, 30, 0.92)';
    ctx.fillRect(0, 0, width, height);

    // Decorative backdrop grid
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 1. Title Header
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glowing Title Shadow
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px "Segoe UI", Arial, sans-serif';
    ctx.fillText('WEB ARENA SHOOTER', width / 2, height * 0.22);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
    ctx.fillText('2D TOP-DOWN SURVIVAL ARENA', width / 2, height * 0.29);

    // 2. Start Game Button
    const startBtnWidth = 240;
    const startBtnHeight = 56;
    const startBtnX = width / 2 - startBtnWidth / 2;
    const startBtnY = height * 0.38;

    const startBtnRect = { id: 'start', x: startBtnX, y: startBtnY, width: startBtnWidth, height: startBtnHeight };
    this.buttons.push(startBtnRect);

    const isStartHovered = this.hoveredButton?.id === 'start';

    ctx.fillStyle = isStartHovered ? '#2563eb' : '#1d4ed8';
    ctx.strokeStyle = isStartHovered ? '#60a5fa' : '#3b82f6';
    ctx.lineWidth = isStartHovered ? 3 : 2;
    this._roundRect(ctx, startBtnX, startBtnY, startBtnWidth, startBtnHeight, 8, true, true);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText(isStartHovered ? '▶ START MISSION' : 'START GAME', width / 2, startBtnY + startBtnHeight / 2);

    // 3. Audio Mute Toggle Button
    const audioBtnWidth = 160;
    const audioBtnHeight = 40;
    const audioBtnX = width / 2 - audioBtnWidth / 2;
    const audioBtnY = height * 0.48;

    const audioBtnRect = { id: 'audio', x: audioBtnX, y: audioBtnY, width: audioBtnWidth, height: audioBtnHeight };
    this.buttons.push(audioBtnRect);

    const isAudioHovered = this.hoveredButton?.id === 'audio';
    const isMuted = this.audio.isMuted();

    ctx.fillStyle = isAudioHovered ? '#334155' : '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    this._roundRect(ctx, audioBtnX, audioBtnY, audioBtnWidth, audioBtnHeight, 6, true, true);

    ctx.fillStyle = isMuted ? '#f87171' : '#34d399';
    ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
    ctx.fillText(isMuted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON', width / 2, audioBtnY + audioBtnHeight / 2);

    // 4. Controls & How to Play Panel
    const cardWidth = Math.min(540, width - 48);
    const cardHeight = 170;
    const cardX = width / 2 - cardWidth / 2;
    const cardY = height * 0.58;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    this._roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 10, true, true);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
    ctx.fillText('MISSION BRIEFING & CONTROLS', width / 2, cardY + 24);

    const controls = [
      ['[ W, A, S, D ] / Arrows', 'Move Operative'],
      ['[ Mouse Aim ]', 'Target Reticle'],
      ['[ Left Click ]', 'Fire Weapon'],
      ['[ 1 / 2 ] / Scroll', 'Switch Rifle / Shotgun'],
      ['[ R ]', 'Tactical Reload']
    ];

    ctx.font = '13px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';

    const col1X = cardX + 36;
    const col2X = cardX + cardWidth / 2 + 10;
    let rowY = cardY + 54;

    controls.forEach(([key, desc], index) => {
      const curX = index < 3 ? col1X : col2X;
      const curY = index < 3 ? rowY + index * 32 : rowY + (index - 3) * 32;

      ctx.fillStyle = '#38bdf8';
      ctx.fillText(key, curX, curY);

      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`— ${desc}`, curX + 130, curY);
    });

    // Footer note
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = '12px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Survive waves, defeat enemies, collect medical & ammunition supplies.', width / 2, height * 0.92);

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

export const menu = new Menu();
