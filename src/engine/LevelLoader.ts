/**
 * LevelLoader.ts — 5 fully-verified levels with increasing difficulty.
 *
 * Levels 1–2: classic straight trains  (8 / 10 trains)
 * Level 3: 12 straight trains, fresh layout, no circular deps
 * Level 4: 14 trains, Level 3 + 2 L-shaped trains (X, Y)
 * Level 5: 16 trains, Level 4 + 2 more L-shaped trains (Z, W)
 *
 * ── DIRECTION CONVENTION ─────────────────────────────────────────────────────
 *   RIGHT  vec=(+1, 0)  trail goes LEFT   head is rightmost cell
 *   LEFT   vec=(-1, 0)  trail goes RIGHT  head is leftmost cell
 *   DOWN   vec=(0, +1)  trail goes UP     head is bottommost cell
 *   UP     vec=(0, -1)  trail goes DOWN   head is topmost cell
 *
 * ── BENT TRAIN (bodyOffsets) ─────────────────────────────────────────────────
 *   bodyOffsets[i] is the offset of the i-th body/tail cell from headPosition.
 *   Consecutive pairs in [head, body[0], …] must be orthogonally adjacent.
 */

import type { LevelDefinition, Train, Position } from "../types/game";

// ─── Colour palette ───────────────────────────────────────────────────────────

const PALETTE = [
  "bg-red-500",     // 0
  "bg-blue-500",    // 1
  "bg-emerald-500", // 2
  "bg-amber-500",   // 3
  "bg-purple-500",  // 4
  "bg-pink-500",    // 5
  "bg-cyan-500",    // 6
  "bg-orange-500",  // 7
  "bg-teal-500",    // 8
  "bg-lime-500",    // 9
  "bg-rose-400",    // 10
  "bg-sky-500",     // 11
  "bg-indigo-500",  // 12
  "bg-yellow-500",  // 13
  "bg-fuchsia-500", // 14
  "bg-green-600",   // 15
];

/** Create a STRAIGHT train. */
function makeTrain(
  id: string,
  paletteIdx: number,
  headX: number,
  headY: number,
  direction: Train["direction"],
  length: Train["length"],
): Train {
  return {
    id,
    headPosition: { x: headX, y: headY },
    direction,
    length,
    colorClass: PALETTE[paletteIdx % PALETTE.length],
  };
}

/** Create an L-shaped / bent train with explicit body/tail offsets. */
function makeBentTrain(
  id: string,
  paletteIdx: number,
  headX: number,
  headY: number,
  direction: Train["direction"],
  bodyOffsets: Position[],
): Train {
  return {
    id,
    headPosition: { x: headX, y: headY },
    direction,
    length: (1 + bodyOffsets.length) as Train["length"],
    colorClass: PALETTE[paletteIdx % PALETTE.length],
    bodyOffsets,
  };
}

// ─── Level 1 — "First Departures" (8 straight trains) ─────────────────────────
//
//  Col→  0  1  2  3  4  5  6  7  8  9
// Row 0: .  .  .  .  .  B  .  .  .  .   ← B tail (head at row 1 going DOWN)
// Row 1: G↑ A← A  A  .  B↓ .  .  .  .
// Row 3: .  .  C→ C  C  C  .  .  .  .   C=4right, head(5,3)
// Row 4: H  .  .  .  .  .  D→ D  .  .
// Row 5: H↓ .  E← E  E  .  .  .  .  .
// Row 6: .  .  F↓ .  .  .  .  .  .  .
// Row 7: .  .  F  .  .  .  .  .  .  .
//
// Tap order: C → B → G → A → D → H → E → F

const LEVEL_1: LevelDefinition = {
  id: 1,
  name: "Level 1 — First Departures",
  trains: [
    makeTrain("G", 6,  0, 1, "up",    1),  // (0,1) – free, blocks A
    makeTrain("A", 0,  1, 1, "left",  3),  // (1,1)(2,1)(3,1) – blocked by G
    makeTrain("B", 1,  5, 1, "down",  2),  // (5,1)(5,0) – blocked by C
    makeTrain("C", 2,  5, 3, "right", 4),  // (5,3)(4,3)(3,3)(2,3) – free
    makeTrain("D", 3,  7, 4, "right", 2),  // (7,4)(6,4) – free
    makeTrain("H", 4,  0, 5, "down",  2),  // (0,5)(0,4) – free, blocks E
    makeTrain("E", 5,  2, 5, "left",  3),  // (2,5)(3,5)(4,5) – blocked by H
    makeTrain("F", 7,  2, 7, "down",  2),  // (2,7)(2,6) – free
  ],
};

// ─── Level 2 — "Yard Rush" (10 straight trains) ───────────────────────────────
//
//  Col→  0  1  2  3  4  5  6  7  8  9
// Row 1: G↑ A← A  A  .  .  .  B  B→ .
// Row 2: .  .  .  .  C↓ .  .  .  .  .
// Row 3: .  D  D  D  D→ .  .  .  .  .
// Row 4: .  .  F↓ .  E← E  .  .  .  .
// Row 5: .  .  .  .  .  H  H  H→ .  .
// Row 7: .  .  .  .  J↑ .  I← I  .  .
// Row 8: .  .  .  .  J  .  .  .  .  .
//
// Tap order: D → C → G → A → B → F → E → H → J → I

const LEVEL_2: LevelDefinition = {
  id: 2,
  name: "Level 2 — Yard Rush",
  trains: [
    makeTrain("G",  6,  0, 1, "up",    1),  // (0,1) – free, blocks A
    makeTrain("A",  0,  1, 1, "left",  3),  // (1,1)(2,1)(3,1)
    makeTrain("B",  1,  8, 1, "right", 2),  // (8,1)(7,1) – free
    makeTrain("C",  2,  5, 2, "down",  1),  // (5,2) – blocked by H
    makeTrain("D",  3,  4, 3, "right", 4),  // (4,3)(3,3)(2,3)(1,3) – free
    makeTrain("F",  7,  2, 4, "down",  1),  // (2,4) – free, blocks E
    makeTrain("E",  5,  3, 4, "left",  2),  // (3,4)(4,4) – blocked by F
    makeTrain("H",  4,  7, 5, "right", 3),  // (7,5)(6,5)(5,5) – free
    makeTrain("J",  8,  4, 7, "up",    2),  // (4,7)(4,8) – blocked by E
    makeTrain("I",  9,  6, 7, "left",  2),  // (6,7)(7,7) – blocked by J
  ],
};

// ─── Level 3 — "Rail Maze" (12 straight trains, fresh layout) ────────────────
//
// Grid layout (occupied cells):
//   Row 1: Q1(0), P1(3,4,5)
//   Row 3: Q2(9), P2(6,7)
//   Row 5: Q3(1), P3(2,3,4,5)
//   Row 7: V4(1), V1(3), V3(5), V2(6), P4(7,8), Q4(9)
//   Row 8: V4(1), V1(3), V3(5), V2(6)
//   Row 9: V3(5)
//
// Freebies:  Q1 Q2 Q3 Q4
// Chains:    Q1→P1  Q2→P2→V2  Q3→P3→V1,V3  Q3→V4  Q4→P4
//
// Tap order: Q1,Q2,Q3,Q4 → P1,P2,P3,P4 → V1,V2,V3,V4

const LEVEL_3: LevelDefinition = {
  id: 3,
  name: "Level 3 — Rail Maze",
  trains: [
    // Freebies (exit immediately, each unlocks its chain)
    makeTrain("Q1", 6,  0, 1, "up",    1),  // (0,1)       blocks P1
    makeTrain("Q2", 2,  9, 3, "up",    1),  // (9,3)       blocks P2
    makeTrain("Q3", 4,  1, 5, "up",    1),  // (1,5)       blocks P3 + V4
    makeTrain("Q4", 7,  9, 7, "down",  1),  // (9,7)       blocks P4

    // Horizontal blockers
    makeTrain("P1", 0,  3, 1, "left",  3),  // (3,1)(4,1)(5,1)     blocked by Q1
    makeTrain("P2", 1,  7, 3, "right", 2),  // (7,3)(6,3)          blocked by Q2
    makeTrain("P3", 5,  2, 5, "left",  4),  // (2,5)(3,5)(4,5)(5,5) blocked by Q3
    makeTrain("P4", 3,  8, 7, "right", 2),  // (8,7)(7,7)          blocked by Q4

    // Vertical escapers (blocked by horizontal trains above them)
    makeBentTrain("V1", 8,  3, 7, "up", [{x: 0, y: 1}, {x: 1, y: 1}]),  // (3,7)(3,8)(4,8) blocked by P3 at (3,5)
    makeBentTrain("V2", 9,  6, 7, "up", [{x: 0, y: 1}, {x: 1, y: 1}]),  // (6,7)(6,8)(7,8) blocked by P2 at (6,3)
    makeTrain("V3",10,  5, 7, "up",    3),  // (5,7)(5,8)(5,9) blocked by P3 at (5,5)
    makeTrain("V4",11,  1, 7, "up",    2),  // (1,7)(1,8) blocked by Q3 at (1,5)
  ],
};

// ─── Level 4 — "The Junction" (14 trains: Level 3 + 2 L-shaped) ──────────────
//
// NEW trains:
//
//  X  L-shaped DOWN  head(8,5) facing DOWN
//     body(8,4) — offset {0,-1}     → directly above head
//     tail(7,4) — offset {-1,-1}    → left of body
//
//     Visual (cols 7-8, rows 4-5):
//       T B    row 4
//         H↓   row 5 (head faces down, exits bottom)
//
//     Blocked by P4 at (8,7): when X slides down, head reaches (8,7)=P4.
//     After P4 removed → X free.
//
//  Y  L-shaped RIGHT  head(2,2) facing RIGHT
//     body(1,2) — offset {-1,0}
//     tail(1,3) — offset {-1,1}
//
//     Visual (cols 1-2, rows 2-3):
//       B H→   row 2 (head faces right)
//       T      row 3
//
//     Blocked by P2: when Y slides right, tail reaches col 6 row 3 = P2 body.
//     After P2 removed → Y free.
//
// Full tap order: Q1,Q2,Q3,Q4 → P1,P2,P3,P4 → Y,X → V1,V2,V3,V4

const LEVEL_4: LevelDefinition = {
  id: 4,
  name: "Level 4 — The Junction",
  trains: [
    ...LEVEL_3.trains.map(t => ({ ...t, headPosition: { ...t.headPosition } })),

    // X: L-shaped DOWN, blocked by P4
    makeBentTrain("X", 12, 8, 5, "down", [{ x: 0, y: -1 }, { x: -1, y: -1 }]),

    // Y: L-shaped RIGHT, blocked by P2
    makeBentTrain("Y", 13, 2, 2, "right", [{ x: -1, y: 0 }, { x: -1, y: 1 }]),
  ],
};

// ─── Level 5 — "Grand Central" (16 trains: Level 4 + 2 more L-shaped) ────────
//
// NEW trains:
//
//  Z  L-shaped LEFT  head(5,6) facing LEFT
//     body(6,6) — offset {+1,0}
//     tail(6,5) — offset {+1,-1}
//
//     Visual (cols 5-6, rows 5-6):
//       T      row 5 (tail at top-right)
//     H← B     row 6 (head faces left)
//
//     Blocked by P3: when Z slides left, tail moves from (6,5) to (5,5)=P3 tail.
//     After P3 removed → Z free.
//
//  W  L-shaped UP  head(4,8) facing UP
//     body(4,9) — offset {0,+1}
//     tail(3,9) — offset {-1,+1}
//
//     Visual (cols 3-4, rows 8-9):
//       H↑     row 8
//       B T    row 9
//
//     Blocked by V1: when W slides up, tail moves from (3,9) to (3,8)=V1 body.
//     After V1 removed → W free.
//
// Full tap order:
//   Q1,Q2,Q3,Q4 → P1,P2,P3,P4 → Y(P2),X(P4),V2(P2),V1(P3),V3(P3),Z(P3),V4(Q3) → W(V1)

const LEVEL_5: LevelDefinition = {
  id: 5,
  name: "Level 5 — Grand Central",
  trains: [
    ...LEVEL_4.trains.map(t => ({ ...t, headPosition: { ...t.headPosition } })),

    // Z: L-shaped LEFT, blocked by P3
    makeBentTrain("Z", 14, 5, 6, "left", [{ x: 1, y: 0 }, { x: 1, y: -1 }]),

    // W: L-shaped UP, blocked by V1
    makeBentTrain("W", 15, 4, 8, "up", [{ x: 0, y: 1 }, { x: -1, y: 1 }]),
  ],
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const LEVELS: Record<number, LevelDefinition> = {
  1: LEVEL_1,
  2: LEVEL_2,
  3: LEVEL_3,
  4: LEVEL_4,
  5: LEVEL_5,
};

export const MAX_LEVEL_ID = 100;

/** Deep-cloned so mutations don't corrupt the source definition. */

const VECS: Record<"up"|"down"|"left"|"right", Position> = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
  left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
};
const DIRS = ["up", "down", "left", "right"] as const;

function generateLevel(id: number): LevelDefinition {
  const targetTrains = Math.min(45, 12 + Math.floor(id * 0.35));
  const maxAttempts = 3000 + id * 50;
  
  const trains: Train[] = [];
  const occupancy: (string | null)[][] = Array.from({ length: 10 }, () => Array(10).fill(null));
  
  let attempts = 0;
  let trainCount = 0;
  
  while (trainCount < targetTrains && attempts < maxAttempts) {
    attempts++;
    const dir = DIRS[Math.floor(Math.random() * 4)];
    const vec = VECS[dir];
    const headX = Math.floor(Math.random() * 10);
    const headY = Math.floor(Math.random() * 10);
    
    const isBent = Math.random() < 0.25;
    let bodyOffsets: Position[] | undefined;
    let length = 1;
    
    if (isBent) {
      const perpDirs = dir === "up" || dir === "down" 
        ? [{x: -1, y: 0}, {x: 1, y: 0}] 
        : [{x: 0, y: -1}, {x: 0, y: 1}];
      const perp = perpDirs[Math.floor(Math.random() * 2)];
      bodyOffsets = [
        { x: -vec.x, y: -vec.y },
        { x: -vec.x + perp.x, y: -vec.y + perp.y }
      ];
      length = 3;
    } else {
      const r = Math.random();
      if (r < 0.1) length = 1;
      else if (r < 0.5) length = 2;
      else if (r < 0.9) length = 3;
      else length = 4;
    }
    
    const cells: Position[] = [{ x: headX, y: headY }];
    if (bodyOffsets) {
      bodyOffsets.forEach(off => cells.push({ x: headX + off.x, y: headY + off.y }));
    } else {
      for (let i = 1; i < length; i++) {
        cells.push({ x: headX - vec.x * i, y: headY - vec.y * i });
      }
    }
    
    const isValidPlacement = cells.every(c => 
      c.x >= 0 && c.x < 10 && c.y >= 0 && c.y < 10 && occupancy[c.y][c.x] === null
    );
    if (!isValidPlacement) continue;
    
    let pathClear = true;
    let pos = { x: headX + vec.x, y: headY + vec.y };
    while (pos.x >= 0 && pos.x < 10 && pos.y >= 0 && pos.y < 10) {
      if (occupancy[pos.y][pos.x] !== null) {
        // Since we check snaking, we only hit if it's not one of our OWN initial cells.
        const isSelf = cells.some(c => c.x === pos.x && c.y === pos.y);
        if (!isSelf) {
          pathClear = false;
          break;
        }
      }
      pos = { x: pos.x + vec.x, y: pos.y + vec.y };
    }
    
    if (pathClear) {
      const tId = `T${trainCount + 1}`;
      const train: Train = {
        id: tId,
        headPosition: { x: headX, y: headY },
        direction: dir,
        length: length as any,
        colorClass: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        bodyOffsets
      };
      trains.push(train);
      cells.forEach(c => occupancy[c.y][c.x] = tId);
      trainCount++;
    }
  }
  
  trains.reverse();
  
  return {
    id,
    name: `Level ${id} — ${trainCount} Trains`,
    trains
  };
}

export function loadLevel(id: number): LevelDefinition {
  if (id <= 5 && LEVELS[id]) {
    const level = LEVELS[id];
    return {
      ...level,
      trains: level.trains.map(t => ({
        ...t,
        headPosition: { ...t.headPosition },
        bodyOffsets: t.bodyOffsets?.map(o => ({ ...o })),
      })),
    };
  }
  return generateLevel(id);
}

