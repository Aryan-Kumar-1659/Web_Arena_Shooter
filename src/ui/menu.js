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
      x: 0,
      y: 0,
      width: 200,
      height: 50
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
   * @param {number} [width=800] 
   * @param {number} [height=600] 
   */
  render(ctx, width = 800, height = 600) {
    if (!ctx) return;

    ctx.save();

    // Dark translucent backdrop
    ctx.fillStyle = 'rgba(10, 15, 25, 0.9)';
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.textAlign = 'center';
    ctx.font = '900 48px sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 15;
    ctx.fillText('WEB ARENA SHOOTER', width / 2, height / 3);

    // Subtitle
    ctx.shadowBlur = 0;
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#b0bec5';
    ctx.fillText('Top-Down 2D Survival Combat', width / 2, height / 3 + 35);

    // Start Button Coordinates
    this.startButton.x = width / 2;
    this.startButton.y = height / 2 + 30;
    const { x, y, width: btnW, height: btnH } = this.startButton;

    // Start Button Background
    ctx.fillStyle = '#00e676';
    ctx.fillRect(x - btnW / 2, y - btnH / 2, btnW, btnH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - btnW / 2, y - btnH / 2, btnW, btnH);

    // Start Button Text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('START GAME', x, y + 7);

    // Instructions Box
    ctx.font = '14px monospace';
    ctx.fillStyle = '#eceff1';
    ctx.fillText('CONTROLS:', width / 2, height - 120);
    ctx.fillText('[W, A, S, D] Move   |   [Mouse] Aim   |   [Left Click] Shoot', width / 2, height - 95);
    ctx.fillText('[1 / 2] Switch Weapon   |   [R] Reload', width / 2, height - 75);

    ctx.restore();
  }
}
