/**
 * Web Arena Shooter - Main Entry Point & Member 4 Integration Harness
 * Member 4: UI + Audio + Asset/QA Developer
 * 
 * Demonstrates full integration between AssetLoader, AudioManager, HUD, Menu,
 * and GameOver modules with interactive gameplay test harness.
 */

import { assetLoader } from './core/assetLoader.js';
import { audioManager } from './audio/audioManager.js';
import { hud } from './ui/hud.js';
import { menu } from './ui/menu.js';
import { gameOver } from './ui/gameOver.js';

// Game States
export const GameState = {
  LOADING: 'LOADING',
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER'
};

class GameApp {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.state = GameState.LOADING;

    this.lastTime = 0;
    this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, isDown: false };
    this.keys = {};

    // Interactive Test State (Simulating full game for testing UI/Audio/Assets)
    this.player = {
      x: 640,
      y: 360,
      radius: 20,
      speed: 240,
      health: 100,
      maxHealth: 100,
      angle: 0
    };

    this.weapons = {
      rifle: { name: 'Rifle', damage: 25, currentAmmo: 30, maxAmmo: 30, reserveAmmo: 120, fireRate: 0.12, fireTimer: 0, reloadTime: 1.5, isReloading: false, reloadTimer: 0, sfx: 'rifle_fire' },
      shotgun: { name: 'Shotgun', damage: 15, currentAmmo: 8, maxAmmo: 8, reserveAmmo: 48, fireRate: 0.6, fireTimer: 0, reloadTime: 2.2, isReloading: false, reloadTimer: 0, sfx: 'shotgun_fire' }
    };
    this.currentWeaponKey = 'rifle';

    this.score = 0;
    this.wave = 1;
    this.enemiesKilled = 0;
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.pickups = [];

    this._init();
  }

  async _init() {
    this._setupEventListeners();
    this._setupUIHandlers();

    // Progress bar UI elements
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const loadingOverlay = document.getElementById('loading-overlay');

    assetLoader.onProgress((progress, loaded, total) => {
      if (progressBar) progressBar.style.width = `${Math.round(progress * 100)}%`;
      if (progressText) progressText.innerText = `Loading Assets: ${loaded} / ${total}`;
    });

    // Preload canonical assets
    await assetLoader.loadAll();

    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }

    this.state = GameState.MENU;
    requestAnimationFrame((t) => this._gameLoop(t));
  }

  _setupEventListeners() {
    window.addEventListener('resize', () => this._handleResize());
    this._handleResize();

    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;

      // Weapon switching
      if (this.state === GameState.PLAYING) {
        if (e.key === '1') this.currentWeaponKey = 'rifle';
        if (e.key === '2') this.currentWeaponKey = 'shotgun';
        if (e.key.toLowerCase() === 'r') this._startReload();
        // Debug damage trigger (Press K to test damage/flash)
        if (e.key.toLowerCase() === 'k') this._takeDamage(15);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;

      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;

      hud.setCrosshairPosition(this.mouse.x, this.mouse.y);
      menu.setMousePosition(this.mouse.x, this.mouse.y);
      gameOver.setMousePosition(this.mouse.x, this.mouse.y);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.isDown = true;
        this._handleClick(this.mouse.x, this.mouse.y);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouse.isDown = false;
      }
    });

    // Mouse scroll for weapon swap
    this.canvas.addEventListener('wheel', (e) => {
      if (this.state === GameState.PLAYING) {
        this.currentWeaponKey = this.currentWeaponKey === 'rifle' ? 'shotgun' : 'rifle';
      }
    });
  }

  _setupUIHandlers() {
    menu.onStart(() => {
      this.state = GameState.PLAYING;
      this._resetGame();
      audioManager.playMusic('background_music', 0.4);
      audioManager.playSfx('wave_start');
      hud.addFloatingText(`WAVE ${this.wave} BEGINS!`, this.canvas.width / 2, 200, '#38bdf8');
    });

    gameOver.onRestart(() => {
      this.state = GameState.PLAYING;
      this._resetGame();
      audioManager.playMusic('background_music', 0.4);
      audioManager.playSfx('wave_start');
      hud.addFloatingText(`WAVE ${this.wave} BEGINS!`, this.canvas.width / 2, 200, '#38bdf8');
    });

    gameOver.onMenu(() => {
      this.state = GameState.MENU;
      audioManager.stopMusic();
    });
  }

  _handleResize() {
    const container = document.getElementById('game-container');
    if (!container || !this.canvas) return;

    const aspect = 1280 / 720;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let width = windowWidth;
    let height = windowWidth / aspect;

    if (height > windowHeight) {
      height = windowHeight;
      width = windowHeight * aspect;
    }

    this.canvas.style.width = `${Math.floor(width)}px`;
    this.canvas.style.height = `${Math.floor(height)}px`;
  }

  _handleClick(x, y) {
    if (this.state === GameState.MENU) {
      menu.handleClick(x, y);
    } else if (this.state === GameState.GAME_OVER) {
      gameOver.handleClick(x, y);
    }
  }

  _resetGame() {
    this.player.health = 100;
    this.player.x = this.canvas.width / 2;
    this.player.y = this.canvas.height / 2;
    this.score = 0;
    this.wave = 1;
    this.enemiesKilled = 0;
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.pickups = [];

    this.weapons.rifle.currentAmmo = 30;
    this.weapons.rifle.reserveAmmo = 120;
    this.weapons.rifle.isReloading = false;

    this.weapons.shotgun.currentAmmo = 8;
    this.weapons.shotgun.reserveAmmo = 48;
    this.weapons.shotgun.isReloading = false;

    this._spawnWave(this.wave);
  }

  _spawnWave(waveNumber) {
    const count = 4 + waveNumber * 3;
    const types = ['basic', 'fast', 'tank'];

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * (waveNumber > 2 ? 3 : waveNumber > 1 ? 2 : 1))];
      const side = Math.floor(Math.random() * 4);
      let ex = 0, ey = 0;

      if (side === 0) { ex = Math.random() * this.canvas.width; ey = -40; }
      else if (side === 1) { ex = this.canvas.width + 40; ey = Math.random() * this.canvas.height; }
      else if (side === 2) { ex = Math.random() * this.canvas.width; ey = this.canvas.height + 40; }
      else { ex = -40; ey = Math.random() * this.canvas.height; }

      let speed = 90, hp = 30, scoreVal = 100, sprite = 'enemy_basic_idle';
      if (type === 'fast') { speed = 150; hp = 20; scoreVal = 150; sprite = 'enemy_fast_idle'; }
      if (type === 'tank') { speed = 50; hp = 90; scoreVal = 300; sprite = 'enemy_tank_idle'; }

      this.enemies.push({
        x: ex,
        y: ey,
        type,
        speed,
        hp,
        maxHp: hp,
        radius: type === 'tank' ? 26 : 18,
        scoreVal,
        sprite
      });
    }
  }

  _startReload() {
    const cur = this.weapons[this.currentWeaponKey];
    if (!cur || cur.isReloading || cur.currentAmmo === cur.maxAmmo || cur.reserveAmmo <= 0) return;
    cur.isReloading = true;
    cur.reloadTimer = cur.reloadTime;
    hud.addFloatingText('RELOADING', this.player.x, this.player.y - 30, '#f59e0b');
  }

  _fireWeapon() {
    const cur = this.weapons[this.currentWeaponKey];
    if (!cur || cur.isReloading || cur.fireTimer > 0) return;

    if (cur.currentAmmo <= 0) {
      this._startReload();
      return;
    }

    cur.currentAmmo--;
    cur.fireTimer = cur.fireRate;
    audioManager.playSfx(cur.sfx, 0.7);

    const angle = Math.atan2(this.mouse.y - this.player.y, this.mouse.x - this.player.x);

    if (this.currentWeaponKey === 'rifle') {
      const spread = (Math.random() - 0.5) * 0.08;
      this.bullets.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle + spread) * 750,
        vy: Math.sin(angle + spread) * 750,
        damage: cur.damage,
        life: 1.5
      });
    } else if (this.currentWeaponKey === 'shotgun') {
      const pellets = 6;
      for (let i = 0; i < pellets; i++) {
        const spread = (Math.random() - 0.5) * 0.35;
        this.bullets.push({
          x: this.player.x,
          y: this.player.y,
          vx: Math.cos(angle + spread) * (600 + Math.random() * 150),
          vy: Math.sin(angle + spread) * (600 + Math.random() * 150),
          damage: cur.damage,
          life: 0.7
        });
      }
    }
  }

  _takeDamage(amount) {
    this.player.health = Math.max(0, this.player.health - amount);
    hud.triggerDamageFlash();
    hud.addFloatingText(`-${amount}`, this.player.x, this.player.y - 20, '#ef4444');
    audioManager.playSfx('player_hit');

    if (this.player.health <= 0) {
      this.state = GameState.GAME_OVER;
      audioManager.stopMusic();
    }
  }

  _gameLoop(time) {
    const deltaTime = Math.min(0.1, (time - this.lastTime) / 1000 || 0);
    this.lastTime = time;

    this._update(deltaTime);
    this._render();

    requestAnimationFrame((t) => this._gameLoop(t));
  }

  _update(deltaTime) {
    hud.update(deltaTime);

    if (this.state !== GameState.PLAYING) return;

    // 1. Player Movement
    let dx = 0;
    let dy = 0;
    if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dx += 1;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    this.player.x += dx * this.player.speed * deltaTime;
    this.player.y += dy * this.player.speed * deltaTime;

    // Arena bounds
    this.player.x = Math.max(this.player.radius, Math.min(this.canvas.width - this.player.radius, this.player.x));
    this.player.y = Math.max(this.player.radius, Math.min(this.canvas.height - this.player.radius, this.player.y));

    // Player aim angle
    this.player.angle = Math.atan2(this.mouse.y - this.player.y, this.mouse.x - this.player.x);

    // 2. Weapon Timers & Firing
    const curWep = this.weapons[this.currentWeaponKey];
    if (curWep.fireTimer > 0) curWep.fireTimer -= deltaTime;

    if (curWep.isReloading) {
      curWep.reloadTimer -= deltaTime;
      if (curWep.reloadTimer <= 0) {
        curWep.isReloading = false;
        const needed = curWep.maxAmmo - curWep.currentAmmo;
        const available = Math.min(needed, curWep.reserveAmmo);
        curWep.currentAmmo += available;
        curWep.reserveAmmo -= available;
      }
    }

    if (this.mouse.isDown) {
      this._fireWeapon();
    }

    // 3. Bullets update & collision
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * deltaTime;
      b.y += b.vy * deltaTime;
      b.life -= deltaTime;

      if (b.life <= 0 || b.x < 0 || b.x > this.canvas.width || b.y < 0 || b.y > this.canvas.height) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Hit enemy?
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        const dist = Math.hypot(b.x - e.x, b.y - e.y);
        if (dist < e.radius + 6) {
          e.hp -= b.damage;
          audioManager.playSfx('enemy_hit', 0.5);
          hud.addFloatingText(`${b.damage}`, e.x, e.y - 15, '#fbbf24');
          this.bullets.splice(i, 1);

          if (e.hp <= 0) {
            audioManager.playSfx('enemy_death', 0.6);
            this.score += e.scoreVal;
            this.enemiesKilled++;
            hud.addFloatingText(`+${e.scoreVal}`, e.x, e.y - 30, '#4ade80');

            // Chance to drop health or ammo pickup
            const dropRoll = Math.random();
            if (dropRoll < 0.25) {
              this.pickups.push({ x: e.x, y: e.y, type: 'health', radius: 14 });
            } else if (dropRoll < 0.55) {
              this.pickups.push({ x: e.x, y: e.y, type: 'ammo', radius: 14 });
            }

            this.enemies.splice(j, 1);
          }
          break;
        }
      }
    }

    // 4. Enemies AI
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
      e.x += Math.cos(angle) * e.speed * deltaTime;
      e.y += Math.sin(angle) * e.speed * deltaTime;

      // Enemy hit player
      const dist = Math.hypot(this.player.x - e.x, this.player.y - e.y);
      if (dist < this.player.radius + e.radius) {
        this._takeDamage(e.type === 'tank' ? 25 : 12);
        // Push back
        e.x -= Math.cos(angle) * 30;
        e.y -= Math.sin(angle) * 30;
      }
    }

    // 5. Pickups collection
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      const dist = Math.hypot(this.player.x - p.x, this.player.y - p.y);
      if (dist < this.player.radius + p.radius) {
        if (p.type === 'health' && this.player.health < this.player.maxHealth) {
          this.player.health = Math.min(this.player.maxHealth, this.player.health + 35);
          audioManager.playSfx('pickup_health');
          hud.addFloatingText('+35 HP', this.player.x, this.player.y - 20, '#ec4899');
          this.pickups.splice(i, 1);
        } else if (p.type === 'ammo') {
          this.weapons.rifle.reserveAmmo += 45;
          this.weapons.shotgun.reserveAmmo += 16;
          audioManager.playSfx('pickup_ammo');
          hud.addFloatingText('+AMMO', this.player.x, this.player.y - 20, '#eab308');
          this.pickups.splice(i, 1);
        }
      }
    }

    // 6. Wave progression
    if (this.enemies.length === 0) {
      this.wave++;
      audioManager.playSfx('wave_start');
      hud.addFloatingText(`WAVE ${this.wave}`, this.canvas.width / 2, 200, '#38bdf8');
      this._spawnWave(this.wave);
    }
  }

  _render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.state === GameState.PLAYING || this.state === GameState.GAME_OVER) {
      // 1. Arena Floor
      this._renderArena();

      // 2. Pickups
      this._renderPickups();

      // 3. Bullets
      this._renderBullets();

      // 4. Enemies
      this._renderEnemies();

      // 5. Player
      this._renderPlayer();

      // 6. HUD (Always render in playing / game over background)
      const curWep = this.weapons[this.currentWeaponKey];
      hud.render(this.ctx, {
        canvasWidth: this.canvas.width,
        canvasHeight: this.canvas.height,
        player: this.player,
        weapon: {
          name: curWep.name,
          currentAmmo: curWep.currentAmmo,
          maxAmmo: curWep.maxAmmo,
          reserveAmmo: curWep.reserveAmmo,
          isReloading: curWep.isReloading,
          reloadProgress: curWep.isReloading ? (1 - curWep.reloadTimer / curWep.reloadTime) : 0
        },
        score: this.score,
        wave: this.wave,
        enemiesRemaining: this.enemies.length
      });
    }

    // State Overlays
    if (this.state === GameState.MENU) {
      menu.render(this.ctx);
    } else if (this.state === GameState.GAME_OVER) {
      gameOver.render(this.ctx, {
        score: this.score,
        wave: this.wave,
        enemiesKilled: this.enemiesKilled
      });
    }
  }

  _renderArena() {
    const floor = assetLoader.getImage('arena_floor');
    if (floor && floor.width) {
      const ptrn = this.ctx.createPattern(floor, 'repeat');
      if (ptrn) {
        this.ctx.fillStyle = ptrn;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        return;
      }
    }

    // Procedural Arena Floor
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = '#1e293b';
    this.ctx.lineWidth = 1;
    const sz = 64;
    for (let x = 0; x < this.canvas.width; x += sz) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += sz) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  _renderPickups() {
    for (const p of this.pickups) {
      const imgKey = p.type === 'health' ? 'health_pickup' : 'ammo_pickup';
      const img = assetLoader.getImage(imgKey);
      if (img) {
        try {
          this.ctx.drawImage(img, p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
        } catch (e) {
          this._drawFallbackPickup(p);
        }
      } else {
        this._drawFallbackPickup(p);
      }
    }
  }

  _drawFallbackPickup(p) {
    this.ctx.fillStyle = p.type === 'health' ? '#ec4899' : '#eab308';
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  _renderBullets() {
    this.ctx.fillStyle = '#fbbf24';
    for (const b of this.bullets) {
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  _renderEnemies() {
    for (const e of this.enemies) {
      this.ctx.save();
      this.ctx.translate(e.x, e.y);
      const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
      this.ctx.rotate(angle);

      const sprite = assetLoader.getImage(e.sprite);
      if (sprite) {
        try {
          this.ctx.drawImage(sprite, -e.radius, -e.radius, e.radius * 2, e.radius * 2);
        } catch (err) {
          this._drawFallbackEnemy(e);
        }
      } else {
        this._drawFallbackEnemy(e);
      }

      this.ctx.restore();

      // Enemy HP Bar
      if (e.hp < e.maxHp) {
        const bw = 32;
        this.ctx.fillStyle = '#334155';
        this.ctx.fillRect(e.x - bw / 2, e.y - e.radius - 8, bw, 4);
        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillRect(e.x - bw / 2, e.y - e.radius - 8, bw * (e.hp / e.maxHp), 4);
      }
    }
  }

  _drawFallbackEnemy(e) {
    this.ctx.fillStyle = e.type === 'tank' ? '#7c3aed' : e.type === 'fast' ? '#f59e0b' : '#ef4444';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  _renderPlayer() {
    this.ctx.save();
    this.ctx.translate(this.player.x, this.player.y);
    this.ctx.rotate(this.player.angle);

    const sprite = assetLoader.getImage(this.mouse.isDown ? 'player_shoot' : 'player_idle');
    if (sprite) {
      try {
        this.ctx.drawImage(sprite, -this.player.radius, -this.player.radius, this.player.radius * 2, this.player.radius * 2);
      } catch (e) {
        this._drawFallbackPlayer();
      }
    } else {
      this._drawFallbackPlayer();
    }

    this.ctx.restore();
  }

  _drawFallbackPlayer() {
    this.ctx.fillStyle = '#10b981';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Gun nozzle
    this.ctx.fillStyle = '#334155';
    this.ctx.fillRect(this.player.radius * 0.5, -4, 14, 8);
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});
