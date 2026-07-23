// The player's display handle for the local world (leaderboard, chat, etc.). Stored locally
// since there's no account system — purely cosmetic identity.

const KEY = 'noxhaven_nickname';

export function getNickname(): string {
  try {
    return localStorage.getItem(KEY) || 'Jij';
  } catch {
    return 'Jij';
  }
}

export function setNickname(name: string): void {
  try {
    const clean = name.trim().slice(0, 20);
    if (clean) localStorage.setItem(KEY, clean);
  } catch {
    /* ignore storage errors */
  }
}
