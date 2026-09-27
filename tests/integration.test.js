import { describe, it, expect, vi } from 'vitest';
import { AssetLoader } from '../src/core/assetLoader.js';
import { AudioManager } from '../src/audio/audioManager.js';
import { HUD } from '../src/ui/hud.js';
import { Menu } from '../src/ui/menu.js';
import { GameOver } from '../src/ui/gameOver.js';

describe('Cross-Module Integration Smoke Tests (Member 4 QA)', () => {
  it('should seamlessly integrate AssetLoader, AudioManager, HUD, Menu, and GameOver', async () => {
    // 1. Asset Pipeline
    const loader = new AssetLoader();
    await loader.loadAll();
    expect(loader.loaded).toBe(true);

    // 2. Audio Pipeline
    const audio = new AudioManager(loader);
    expect(audio.isMuted()).toBe(false);

    // 3. UI Pipeline
    const hud = new HUD(loader);
    const menu = new Menu(audio);
    const gameOver = new GameOver(audio);

    const mockCtx = {
      canvas: { width: 1280, height: 720 },
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      clearRect: vi.fn(),
      fillText: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      drawImage: vi.fn(),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      translate: vi.fn(),
      rotate: vi.fn()
    };

    // Simulate Menu State
    menu.render(mockCtx);
    expect(menu.buttons.length).toBeGreaterThanOrEqual(2);

    // Transition to Playing State
    let gameStarted = false;
    menu.onStart(() => {
      gameStarted = true;
      audio.playMusic('background_music');
    });
    menu.handleClick(menu.buttons[0].x + 5, menu.buttons[0].y + 5);
    expect(gameStarted).toBe(true);

    // Render In-Game HUD
    hud.setCrosshairPosition(640, 360);
    hud.update(0.016);
    hud.render(mockCtx, {
      player: { health: 100, maxHealth: 100 },
      weapon: { name: 'Rifle', currentAmmo: 30, maxAmmo: 30, reserveAmmo: 120 },
      score: 500,
      wave: 2,
      enemiesRemaining: 4
    });
    expect(mockCtx.save).toHaveBeenCalled();

    // Transition to Game Over
    let gameRestarted = false;
    gameOver.onRestart(() => {
      gameRestarted = true;
    });
    gameOver.render(mockCtx, { score: 1250, wave: 3, enemiesKilled: 14 });
    expect(gameOver.buttons.length).toBe(2);

    const restartBtn = gameOver.buttons.find(b => b.id === 'restart');
    gameOver.handleClick(restartBtn.x + 5, restartBtn.y + 5);
    expect(gameRestarted).toBe(true);
  });
});
