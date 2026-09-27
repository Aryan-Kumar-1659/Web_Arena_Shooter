/**
 * menu.js
 * Start Menu Screen for Web Arena Shooter.
 * Owned by Member 4 (UI + Audio + Assets + QA).
 * 
 * Strict Contract Compliance:
 * - Emits event: "game:start" (UI -> Core)
 * - Displays controls and title when status === "MENU"
 */

export class Menu {
  /**
   * @param {Function} [onStartGame] - Callback to dispatch "game:start"
   */
  constructor(onStartGame = null) {
    this.onStartGame = onStartGame;
    this.startButton = {
      x: 960,
      y: 570,
      width: 280,
      height: 64
    };
  }

  /**
   * Triggers the game:start event.
   */
  triggerStart() {
    if (typeof this.onStartGame === 'function') {
      this.onStartGame();
    }
  }

  /**
   * Evaluates if a click hit the Start Game button.
   * @param {number} clickX 
   * @param {number} clickY 
   * @returns {boolean} Whether start was triggered
   */
  handleClick(clickX, clickY) {
    const { x, y, width, height } = this.startButton;
    const isInside = (
      clickX >= x - width / 2 &&
      clickX <= x + width / 2 &&
      clickY >= y - height / 2 &&
      clickY <= y + height / 2
    );

    if (isInside) {
      this.triggerStart();
      return true;
    }
    return false;
  }

  /**
   * Renders the Start Menu on Canvas.
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} [width=1920] 
   * @param {number} [height=1080] 
   */
  render(ctx, width = 1920, height = 1080) {
    if (!ctx) return;

    if (ctx.save) ctx.save();

    // Dark translucent backdrop
    ctx.fillStyle = 'rgba(10, 15, 25, 0.92)';
    if (ctx.fillRect) ctx.fillRect(0, 0, width, height);

    // Responsive scaling
    const isLarge = width > 1000;
    const titleSize = isLarge ? 64 : 48;
    const subtitleSize = isLarge ? 24 : 18;
    const btnW = isLarge ? 280 : 200;
    const btnH = isLarge ? 64 : 50;

    // Title
    ctx.textAlign = 'center';
    ctx.font = `900 ${titleSize}px sans-serif`;
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = isLarge ? 25 : 15;
    if (ctx.fillText) ctx.fillText('WEB ARENA SHOOTER', width / 2, height / 3);

    // Subtitle
    ctx.shadowBlur = 0;
    ctx.font = `${subtitleSize}px sans-serif`;
    ctx.fillStyle = '#94a3b8';
    if (ctx.fillText) ctx.fillText('Top-Down 2D Survival Combat', width / 2, height / 3 + (isLarge ? 45 : 35));

    // Start Button Coordinates
    this.startButton.x = width / 2;
    this.startButton.y = height / 2 + (height > 700 ? 50 : 30);
    this.startButton.width = btnW;
    this.startButton.height = btnH;
    const { x, y } = this.startButton;

    // Start Button Background
    ctx.fillStyle = '#00e676';
    if (ctx.beginPath && ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 8);
      ctx.fill();
    } else if (ctx.fillRect) {
      ctx.fillRect(x - btnW / 2, y - btnH / 2, btnW, btnH);
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    if (ctx.strokeRect) ctx.strokeRect(x - btnW / 2, y - btnH / 2, btnW, btnH);

    // Start Button Text
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${isLarge ? 24 : 20}px sans-serif`;
    ctx.textBaseline = 'middle';
    if (ctx.fillText) ctx.fillText('START GAME', x, y);

    // Instructions Box
    ctx.font = `${isLarge ? 18 : 14}px monospace`;
    ctx.fillStyle = '#e2e8f0';
    ctx.textBaseline = 'alphabetic';
    if (ctx.fillText) {
      ctx.fillText('CONTROLS:', width / 2, height - (isLarge ? 160 : 120));
      ctx.fillText('[W, A, S, D] Move   |   [Mouse] Aim   |   [Left Click] Shoot', width / 2, height - (isLarge ? 125 : 95));
      ctx.fillText('[1 / 2] Switch Weapon   |   [R] Reload', width / 2, height - (isLarge ? 95 : 75));
    }

    if (ctx.restore) ctx.restore();
  }
}
