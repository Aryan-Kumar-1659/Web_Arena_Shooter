# Web Arena Shooter — 2D

A lightweight browser-based 2D top-down arena shooter built with vanilla JavaScript (ES Modules) and HTML5 Canvas.

---

## 🚀 How to Run the Game

You can run the game using any standard local static server. **No installation of `node_modules` is required to play!**

### Option 1: VS Code Live Server (Easiest)
1. Open this project folder in **Visual Studio Code**.
2. If not already installed, install the **Live Server** extension (by *Ritwick Dey*).
3. Right-click [`index.html`](index.html) and select **"Open with Live Server"**.
4. The game will automatically open in your default browser at `http://127.0.0.1:5500/index.html`.

---

### Option 2: Using Python (Built-in)
If you have Python installed on your system:

```bash
# Python 3
python -m http.server 3000
```
Then open your browser and navigate to:
```
http://localhost:3000
```

---

### Option 3: Using Node / npx (Zero Installation)
If you have Node.js installed and prefer running without installing dependencies locally:

```bash
npx serve .
```
or
```bash
npx http-server .
```

---

### Option 4: Vite Development Server (Optional for bundling / testing)
If you wish to use the Vite build tool and Vitest test runner:

```bash
# Install development dependencies
npm install

# Start Vite dev server
npm run dev

# Run automated unit tests
npm test

# Build production bundle
npm run build
```

---

## 🎮 Controls

| Action | Control |
|---|---|
| **Move** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or <kbd>↑</kbd> <kbd>←</kbd> <kbd>↓</kbd> <kbd>→</kbd> |
| **Aim** | Move the **Mouse** cursor |
| **Fire** | **Left Mouse Click** |
| **Switch Weapon** | <kbd>1</kbd> (Rifle) / <kbd>2</kbd> (Shotgun) |
| **Reload** | <kbd>R</kbd> |
| **Start / Restart** | <kbd>Space</kbd> / <kbd>Enter</kbd> / Click on canvas |

---

## 📁 Project Structure

```text
Web_Arena_Shooter/
├── assets/             # Runtime sprites, audio, and visual assets
├── src/
│   ├── core/           # Game loop, GameState, input, and collision
│   │   ├── gameLoop.js
│   │   ├── gameState.js
│   │   ├── input.js
│   │   └── collision.js
│   ├── player/         # Player entity, movement physics, and controller
│   │   ├── player.js
│   │   └── playerController.js
│   ├── weapons/        # Weapons and bullet mechanics (Member 2)
│   ├── enemies/        # Enemy AI and spawning (Member 3)
│   ├── gameplay/       # Waves, pickups, and scoring (Member 3)
│   ├── ui/             # HUD and UI menus (Member 4)
│   ├── audio/          # Sound effects and audio management (Member 4)
│   └── main.js         # Core entry point
├── tests/              # Automated unit tests
├── index.html          # Canvas entry container
├── CONTRACT.md         # Technical architecture and data contract
├── PRD.md              # Product requirements document
└── TEAM_ROLES.md       # Team responsibilities breakdown
```

---

## 📖 Specifications & Architecture
- Detailed entity schemas, event contracts, and asset specifications can be found in [`CONTRACT.md`](CONTRACT.md).
- Team roles, ownership, and definitions of done are detailed in [`TEAM_ROLES.md`](TEAM_ROLES.md).
