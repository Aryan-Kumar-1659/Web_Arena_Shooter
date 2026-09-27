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
      x: 400,
      y: 370,
      width: 200,
      height: 50
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
   * Renders the Game Over screen on Canvas.
   * 
   * @param {CanvasRenderingContext2D} ctx 
   * @param {object} gameState 
   * @param {number} [width=800] 
   * @param {number} [height=600] 
   */
  render(ctx, gameState = {}, width = 800, height = 600) {
    if (!ctx) return;

    ctx.save();

    // Dark reddish overlay
    ctx.fillStyle = 'rgba(20, 5, 5, 0.92)';
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.textAlign = 'center';
    ctx.font = '900 52px sans-serif';
    ctx.fillStyle = '#ff1744';
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 20;
    ctx.fillText('GAME OVER', width / 2, height / 3);

    // Statistics
    ctx.shadowBlur = 0;
    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#ffffff';
    const score = (gameState.score || 0).toLocaleString();
    const wave = gameState.wave || 1;
    ctx.fillText(`Final Score: ${score}`, width / 2, height / 3 + 50);
    ctx.fillText(`Waves Survived: ${wave}`, width / 2, height / 3 + 85);

    // Restart Button Coordinates
    this.restartButton.x = width / 2;
    this.restartButton.y = height / 2 + 70;
    const { x, y, width: btnW, height: btnH } = this.restartButton;

    // Restart Button Background
    ctx.fillStyle = '#ff9100';
    ctx.fillRect(x - btnW / 2, y - btnH / 2, btnW, btnH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - btnW / 2, y - btnH / 2, btnW, btnH);

    // Restart Button Text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('PLAY AGAIN', x, y + 7);

    ctx.restore();
  }
}
