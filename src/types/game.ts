/**
 * game.ts — Core type definitions for the Tap Away Train Puzzle.
 */

export const GRID_SIZE    = 10;
export const CELL_SIZE_PX = 56;
export const MAX_LIVES    = 3;

export type Direction = "up" | "down" | "left" | "right";

export interface Position {
  x: number; // column (0 = leftmost)
  y: number; // row    (0 = topmost)
}

/**
 * A Train occupies cells starting from `headPosition`.
 *
 * STRAIGHT trains: cells trail in the direction OPPOSITE to `direction`
 *   for `length` cells (existing behaviour when bodyOffsets is absent).
 *
 * BENT / L-SHAPED trains: `bodyOffsets` lists the offset of each body/tail
 *   cell from `headPosition`. Each consecutive pair in the chain
 *   [head, body[0], body[1], …] must be orthogonally adjacent.
 *   Example: head(5,3) RIGHT + bodyOffsets [{x:0,y:1},{x:1,y:1}]
 *            → head(5,3), body(5,4), tail(6,4)  — L-shape
 */
export interface Train {
  id: string;
  headPosition: Position;
  direction: Direction;
  /** Number of cells. For bent trains this equals bodyOffsets.length + 1. */
  length: 1 | 2 | 3 | 4;
  /** Tailwind bg class, e.g. "bg-red-500". */
  colorClass: string;
  /**
   * Optional explicit body/tail cell offsets from headPosition.
   * When present overrides the straight direction+length layout.
   */
  bodyOffsets?: Position[];
}

export type TrainRole = "head" | "body" | "tail";

export interface CellOccupant {
  trainId: string;
  role: TrainRole;
}

export type OccupancyGrid = (CellOccupant | null)[][];

/**
 * Per-train animation status:
 * - "idle"        → no animation
 * - "slide"       → valid escape  (train-slide CSS)
 * - "crash"       → blocked tap, bounces back  (train-crash CSS)
 * - "crash-stay"  → last-life crash, stays at blocker  (train-crash-stay CSS)
 */
export type TrainAnimationStatus = "idle" | "slide" | "crash" | "crash-stay";

export type AnimationMap = Record<string, TrainAnimationStatus>;

export type CrashDistanceMap = Record<string, Position>;

export type GamePhase = "playing" | "crashing" | "game-over" | "won";

export interface GameState {
  trains: Train[];
  occupancy: OccupancyGrid;
  moves: number;
  startTimeMs: number;
  phase: GamePhase;
  animations: AnimationMap;
  lives: number;
  crashDistances: CrashDistanceMap;
  currentLevelId: number;
}

export interface LevelDefinition {
  id: number;
  name: string;
  trains: Train[];
}
