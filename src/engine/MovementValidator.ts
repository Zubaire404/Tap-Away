/**
 * MovementValidator.ts — Snaking-body escape check for any train shape.
 *
 * Trains "snake" along their tracks. This means the body and tail simply follow
 * the path carved by the head. Therefore, to check if a train can escape, we ONLY
 * need to check if the straight path in front of its head is clear.
 */

import type { Train, OccupancyGrid, Position } from "../types/game";
import { GRID_SIZE } from "../types/game";
import { DIRECTION_VECTORS, GridManager } from "./GridManager";

export interface EscapeCheckResult {
  canEscape: boolean;
  blockingTrainIds: string[];
  pathCells: Position[];
}

/**
 * Can the train slide off the board in its facing direction?
 * 
 * Algorithm: Trace a straight line from the head in the train's direction.
 * If any cell is occupied by a different train, it's blocked.
 */
export function canTrainEscape(
  train: Train,
  occupancy: OccupancyGrid
): EscapeCheckResult {
  const vec = DIRECTION_VECTORS[train.direction];
  const blockingIds = new Set<string>();
  const pathCells: Position[] = [];

  let pos = { x: train.headPosition.x + vec.x, y: train.headPosition.y + vec.y };
  
  while (GridManager.inBounds(pos)) {
    const occ = GridManager.getOccupantAt(occupancy, pos);
    // If we hit our own body, it doesn't block us (tail follows head)
    if (occ !== null && occ.trainId !== train.id) {
      blockingIds.add(occ.trainId);
    } else if (occ === null) {
      pathCells.push({ ...pos });
    }
    pos = { x: pos.x + vec.x, y: pos.y + vec.y };
  }

  return {
    canEscape: blockingIds.size === 0,
    blockingTrainIds: Array.from(blockingIds),
    pathCells,
  };
}

/**
 * How many steps until the LAST cell of the straightened train clears the board?
 * When a train escapes, it snaps into an I-shape.
 */
export function calculateExitDistance(train: Train): number {
  const vec = DIRECTION_VECTORS[train.direction];
  // Calculate where the tail of the straightened I-shape would be
  const tailX = train.headPosition.x - vec.x * (train.length - 1);
  const tailY = train.headPosition.y - vec.y * (train.length - 1);

  if (vec.x ===  1) return GRID_SIZE - tailX;
  if (vec.x === -1) return tailX + 1;
  if (vec.y ===  1) return GRID_SIZE - tailY;
  return tailY + 1;
}

/**
 * How many empty steps in front of the head before it hits a blocker?
 */
export function getDistanceToFirstBlocker(
  train: Train,
  occupancy: OccupancyGrid
): number {
  const vec = DIRECTION_VECTORS[train.direction];
  let pos = { x: train.headPosition.x + vec.x, y: train.headPosition.y + vec.y };
  let steps = 0;

  while (GridManager.inBounds(pos)) {
    const occ = GridManager.getOccupantAt(occupancy, pos);
    if (occ !== null && occ.trainId !== train.id) {
      return steps;
    }
    steps++;
    pos = { x: pos.x + vec.x, y: pos.y + vec.y };
  }
  return steps;
}
