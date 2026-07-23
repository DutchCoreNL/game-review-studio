import { deleteGame } from '@/game/engine';

// The game is fully single-player and local — there is no real authentication anymore.
// To keep the many components that guard on `user` working unchanged, we expose a stable
// synthetic local identity instead of null. It never talks to a backend.
export interface LocalUser {
  id: string;
  is_anonymous?: boolean;
}

const LOCAL_USER: LocalUser = { id: 'local-player', is_anonymous: true };

export function useAuth() {
  const signOut = async () => {
    // "Signing out" locally just clears the current save so a fresh player can start over.
    deleteGame();
  };

  return {
    user: LOCAL_USER as LocalUser | null,
    username: null as string | null,
    loading: false,
    signOut,
  };
}
