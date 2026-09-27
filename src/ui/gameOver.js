/**
 * gameOver.js
 * Game Over and Restart Screen for Web Arena Shooter.
 * Owned by Member 4 (UI + Audio + Assets + QA).
 * 
 * Strict Contract Compliance:
 * - FR-14: Game-over and restart without page refresh.
 * - Emits event: "game:restart" (UI -> Core)
 * - Displays final score and wave achieved.
 */

export class GameOverScreen {
  /**
   * @param {Function} [onRestartGame] - Callback to dispatch "game:restart"
   */
  constructor(onRestartGame = null) {
    this.onRestartGame = onRestartGame;
    this.restartButton = {
      x: 960,
      y: 610,
      width: 280,
      height: 64
    };
  }

  /**
   * Triggers the game:restart event.
   */
  triggerRestart() {
    if (typeof this.onRestartGame === 'function') {
      this.onRestartGame();
    }
  }

  /**
   * Evaluates if a click hit the Restart button.
   * @param {number} clickX 
   * @param {number} clickY 
   * @returns {boolean} Whether restart was triggered
   */
  handleClick(clickX, clickY) {
    const { x, y, width, height } = this.restartButton;
    const isInside = (
      clickX >= x - width / 2 &&
      clickX <= x + width / 2 &&
      clickY >= y - height / 2 &&
      clickY <= y + height / 2
    );

    if (isInside) {
      this.triggerRestart();
      return true;
    }
    return false;
  }

  /**
   * Renders the Game Over screen on Canvas scaled for 1080p.
   * 
   * @param {CanvasRenderingContext2D} ctx 
   * @param {object} gameState 
   * @param {number} [width=1920] 
   * @param {number} [height=1080] 
   */
  render(ctx, gameState = {}, width = 1920, height = 1080) {
    if (!ctx) return;

    if (ctx.save) ctx.save();

    // Dark reddish overlay
    ctx.fillStyle = 'rgba(20, 5, 5, 0.94)';
    if (ctx.fillRect) ctx.fillRect(0, 0, width, height);

    // Responsive scaling
    const isLarge = width > 1000;
    const titleSize = isLarge ? 72 : 52;
    const statsSize = isLarge ? 26 : 22;
    const btnW = isLarge ? 280 : 200;
    const btnH = isLarge ? 64 : 50;

    // Title
    ctx.textAlign = 'center';
    ctx.font = `900 ${titleSize}px sans-serif`;
    ctx.fillStyle = '#ff1744';
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = isLarge ? 30 : 20;
    if (ctx.fillText) ctx.fillText('GAME OVER', width / 2, height / 3);

    // Statistics
    ctx.shadowBlur = 0;
    ctx.font = `${statsSize}px sans-serif`;
    ctx.fillStyle = '#ffffff';
    const score = (gameState.score || 0).toLocaleString();
    const wave = gameState.wave || 1;
    if (ctx.fillText) {
      ctx.fillText(`Final Score: ${score}`, width / 2, height / 3 + (isLarge ? 65 : 50));
      ctx.fillText(`Waves Survived: ${wave}`, width / 2, height / 3 + (isLarge ? 110 : 85));
    }

    // Restart Button Coordinates
    this.restartButton.x = width / 2;
    this.restartButton.y = height / 2 + (height > 700 ? 100 : 70);
    this.restartButton.width = btnW;
    this.restartButton.height = btnH;
    const { x, y } = this.restartButton;

    // Restart Button Background
    ctx.fillStyle = '#ff9100';
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

    // Restart Button Text
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${isLarge ? 24 : 20}px sans-serif`;
    ctx.textBaseline = 'middle';
    if (ctx.fillText) ctx.fillText('PLAY AGAIN', x, y);

    if (ctx.restore) ctx.restore();
  }
}
