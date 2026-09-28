/**
 * App.tsx — Root component. Manages level state through useGameState().
 */

import React from "react";
import { GameBoard } from "./components/GameBoard";
import { HUD } from "./components/HUD";
import { useGameState } from "./hooks/useGameState";

const App: React.FC = () => {
  const {
    state,
    elapsedSeconds,
    handleTrainTap,
    resetLevel,
    advanceToNextLevel,
    isLastLevel,
  } = useGameState();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 gap-3">
      {/* Title */}
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">🚂 Tap Away</h1>
        <p className="text-slate-400 text-xs mt-1">
          Tap a train to send it off — clear them all to win!
        </p>
      </header>

      {/* HUD: stats bar + overlays */}
      <HUD
        levelName={`Level ${state.currentLevelId}`}
        levelId={state.currentLevelId}
        moves={state.moves}
        elapsedSeconds={elapsedSeconds}
        trainsRemaining={state.trains.length}
        lives={state.lives}
        phase={state.phase}
        isLastLevel={isLastLevel}
        onReset={resetLevel}
        onNextLevel={advanceToNextLevel}
      />

      {/* Board */}
      <main>
        <GameBoard
          trains={state.trains}
          animations={state.animations}
          crashDistances={state.crashDistances}
          onTrainTap={handleTrainTap}
        />
      </main>

      {/* Footer hint */}
      <footer className="text-slate-500 text-xs text-center max-w-sm">
        A train can only leave if its path to the edge is completely clear.
        Wrong tap = crash + lose a life. 3 lives per level.
      </footer>
    </div>
  );
};

export default App;
