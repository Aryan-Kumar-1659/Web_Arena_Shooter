import { describe, it, expect } from 'vitest';
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

    expect(display.healthText).toBe('75 / 100');
    expect(display.healthRatio).toBe(0.75);
    expect(display.weaponName).toBe('SHOTGUN');
    expect(display.ammoText).toBe('5 / 8');
    expect(display.scoreText).toBe('12,500');
    expect(display.waveText).toBe('WAVE 4');
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
    expect(display.healthText).toBe('0 / 100');
    expect(display.healthRatio).toBe(0);
    expect(display.ammoText).toBe('0 / 30');
  });

  it('should handle null/missing state without crashing', () => {
    const display = HUD.extractDisplayData(null);
    expect(display).toBeDefined();
    expect(display.weaponName).toBe('NONE');
  });
});

describe('Menu & Button Event Dispatching', () => {
  it('should trigger game:start when Start Game button is clicked', () => {
    let started = false;
    const menu = new Menu(() => {
      started = true;
    });

    const clickOutside = menu.handleClick(100, 100);
    expect(clickOutside).toBe(false);
    expect(started).toBe(false);

    menu.render({ save: () => {}, restore: () => {}, fillRect: () => {}, fillText: () => {}, strokeRect: () => {} }, 800, 600);

    const clickInside = menu.handleClick(400, 330);
    expect(clickInside).toBe(true);
    expect(started).toBe(true);
  });
});

describe('GameOver Screen & Restart Event Dispatching', () => {
  it('should trigger game:restart when Play Again button is clicked', () => {
    let restarted = false;
    const gameOver = new GameOverScreen(() => {
      restarted = true;
    });

    gameOver.render({ save: () => {}, restore: () => {}, fillRect: () => {}, fillText: () => {}, strokeRect: () => {} }, { score: 500, wave: 2 }, 800, 600);

    const clicked = gameOver.handleClick(400, 370);
    expect(clicked).toBe(true);
    expect(restarted).toBe(true);
  });
});
