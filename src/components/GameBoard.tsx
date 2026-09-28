/**
 * GameBoard.tsx — 10×10 grid + train overlay.
 * Passes per-train crash pixel offsets to each TrainTile.
 */

import React from "react";
import { GRID_SIZE, CELL_SIZE_PX } from "../types/game";
import type { Train, AnimationMap, CrashDistanceMap } from "../types/game";
import { TrainTile } from "./TrainTile";

interface GameBoardProps {
  trains: Train[];
  animations: AnimationMap;
  crashDistances: CrashDistanceMap;
  onTrainTap: (trainId: string) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  trains, animations, crashDistances, onTrainTap,
}) => {
  const boardSize = GRID_SIZE * CELL_SIZE_PX;

  return (
    <div
      className="relative mx-auto shadow-2xl rounded-xl overflow-hidden"
      style={{ width: boardSize, height: boardSize }}
      aria-label="Game board"
    >
      {/* Layer 1: decorative grid underlay */}
      <GridUnderlay size={boardSize} />

      {/* Layer 2: train tiles (absolutely positioned) */}
      <div className="absolute inset-0">
        {trains.map((train) => (
          <TrainTile
            key={train.id}
            train={train}
            animationStatus={animations[train.id] ?? "idle"}
            crashDx={crashDistances[train.id]?.x ?? 0}
            crashDy={crashDistances[train.id]?.y ?? 0}
            onTap={onTrainTap}
          />
        ))}
      </div>
    </div>
  );
};

GameBoard.displayName = "GameBoard";

// ─── Grid underlay ────────────────────────────────────────────────────────────

const GridUnderlay: React.FC<{ size: number }> = ({ size }) => (
  <div
    style={{
      width: size, height: size,
      display: "grid",
      gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE_PX}px)`,
      gridTemplateRows:    `repeat(${GRID_SIZE}, ${CELL_SIZE_PX}px)`,
    }}
  >
    {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
      <div key={i} className="border border-slate-700/50 bg-slate-800/80"
           style={{ width: CELL_SIZE_PX, height: CELL_SIZE_PX }} />
    ))}
  </div>
);
