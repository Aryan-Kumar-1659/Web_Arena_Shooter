import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HUD } from '../src/ui/hud.js';
import { Menu } from '../src/ui/menu.js';
import { GameOver } from '../src/ui/gameOver.js';
import { AssetLoader } from '../src/core/assetLoader.js';
import { AudioManager } from '../src/audio/audioManager.js';

describe('UI Modules (Member 4 QA)', () => {
  let loader;
  let audio;
  let mockCtx;

  beforeEach(() => {
    loader = new AssetLoader();
    audio = new AudioManager(loader);

    mockCtx = {
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
      createPattern: vi.fn(() => null),
      translate: vi.fn(),
      rotate: vi.fn()
    };
  });

  describe('HUD', () => {
    let hud;

    beforeEach(() => {
      hud = new HUD(loader);
    });

    it('should initialize with default states', () => {
      expect(hud.damageFlashAlpha).toBe(0);
      expect(hud.floatingTexts.length).toBe(0);
    });

    it('should trigger damage flash and update alpha over time', () => {
      hud.triggerDamageFlash();
      expect(hud.damageFlashAlpha).toBeGreaterThan(0);

      hud.update(0.1);
      expect(hud.damageFlashAlpha).toBeLessThan(0.5);
    });

    it('should add and expire floating combat texts', () => {
      hud.addFloatingText('+100', 100, 100, '#ffffff');
      expect(hud.floatingTexts.length).toBe(1);

      // Simulate enough delta time for text to expire
      hud.update(1.5);
      expect(hud.floatingTexts.length).toBe(0);
    });

    it('should render without crashing across diverse state inputs', () => {
      expect(() => {
        hud.render(mockCtx, {
          player: { health: 75, maxHealth: 100 },
          weapon: { name: 'Shotgun', currentAmmo: 4, maxAmmo: 8, reserveAmmo: 32, isReloading: false },
          score: 1500,
          wave: 3,
          enemiesRemaining: 5
        });
      }).not.toThrow();
    });
  });

  describe('Menu', () => {
    let menu;

    beforeEach(() => {
      menu = new Menu(audio);
    });

    it('should trigger onStart callback when start button is clicked', () => {
      const startSpy = vi.fn();
      menu.onStart(startSpy);

      // Render to register button bounding boxes
      menu.render(mockCtx);

      const startBtn = menu.buttons.find(b => b.id === 'start');
      expect(startBtn).toBeDefined();

      const handled = menu.handleClick(startBtn.x + 10, startBtn.y + 10);
      expect(handled).toBe(true);
      expect(startSpy).toHaveBeenCalled();
    });

    it('should toggle audio when audio button is clicked', () => {
      menu.render(mockCtx);
      const audioBtn = menu.buttons.find(b => b.id === 'audio');
      expect(audioBtn).toBeDefined();

      const isMutedBefore = audio.isMuted();
      menu.handleClick(audioBtn.x + 5, audioBtn.y + 5);
      expect(audio.isMuted()).toBe(!isMutedBefore);
    });
  });

  describe('GameOver', () => {
    let gameOver;

    beforeEach(() => {
      gameOver = new GameOver(audio);
    });

    it('should trigger onRestart callback on restart button click', () => {
      const restartSpy = vi.fn();
      gameOver.onRestart(restartSpy);

      gameOver.render(mockCtx, { score: 2500, wave: 4, enemiesKilled: 22 });
      const restartBtn = gameOver.buttons.find(b => b.id === 'restart');
      expect(restartBtn).toBeDefined();

      const handled = gameOver.handleClick(restartBtn.x + 10, restartBtn.y + 10);
      expect(handled).toBe(true);
      expect(restartSpy).toHaveBeenCalled();
    });

    it('should trigger onMenu callback on main menu button click', () => {
      const menuSpy = vi.fn();
      gameOver.onMenu(menuSpy);

      gameOver.render(mockCtx, { score: 1200 });
      const menuBtn = gameOver.buttons.find(b => b.id === 'menu');
      expect(menuBtn).toBeDefined();

      const handled = gameOver.handleClick(menuBtn.x + 10, menuBtn.y + 10);
      expect(handled).toBe(true);
      expect(menuSpy).toHaveBeenCalled();
    });
  });
});
