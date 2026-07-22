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
  const { user, username, signOut } = useAuth();

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

  // Hardcore removed — all games are permadeath now

  const handleExitToMenu = () => {
    setHasSave(!!loadGame());
    setInGame(false);
  };

  const handleLogout = async () => {
    await signOut();
    // signOut() deletes the local save (see useAuth) so a different account signing in on
    // this device afterward doesn't inherit it — reflect that in the menu's "Continue" state.
    setHasSave(false);
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
      username={username ?? undefined}
      onLoginClick={() => setShowAuth(true)}
      onLogoutClick={handleLogout}
    />
  );
};

export default Index;
