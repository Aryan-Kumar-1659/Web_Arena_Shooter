import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HUD } from '../src/ui/hud.js';
import { Menu } from '../src/ui/menu.js';
import { GameOverScreen } from '../src/ui/gameOver.js';

describe('HUD State Processing & Formatting', () => {
  it('should format full GameState into structured display data', () => {
    const mockGameState = {
      status: 'PLAYING',
      score: 12500,
      wave: 4,
      player: { health: 75, maxHealth: 100 },
      weapon: { id: 'shotgun', ammo: 5, magazineSize: 8, cooldownMs: 800, damage: 15 }
    };

    const display = HUD.extractDisplayData(mockGameState);

    assert.equal(display.healthText, '75 / 100');
    assert.equal(display.healthRatio, 0.75);
    assert.equal(display.weaponName, 'SHOTGUN');
    assert.equal(display.ammoText, '5 / 8');
    assert.equal(display.scoreText, '12,500');
    assert.equal(display.waveText, 'WAVE 4');
  });

  it('should handle zero health or edge cases gracefully', () => {
    const emptyState = {
      status: 'PLAYING',
      score: 0,
      wave: 1,
      player: { health: -5, maxHealth: 100 },
      weapon: { id: 'rifle', ammo: 0, magazineSize: 30 }
    };

    const display = HUD.extractDisplayData(emptyState);
    assert.equal(display.healthText, '0 / 100');
    assert.equal(display.healthRatio, 0);
    assert.equal(display.ammoText, '0 / 30');
  });

  it('should handle null/missing state without crashing', () => {
    const display = HUD.extractDisplayData(null);
    assert.ok(display);
    assert.equal(display.weaponName, 'NONE');
  });
});

describe('Menu & Button Event Dispatching', () => {
  it('should trigger game:start when Start Game button is clicked', () => {
    let started = false;
    const menu = new Menu(() => {
      started = true;
    });

    // Simulate canvas size 800x600 -> startButton is at (400, 330) with w: 200, h: 50
    // Click outside
    const clickOutside = menu.handleClick(100, 100);
    assert.equal(clickOutside, false);
    assert.equal(started, false);

    // Call render once to position button
    menu.render({ save: () => {}, restore: () => {}, fillRect: () => {}, fillText: () => {}, strokeRect: () => {} }, 800, 600);

    // Click inside button
    const clickInside = menu.handleClick(400, 330);
    assert.equal(clickInside, true);
    assert.equal(started, true);
  });
});

describe('GameOver Screen & Restart Event Dispatching', () => {
  it('should trigger game:restart when Play Again button is clicked', () => {
    let restarted = false;
    const gameOver = new GameOverScreen(() => {
      restarted = true;
    });

    // Call render once to position button for 800x600 screen
    gameOver.render({ save: () => {}, restore: () => {}, fillRect: () => {}, fillText: () => {}, strokeRect: () => {} }, { score: 500, wave: 2 }, 800, 600);

    // Click inside restart button at (400, 370)
    const clicked = gameOver.handleClick(400, 370);
    assert.equal(clicked, true);
    assert.equal(restarted, true);
  });
});
