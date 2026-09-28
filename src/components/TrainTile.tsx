/**
 * TrainTile.tsx — Renders a single train (any shape: straight or L-shaped).
 *
 * Each cell is absolutely positioned within a bounding-box container.
 * Between adjacent cells a 4 px "bridge" strip covers the shared border
 * so the train reads as one continuous shape.
 *
 * SVG graphics:
 *  • EngineSVG  — top-down locomotive, always drawn facing RIGHT, rotated by CSS
 *  • CarriageSVG — passenger car with windows, couplings, and rail strips
 *  • CornerSVG  — curved track piece for L-shape bends
 *  • TailSVG    — rear car with bright red tail-lights
 */

import React from "react";
import type { Train, TrainAnimationStatus, Position, Direction } from "../types/game";
import { CELL_SIZE_PX } from "../types/game";
import { GridManager, DIRECTION_VECTORS } from "../engine/GridManager";
import { calculateExitDistance } from "../engine/MovementValidator";

// ─── CSS rotation map ─────────────────────────────────────────────────────────
// All SVGs are drawn facing RIGHT.  Rotate to face the requested direction.

const SVG_ROTATE: Record<Direction, string> = {
  right: "rotate(0deg)",
  down:  "rotate(90deg)",
  left:  "rotate(180deg)",
  up:    "rotate(270deg)",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OPP: Record<Direction, Direction> = {
  right: "left", left: "right", up: "down", down: "up",
};

function dirTo(from: Position, to: Position): Direction {
  const dx = to.x - from.x, dy = to.y - from.y;
  if (dx > 0) return "right";
  if (dx < 0) return "left";
  if (dy > 0) return "down";
  return "up";
}

function isHoriz(d: Direction) { return d === "left" || d === "right"; }

function isCornerConn(conns: Direction[]): conns is [Direction, Direction] {
  return conns.length === 2 && isHoriz(conns[0]) !== isHoriz(conns[1]);
}

/** Tailwind rounded class for the exposed leading/trailing edge of a cell. */
const ROUND: Record<Direction, string> = {
  right: "rounded-r-2xl",
  left:  "rounded-l-2xl",
  down:  "rounded-b-2xl",
  up:    "rounded-t-2xl",
};

// ─── SVG components ───────────────────────────────────────────────────────────

/** Locomotive head — top-down view, drawn facing RIGHT. */
const EngineSVG: React.FC<{ direction: Direction }> = ({ direction }) => (
  <svg
    viewBox="0 0 56 56"
    style={{ width: "100%", height: "100%", transform: SVG_ROTATE[direction], transformOrigin: "center" }}
    aria-hidden
  >
    {/* Main body highlight */}
    <rect x="3" y="7" width="43" height="42" rx="5" fill="rgba(255,255,255,0.18)" />

    {/* Boiler drum (left/rear half) */}
    <ellipse cx="16" cy="28" rx="12" ry="18" fill="rgba(0,0,0,0.18)" />
    <ellipse cx="16" cy="28" rx="9"  ry="14" fill="rgba(255,255,255,0.08)" />

    {/* Chimney */}
    <ellipse cx="10" cy="11" rx="5" ry="4"  fill="rgba(0,0,0,0.7)" />
    <ellipse cx="10" cy="11" rx="3" ry="2.5" fill="rgba(10,10,10,0.95)" />
    {/* Chimney smoke puff */}
    <circle cx="10" cy="6" r="3" fill="rgba(200,200,200,0.25)" />
    <circle cx="13" cy="4" r="2" fill="rgba(200,200,200,0.18)" />

    {/* Dome */}
    <circle cx="20" cy="22" r="5" fill="rgba(255,255,255,0.12)" />

    {/* Cab section (center) */}
    <rect x="24" y="7" width="18" height="42" rx="3" fill="rgba(255,255,255,0.08)" />

    {/* Cab windows — two blue panes */}
    <rect x="26" y="10" width="14" height="13" rx="3" fill="rgba(100,195,255,0.92)" />
    <rect x="26" y="10" width="14" height="13" rx="3" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
    <rect x="26" y="33" width="14" height="13" rx="3" fill="rgba(100,195,255,0.92)" />
    <rect x="26" y="33" width="14" height="13" rx="3" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />

    {/* Cowcatcher / nose (RIGHT = front) */}
    <polygon points="42,7 56,14 56,42 42,49" fill="rgba(0,0,0,0.5)" />
    <polygon points="44,12 54,18 54,38 44,44" fill="rgba(255,255,255,0.08)" />

    {/* Headlights — two bright yellow circles */}
    <circle cx="51" cy="17" r="6.5" fill="#FFE000" />
    <circle cx="51" cy="17" r="4"   fill="white" />
    <circle cx="51" cy="17" r="1.5" fill="#FFE000" />
    <circle cx="51" cy="39" r="6.5" fill="#FFE000" />
    <circle cx="51" cy="39" r="4"   fill="white" />
    <circle cx="51" cy="39" r="1.5" fill="#FFE000" />

    {/* Horizontal rail strips (top & bottom) */}
    <rect x="3"  y="3"  width="40" height="4" rx="2" fill="rgba(0,0,0,0.28)" />
    <rect x="3"  y="49" width="40" height="4" rx="2" fill="rgba(0,0,0,0.28)" />

    {/* Wheel hint bumps along sides */}
    <circle cx="11" cy="5"  r="3" fill="rgba(0,0,0,0.22)" />
    <circle cx="22" cy="5"  r="3" fill="rgba(0,0,0,0.22)" />
    <circle cx="33" cy="5"  r="3" fill="rgba(0,0,0,0.22)" />
    <circle cx="11" cy="51" r="3" fill="rgba(0,0,0,0.22)" />
    <circle cx="22" cy="51" r="3" fill="rgba(0,0,0,0.22)" />
    <circle cx="33" cy="51" r="3" fill="rgba(0,0,0,0.22)" />
  </svg>
);

/** Passenger carriage — drawn facing RIGHT (couplings on both ends). */
const CarriageSVG: React.FC<{ direction: Direction }> = ({ direction }) => (
  <svg
    viewBox="0 0 56 56"
    style={{ width: "100%", height: "100%", transform: SVG_ROTATE[direction], transformOrigin: "center" }}
    aria-hidden
  >
    {/* Body */}
    <rect x="4" y="7" width="48" height="42" rx="3" fill="rgba(255,255,255,0.15)" />

    {/* Left coupling */}
    <rect x="0" y="22" width="6" height="12" rx="3" fill="rgba(0,0,0,0.55)" />
    <rect x="1" y="24" width="4" height="8"  rx="1" fill="rgba(180,180,180,0.3)" />

    {/* Right coupling */}
    <rect x="50" y="22" width="6" height="12" rx="3" fill="rgba(0,0,0,0.55)" />
    <rect x="51" y="24" width="4" height="8"  rx="1" fill="rgba(180,180,180,0.3)" />

    {/* Windows — top row */}
    <rect x="8"  y="9"  width="10" height="12" rx="2.5" fill="rgba(100,195,255,0.88)" />
    <rect x="23" y="9"  width="10" height="12" rx="2.5" fill="rgba(100,195,255,0.88)" />
    <rect x="38" y="9"  width="10" height="12" rx="2.5" fill="rgba(100,195,255,0.88)" />

    {/* Windows — bottom row */}
    <rect x="8"  y="35" width="10" height="12" rx="2.5" fill="rgba(100,195,255,0.88)" />
    <rect x="23" y="35" width="10" height="12" rx="2.5" fill="rgba(100,195,255,0.88)" />
    <rect x="38" y="35" width="10" height="12" rx="2.5" fill="rgba(100,195,255,0.88)" />

    {/* Centre door divider */}
    <rect x="4" y="25" width="48" height="6" fill="rgba(0,0,0,0.1)" />

    {/* Rail strips */}
    <rect x="4"  y="3"  width="48" height="4" rx="2" fill="rgba(0,0,0,0.24)" />
    <rect x="4"  y="49" width="48" height="4" rx="2" fill="rgba(0,0,0,0.24)" />

    {/* Wheel bumps */}
    <circle cx="12" cy="5"  r="3" fill="rgba(0,0,0,0.2)" />
    <circle cx="28" cy="5"  r="3" fill="rgba(0,0,0,0.2)" />
    <circle cx="44" cy="5"  r="3" fill="rgba(0,0,0,0.2)" />
    <circle cx="12" cy="51" r="3" fill="rgba(0,0,0,0.2)" />
    <circle cx="28" cy="51" r="3" fill="rgba(0,0,0,0.2)" />
    <circle cx="44" cy="51" r="3" fill="rgba(0,0,0,0.2)" />
  </svg>
);

/**
 * Corner/bend piece — two track arms meeting at 90°.
 * `dirs` = the two connection directions for this cell.
 */
const CornerSVG: React.FC<{ dirs: [Direction, Direction] }> = ({ dirs }) => {
  // Each arm extends from the cell centre to one of its connected edges.
  const ARM: Record<Direction, { x: number; y: number; w: number; h: number }> = {
    right: { x: 27, y: 19, w: 29, h: 18 },
    left:  { x: 0,  y: 19, w: 29, h: 18 },
    down:  { x: 19, y: 27, w: 18, h: 29 },
    up:    { x: 19, y: 0,  w: 18, h: 29 },
  };
  const a1 = ARM[dirs[0]], a2 = ARM[dirs[1]];

  return (
    <svg viewBox="0 0 56 56" style={{ width: "100%", height: "100%" }} aria-hidden>
      {/* Track arm 1 */}
      <rect x={a1.x} y={a1.y} width={a1.w} height={a1.h} rx="4" fill="rgba(255,255,255,0.18)" />
      {/* Track arm 2 */}
      <rect x={a2.x} y={a2.y} width={a2.w} height={a2.h} rx="4" fill="rgba(255,255,255,0.18)" />
      {/* Centre junction fill (smooths the inner corner) */}
      <rect x="19" y="19" width="18" height="18" rx="5" fill="rgba(255,255,255,0.12)" />
      {/* Rail dots at the ends of each arm */}
      {(["right","left","down","up"] as Direction[]).filter(d => dirs.includes(d)).map(d => {
        const pts: Record<Direction, [number,number]> = {
          right:[51,20], left:[5,20], down:[20,51], up:[20,5],
        };
        return (
          <g key={d}>
            <circle cx={pts[d][0]} cy={pts[d][1]} r="2.5" fill="rgba(0,0,0,0.28)" />
            <circle cx={pts[d][0]} cy={pts[d][1]+16} r="2.5" fill="rgba(0,0,0,0.28)" />
          </g>
        );
      })}
    </svg>
  );
};

/** Rear car — red tail-lights on the LEFT side, drawn facing RIGHT. */
const TailSVG: React.FC<{ direction: Direction }> = ({ direction }) => (
  <svg
    viewBox="0 0 56 56"
    style={{ width: "100%", height: "100%", transform: SVG_ROTATE[direction], transformOrigin: "center" }}
    aria-hidden
  >
    {/* Body */}
    <rect x="4" y="7" width="48" height="42" rx="3" fill="rgba(255,255,255,0.15)" />

    {/* Rear end cap (LEFT) */}
    <rect x="0" y="7" width="10" height="42" rx="4" fill="rgba(0,0,0,0.42)" />

    {/* Right coupling */}
    <rect x="50" y="22" width="6" height="12" rx="3" fill="rgba(0,0,0,0.55)" />

    {/* Windows */}
    <rect x="14" y="9"  width="10" height="12" rx="2.5" fill="rgba(100,195,255,0.88)" />
    <rect x="29" y="9"  width="10" height="12" rx="2.5" fill="rgba(100,195,255,0.88)" />
    <rect x="44" y="9"  width="10" height="12" rx="2.5" fill="rgba(100,195,255,0.88)" />
    <rect x="14" y="35" width="10" height="12" rx="2.5" fill="rgba(100,195,255,0.88)" />
    <rect x="29" y="35" width="10" height="12" rx="2.5" fill="rgba(100,195,255,0.88)" />
    <rect x="44" y="35" width="10" height="12" rx="2.5" fill="rgba(100,195,255,0.88)" />

    {/* Centre divider */}
    <rect x="4" y="25" width="48" height="6" fill="rgba(0,0,0,0.1)" />

    {/* Rail strips */}
    <rect x="4"  y="3"  width="48" height="4" rx="2" fill="rgba(0,0,0,0.24)" />
    <rect x="4"  y="49" width="48" height="4" rx="2" fill="rgba(0,0,0,0.24)" />

    {/* Wheel bumps */}
    <circle cx="20" cy="5"  r="3" fill="rgba(0,0,0,0.2)" />
    <circle cx="36" cy="5"  r="3" fill="rgba(0,0,0,0.2)" />
    <circle cx="20" cy="51" r="3" fill="rgba(0,0,0,0.2)" />
    <circle cx="36" cy="51" r="3" fill="rgba(0,0,0,0.2)" />
  </svg>
);

// ─── TrainTile ────────────────────────────────────────────────────────────────

interface TrainTileProps {
  train: Train;
  animationStatus: TrainAnimationStatus;
  crashDx?: number;
  crashDy?: number;
  onTap: (trainId: string) => void;
}

export const TrainTile: React.FC<TrainTileProps> = React.memo(
  ({ train, animationStatus, crashDx = 0, crashDy = 0, onTap }) => {
    const { direction, colorClass, id } = train;

    // Cells in HEAD → TAIL order (not sorted by screen position!)
    const orderedCells = GridManager.getCellsForTrain(train);

    // Per-cell connection directions (toward adjacent train cells)
    const cellConns = orderedCells.map((cell, i) => {
      const dirs: Direction[] = [];
      if (i > 0)
        dirs.push(dirTo(cell.pos, orderedCells[i - 1].pos)); // toward head
      if (i < orderedCells.length - 1)
        dirs.push(dirTo(cell.pos, orderedCells[i + 1].pos)); // toward tail
      return dirs;
    });

    // Bounding box for the container
    const xs  = orderedCells.map(c => c.pos.x);
    const ys  = orderedCells.map(c => c.pos.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);

    // Slide animation
    const exitDist = calculateExitDistance(train);
    const vec      = DIRECTION_VECTORS[direction];
    const slideX   = vec.x * exitDist * CELL_SIZE_PX;
    const slideY   = vec.y * exitDist * CELL_SIZE_PX;

    const animClass =
      animationStatus === "slide"       ? "train-slide"       :
      animationStatus === "crash"       ? "train-crash"       :
      animationStatus === "crash-stay"  ? "train-crash-stay"  : "";

    const isSingle = orderedCells.length === 1;

    // Bridge connector positions (cover the 2-px border between adjacent cells)
    const bridges: Array<{ h: boolean; col: number; row: number }> = [];
    for (let i = 0; i < orderedCells.length - 1; i++) {
      const a = orderedCells[i].pos, b = orderedCells[i + 1].pos;
      if (a.y === b.y) {
        bridges.push({ h: true,  col: Math.min(a.x, b.x), row: a.y });
      } else {
        bridges.push({ h: false, col: a.x, row: Math.min(a.y, b.y) });
      }
    }

    const containerStyle: React.CSSProperties = {
      position:   "absolute",
      left:       minX * CELL_SIZE_PX,
      top:        minY * CELL_SIZE_PX,
      width:      (maxX - minX + 1) * CELL_SIZE_PX,
      height:     (maxY - minY + 1) * CELL_SIZE_PX,
      cursor:     "pointer",
      userSelect: "none",
      zIndex:     animationStatus !== "idle" ? 10 : 1,
      "--slide-x": `${slideX}px`,
      "--slide-y": `${slideY}px`,
      "--crash-x": `${crashDx}px`,
      "--crash-y": `${crashDy}px`,
    } as React.CSSProperties;

    return (
      <div
        style={containerStyle}
        className={animClass}
        onClick={() => onTap(id)}
        role="button"
        tabIndex={0}
        aria-label={`Train ${id}`}
        onKeyDown={e => e.key === "Enter" && onTap(id)}
      >
        {/* ── Individual cells ───────────────────────────────────────────── */}
        {orderedCells.map((cell, i) => {
          const conns   = cellConns[i];
          const isHead  = cell.role === "head";
          const isTail  = cell.role === "tail";
          const isBody  = cell.role === "body";
          const corner  = isBody && isCornerConn(conns);

          // Rounding: exposed ends get a pill-shaped cap
          let roundClass = "";
          if (isSingle) {
            roundClass = "rounded-2xl";
          } else if (isHead) {
            roundClass = ROUND[direction];
          } else if (isTail) {
            // Round on the "back" face = direction from body toward tail
            const backDir = OPP[conns[0]];
            roundClass = ROUND[backDir];
          }

          // Carriage orientation: "toward head" = conns[0] for body/tail
          const carriageDir: Direction = (isTail || isBody) && conns.length > 0
            ? conns[0]   // direction toward head
            : direction;

          // Tail SVG rotation: TailSVG drawn with rear on LEFT.
          // Rotate so the rear faces AWAY from body = opposite of conns[0].
          // In SVG_ROTATE terms: rotate BY conns[0] puts the front (right side)
          // toward the body, rear lights (left side) away. ✓
          const tailSvgDir: Direction = conns[0] ?? direction;

          return (
            <div
              key={i}
              className={`${colorClass} ${roundClass} border-[2px] border-black/30 overflow-hidden`}
              style={{
                position: "absolute",
                left:   (cell.pos.x - minX) * CELL_SIZE_PX,
                top:    (cell.pos.y - minY) * CELL_SIZE_PX,
                width:  CELL_SIZE_PX,
                height: CELL_SIZE_PX,
              }}
            >
              {isHead && <EngineSVG direction={direction} />}
              {isBody && !corner && <CarriageSVG direction={carriageDir} />}
              {isBody && corner  && <CornerSVG dirs={conns as [Direction, Direction]} />}
              {isTail && <TailSVG direction={tailSvgDir} />}
              {/* Single-cell: render as engine (no tail needed) */}
              {isSingle && <EngineSVG direction={direction} />}
            </div>
          );
        })}

        {/* ── Bridge connectors (cover the border gap between cells) ─────── */}
        {bridges.map((b, i) =>
          b.h ? (
            // Horizontal adjacency: vertical bridge strip
            <div
              key={`b${i}`}
              className={colorClass}
              style={{
                position: "absolute",
                left:   (b.col - minX + 1) * CELL_SIZE_PX - 2,
                top:    (b.row - minY)      * CELL_SIZE_PX + 7,
                width:  4,
                height: CELL_SIZE_PX - 14,
              }}
            />
          ) : (
            // Vertical adjacency: horizontal bridge strip
            <div
              key={`b${i}`}
              className={colorClass}
              style={{
                position: "absolute",
                left:   (b.col - minX)      * CELL_SIZE_PX + 7,
                top:    (b.row - minY + 1)  * CELL_SIZE_PX - 2,
                width:  CELL_SIZE_PX - 14,
                height: 4,
              }}
            />
          )
        )}
      </div>
    );
  }
);

TrainTile.displayName = "TrainTile";
