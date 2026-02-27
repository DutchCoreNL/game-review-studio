import { useState, useEffect } from 'react';
import { GameProvider } from '@/contexts/GameContext';
import { GameLayout } from '@/components/game/GameLayout';
import { MainMenu } from '@/components/game/MainMenu';
import { Auth } from '@/pages/Auth';
import { loadGame, deleteGame } from '@/game/engine';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const [inGame, setInGame] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const [forceNew, setForceNew] = useState(false);
  const [startHardcore, setStartHardcore] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const { user, signOut } = useAuth();

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
    setStartHardcore(false);
    setGameKey(k => k + 1);
    setInGame(true);
  };

  const handleHardcoreStart = () => {
    deleteGame();
    localStorage.setItem('noxhaven_start_hardcore', '1');
    setForceNew(true);
    setStartHardcore(true);
    setGameKey(k => k + 1);
    setInGame(true);
  };

  const handleExitToMenu = () => {
    setHasSave(!!loadGame());
    setInGame(false);
  };

  if (showAuth) {
    return <Auth onBack={() => setShowAuth(false)} onAuth={() => setShowAuth(false)} />;
  }

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
      isLoggedIn={!!user}
      username={user ? undefined : undefined}
      onLoginClick={() => setShowAuth(true)}
      onLogoutClick={signOut}
      onHardcoreStart={handleHardcoreStart}
    />
  );
};

export default Index;
