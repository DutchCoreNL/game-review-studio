import { useState, useEffect } from 'react';
import { GameProvider } from '@/contexts/GameContext';
import { GameLayout } from '@/components/game/GameLayout';
import { MainMenu } from '@/components/game/MainMenu';
import { loadGame, deleteGame } from '@/game/engine';

const Index = () => {
  const [inGame, setInGame] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const [forceNew, setForceNew] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    setHasSave(!!loadGame());
  }, []);

  const handleContinue = () => {
    setForceNew(false);
    setGameKey(k => k + 1);
    setInGame(true);
  };

  const handleNewGame = () => {
    deleteGame();
    setForceNew(true);
    setGameKey(k => k + 1);
    setInGame(true);
  };

  const handleExitToMenu = () => {
    setHasSave(!!loadGame());
    setInGame(false);
  };

  if (inGame) {
    return (
      <GameProvider key={gameKey} onExitToMenu={handleExitToMenu}>
        <GameLayout />
      </GameProvider>
    );
  }

  return (
    <MainMenu
      hasSave={hasSave}
      onContinue={handleContinue}
      onNewGame={handleNewGame}
    />
  );
};

export default Index;
