/**
 * GridManager.ts — Builds and queries the occupancy grid.
 * Updated to support L-shaped trains via Train.bodyOffsets.
 */

import type {
  Train, OccupancyGrid, CellOccupant, Position, Direction, TrainRole,
} from "../types/game";
import { GRID_SIZE } from "../types/game";

export const DIRECTION_VECTORS: Record<Direction, Position> = {
  up:    { x:  0, y: -1 },
  down:  { x:  0, y:  1 },
  left:  { x: -1, y:  0 },
  right: { x:  1, y:  0 },
};

export class GridManager {
  static buildOccupancy(trains: Train[]): OccupancyGrid {
    const grid: OccupancyGrid = Array.from({ length: GRID_SIZE }, () =>
      Array(GRID_SIZE).fill(null)
    );
    for (const train of trains) {
      for (const { pos, role } of GridManager.getCellsForTrain(train)) {
        if (GridManager.inBounds(pos)) {
          grid[pos.y][pos.x] = { trainId: train.id, role };
        }
      }
    }
    return grid;
  }

  /**
   * Returns every cell the train occupies, in HEAD → TAIL order.
   *
   * STRAIGHT trains (no bodyOffsets): cells trail opposite to direction.
   * BENT trains (bodyOffsets present): cell positions = headPosition + offset[i].
   */
  static getCellsForTrain(train: Train): Array<{ pos: Position; role: TrainRole }> {
    if (train.bodyOffsets && train.bodyOffsets.length > 0) {
      const totalLen = 1 + train.bodyOffsets.length;
      return [
        { pos: { ...train.headPosition }, role: "head" },
        ...train.bodyOffsets.map((offset, i) => ({
          pos: {
            x: train.headPosition.x + offset.x,
            y: train.headPosition.y + offset.y,
          },
          role: (i === totalLen - 2 ? "tail" : "body") as TrainRole,
        })),
      ];
    }

    // Straight train: trail opposite to direction
    const vec = DIRECTION_VECTORS[train.direction];
    const result: Array<{ pos: Position; role: TrainRole }> = [];
    for (let i = 0; i < train.length; i++) {
      result.push({
        pos: {
          x: train.headPosition.x - vec.x * i,
          y: train.headPosition.y - vec.y * i,
        },
        role: i === 0 ? "head" : i === train.length - 1 ? "tail" : "body",
      });
    }
    return result;
  }

  static getOccupantAt(occupancy: OccupancyGrid, pos: Position): CellOccupant | null {
    if (!GridManager.inBounds(pos)) return null;
    return occupancy[pos.y][pos.x];
  }

  static inBounds(pos: Position): boolean {
    return pos.x >= 0 && pos.x < GRID_SIZE && pos.y >= 0 && pos.y < GRID_SIZE;
  }

  static findTrainById(trains: Train[], id: string): Train | undefined {
    return trains.find((t) => t.id === id);
  }

  static getEmptyCells(occupancy: OccupancyGrid): Position[] {
    const empties: Position[] = [];
    for (let y = 0; y < GRID_SIZE; y++)
      for (let x = 0; x < GRID_SIZE; x++)
        if (occupancy[y][x] === null) empties.push({ x, y });
    return empties;
  }

  static debugPrint(occupancy: OccupancyGrid): void {
    console.log(
      occupancy.map(row =>
        row.map(cell => (cell === null ? "." : cell.trainId.charAt(0))).join(" ")
      ).join("\n")
    );
  }
}
