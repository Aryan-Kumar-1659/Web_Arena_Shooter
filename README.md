# Web Arena Shooter — 2D Top-Down Shooter

A modular, browser-based 2D top-down arena shooter built with HTML5 Canvas, Web Audio API, JavaScript ES Modules, and modern web tooling.

---

## 📋 Table of Contents
- [Project Overview](#-project-overview)
- [Tech Stack & Dependencies](#-tech-stack--dependencies)
- [Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [Running the Development Server](#running-the-development-server)
  - [Running Automated Tests](#running-automated-tests)
  - [Building for Production](#building-for-production)
  - [Alternative: Zero-Build Static Server](#alternative-zero-build-static-server)
- [Controls & Gameplay](#-controls--gameplay)
- [Project Structure](#-project-structure)
- [Architecture & Team Roles](#-architecture--team-roles)

---

## 🎯 Project Overview

Web Arena Shooter is an action-packed 2D top-down survival arena shooter. Players navigate a closed arena, aim with the mouse, switch weapons, eliminate enemy waves, collect health and ammo pickups, and compete for high scores.

### Key Features
- **Centralized Asset Loader**: Preloads all canonical image sprites and audio sound effects directly from the `/assets` directory with safe primitive fallbacks if any asset is missing.
- **Dynamic HUD & Menus**: Displays real-time player health, weapon ammo/reserve counters, reload timers, current wave, score counter, audio mute controls, and game-over summary.
- **Spatial Audio Manager**: Handles background music looping, sound effect concurrency limits, hit feedback, pickup sounds, and master volume/mute controls via HTML5 Web Audio API.
- **Modular JavaScript**: Built with standard ES Modules without monolithic framework lock-in.

---

## 🛠 Tech Stack & Dependencies

### Runtime
- **Zero external runtime libraries** — 100% native browser technologies:
  - **HTML5 Canvas 2D API** for rendering graphics, sprites, and particle effects.
  - **Web Audio API & HTML5 Audio** for spatial audio and music playback.
  - **JavaScript ES Modules (`type="module"`)** for clean, decoupled module imports.

### Development Dependencies (`devDependencies`)

| Package | Version | Description & Role |
|---|---|---|
| **[`vite`](https://vitejs.dev/)** | `^6.2.0` | Next-generation frontend build tool and lightning-fast development server with Hot Module Replacement (HMR). |
| **[`vitest`](https://vitest.dev/)** | `^5.0.2` | High-performance, ESM-first unit and integration test runner. |
| **[`happy-dom`](https://github.com/capricorn86/happy-dom)** | `^20.14.5` | Fast, lightweight DOM/Browser environment simulation for executing UI, Audio, and Asset tests in headless Node.js. |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: Version `18.0.0` or higher
- **npm**: Version `9.0.0` or higher

---

### Installation & Setup

1. **Clone or navigate into the repository**:
   ```bash
   cd Web_Arena_Shooter
   ```

2. **Install all dependencies**:
   ```bash
   npm install
   ```

---

### Running the Development Server

Start the local Vite development server with live reload:

```bash
npm run dev
```

- By default, the game will launch automatically at:  
  👉 **`http://localhost:3000`**

---

### Running Automated Tests

Run the Vitest test suite to verify asset loading, audio management, HUD/UI interactions, and integration harnesses:

```bash
# Run all tests once
npm test

# Run tests in interactive watch mode
npm run test:watch
```

---

### Building for Production

Compile and bundle the production build into the `dist/` directory:

```bash
# Build production bundle
npm run build

# Preview the production build locally
npm run preview
```

---

### Alternative: Zero-Build Static Server

Because the game is written in standard ES Modules, it can also be served directly through any static HTTP server:

- **VS Code Live Server**: Right-click [`index.html`](index.html) $\to$ **"Open with Live Server"**.
- **Python Built-in Server**:
  ```bash
  python -m http.server 3000
  ```
- **NPX Static Server**:
  ```bash
  npx serve .
  ```

---

## 🎮 Controls & Gameplay

| Action | Control |
|---|---|
| **Movement** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or <kbd>↑</kbd> <kbd>←</kbd> <kbd>↓</kbd> <kbd>→</kbd> |
| **Aim** | Move the **Mouse** cursor |
| **Shoot** | **Left Mouse Click** / Hold |
| **Switch to Rifle** | <kbd>1</kbd> |
| **Switch to Shotgun** | <kbd>2</kbd> |
| **Reload Weapon** | <kbd>R</kbd> |
| **Test Damage / Flash** | <kbd>K</kbd> (Debug) |
| **Toggle Audio Mute** | Click the **Mute button** on the HUD |

---

## 📁 Project Structure

```text
Web_Arena_Shooter/
├── assets/                  # Canonical game art, sprites, and audio WAV/OGG files
│   ├── player_idle.png
│   ├── player_walk_1.png
│   ├── player_walk_2.png
│   ├── rifle.png
│   ├── shotgun.png
│   ├── bullet.png
│   ├── health_pickup.png
│   ├── ammo_pickup.png
│   ├── arena_floor.png
│   ├── rifle_fire.wav
│   ├── background_music.ogg
│   └── ...
├── src/
│   ├── core/                # Centralized asset loader & engine interfaces
│   │   └── assetLoader.js   # Image & audio preloading with safe primitive fallbacks
│   ├── audio/               # Web Audio system
│   │   └── audioManager.js  # SFX playback, concurrency limiter, music & volume
│   ├── ui/                  # User Interface components
│   │   ├── hud.js           # Health bar, ammo counters, wave/score HUD
│   │   ├── menu.js          # Start menu, instructions & difficulty
│   │   └── gameOver.js      # Game over statistics, high score & restart flow
│   └── main.js              # Game bootstrap and integration harness
├── tests/
│   ├── assets.test.js       # Asset loading & fallback validation
│   ├── audio.test.js        # Audio manager & SFX tests
│   ├── ui.test.js           # HUD and Menu rendering tests
│   └── integration.test.js  # Cross-module communication tests
├── index.html               # Main HTML entry point & Canvas viewport
├── vite.config.js           # Vite dev server and Vitest test runner configuration
├── package.json             # Dependencies, scripts, and project metadata
├── CONTRACT.md              # Technical architecture, schema, and API contracts
├── PRD.md                   # Product Requirements Document
└── TEAM_ROLES.md            # Team module boundaries and ownership breakdown
```

---

## 👥 Architecture & Team Roles

| Member | Module Ownership | Primary Responsibility |
|---|---|---|
| **Member 1** | `lead-core-player` | Core Game Loop, GameState schemas, Input & Player physics |
| **Member 2** | `weapons-combat` | Weapon configurations (Rifle/Shotgun), Bullets & Damage calculation |
| **Member 3** | `enemies-gameplay` | Enemy AI (Basic/Fast/Tank), Waves, Pickups & Scoring |
| **Member 4** | `ui-audio-qa` | UI (Menu/HUD/GameOver), AudioManager, AssetLoader & QA Testing |

Refer to [`CONTRACT.md`](CONTRACT.md) for full interface definitions and merge rules.
