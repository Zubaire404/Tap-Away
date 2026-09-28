# Tap Away: Train Edition 🚂

A 2D rail puzzle game inspired by Tap Away, featuring multi-tile straight and L-shaped trains. Untangle railway jams, avoid collisions with a 3-heart life system, and clear 100 guaranteed-solvable levels with procedural scaling, procedural Web Audio SFX, and sleek SVG visuals. Built with React, TypeScript, and Tailwind CSS.

---

## 🎮 Gameplay & Features

- **Tap to Depart:** Tap a train to send it along its tracks. The front locomotive engine features glowing headlights indicating travel direction.
- **Snaking Navigation:** When cleared to move, trains follow their tracks forward, straightening out as they exit the board.
- **3-Heart Life System:** If a train's path is blocked, it collides with a crunching impact sound and bounces back to its position, costing 1 Heart. Losing all 3 hearts triggers a Game Over with a retry option.
- **100 Solvable Levels:**
  - **Levels 1–5:** Handcrafted introductory stages introducing straight lines, intersecting paths, and corner bends.
  - **Levels 6–100:** Dynamically generated using a reverse-simulation (LIFO) algorithm that guarantees 100% solvability with zero circular deadlocks. Difficulty and density progressively increase.
- **Custom Top-Down SVG Graphics:** Hand-crafted SVG locomotives, passenger cars, couplings, and curved track pieces.
- **Zero-Dependency Web Audio Synthesizer:** Real-time procedural audio synthesis for train horns (multi-tone Nathan K3LA chords), crash impacts, level victory arpeggios, and game over sequences.

---

## 🛠️ Tech Stack

- **Framework:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Audio:** Web Audio API (Native browser synthesis)
- **Bundler:** Vite

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `yarn` / `pnpm`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Zubaire404/Tap-Away.git
   cd Tap-Away
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```text
   http://localhost:5173
   ```

### Production Build

```bash
npm run build
npm run preview
```

---

## 📄 License

MIT
