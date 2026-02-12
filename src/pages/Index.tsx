import { useState, useEffect } from 'react';
import { GameProvider } from '@/contexts/GameContext';
import { GameLayout } from '@/components/game/GameLayout';
import { MainMenu } from '@/components/game/MainMenu';
import { loadGame, deleteGame } from '@/game/engine';

const Index = () => {
  const [inGame, setInGame] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const [forceNew, setForceNew] = useState(false);

  useEffect(() => {
    setHasSave(!!loadGame());
  }, []);

  const handleContinue = () => {
    setForceNew(false);
    setInGame(true);
  };

  const handleNewGame = () => {
    deleteGame();
    setForceNew(true);
    setInGame(true);
  };

  if (inGame) {
    return (
      <GameProvider key={forceNew ? 'new' : 'continue'}>
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
