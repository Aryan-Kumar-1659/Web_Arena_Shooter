/**
 * @file input.js
 * @description Input management for keyboard and mouse events mapped to Canvas coordinate space.
 * Owned by Member 1 (Team Lead + Core Engine + Player).
 */

export class InputManager {
  /**
   * @param {HTMLCanvasElement} [canvas] Optional canvas element to bind mouse events to
   */
  constructor(canvas = null) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouse = {
      x: 0,
      y: 0,
      isDown: false,
      isRightDown: false,
      clicked: false
    };

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onContextMenu = this._onContextMenu.bind(this);

    if (canvas) {
      this.attach(canvas);
    }
  }

  /**
   * Attach keyboard and mouse event listeners.
   * @param {HTMLCanvasElement} canvas
   */
  attach(canvas) {
    this.canvas = canvas;
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);

    if (canvas) {
      canvas.addEventListener('mousemove', this._onMouseMove);
      canvas.addEventListener('mousedown', this._onMouseDown);
      canvas.addEventListener('mouseup', this._onMouseUp);
      canvas.addEventListener('contextmenu', this._onContextMenu);
    }
  }

  /**
   * Detach all event listeners.
   */
  detach() {
    if (typeof window === 'undefined') return;

    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);

    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this._onMouseMove);
      this.canvas.removeEventListener('mousedown', this._onMouseDown);
      this.canvas.removeEventListener('mouseup', this._onMouseUp);
      this.canvas.removeEventListener('contextmenu', this._onContextMenu);
    }
    this.keys.clear();
  }

  /**
   * Returns true if a key is currently pressed.
   * Supports key code strings (e.g. 'KeyW', 'ArrowUp') or key names ('w', 'W').
   * @param {string} key
   * @returns {boolean}
   */
  isKeyDown(key) {
    const lower = key.toLowerCase();
    return this.keys.has(key) || this.keys.has(lower) || this.keys.has(key.toUpperCase());
  }

  /**
   * Computes normalized 2D movement vector from WASD/Arrow keys.
   * @returns {{ x: number, y: number, isMoving: boolean }}
   */
  getMovementVector() {
    let dx = 0;
    let dy = 0;

    // Horizontal input (A / D / Left / Right)
    if (this.isKeyDown('a') || this.isKeyDown('arrowleft') || this.isKeyDown('KeyA')) {
      dx -= 1;
    }
    if (this.isKeyDown('d') || this.isKeyDown('arrowright') || this.isKeyDown('KeyD')) {
      dx += 1;
    }

    // Vertical input (W / S / Up / Down)
    if (this.isKeyDown('w') || this.isKeyDown('arrowup') || this.isKeyDown('KeyW')) {
      dy -= 1;
    }
    if (this.isKeyDown('s') || this.isKeyDown('arrowdown') || this.isKeyDown('KeyS')) {
      dy += 1;
    }

    // Normalize diagonal movement vector
    if (dx !== 0 && dy !== 0) {
      const length = Math.SQRT2; // Math.sqrt(1 + 1)
      dx /= length;
      dy /= length;
    }

    return {
      x: dx,
      y: dy,
      isMoving: dx !== 0 || dy !== 0
    };
  }

  /**
   * Convert client window coordinates to Canvas coordinate space.
   * @private
   */
  _updateMousePosition(event) {
    if (!this.canvas) {
      this.mouse.x = event.clientX ?? 0;
      this.mouse.y = event.clientY ?? 0;
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / (rect.width || this.canvas.width);
    const scaleY = this.canvas.height / (rect.height || this.canvas.height);

    this.mouse.x = (event.clientX - rect.left) * scaleX;
    this.mouse.y = (event.clientY - rect.top) * scaleY;
  }

  _onKeyDown(e) {
    this.keys.add(e.code);
    this.keys.add(e.key.toLowerCase());
  }

  _onKeyUp(e) {
    this.keys.delete(e.code);
    this.keys.delete(e.key.toLowerCase());
  }

  _onMouseMove(e) {
    this._updateMousePosition(e);
  }

  _onMouseDown(e) {
    this._updateMousePosition(e);
    if (e.button === 0) {
      this.mouse.isDown = true;
      this.mouse.clicked = true;
    } else if (e.button === 2) {
      this.mouse.isRightDown = true;
    }
  }

  _onMouseUp(e) {
    this._updateMousePosition(e);
    if (e.button === 0) {
      this.mouse.isDown = false;
    } else if (e.button === 2) {
      this.mouse.isRightDown = false;
    }
  }

  _onContextMenu(e) {
    e.preventDefault();
  }

  /**
   * Reset single-frame transient states like clicks.
   */
  endFrame() {
    this.mouse.clicked = false;
  }
}
