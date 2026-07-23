/** Maps a Supabase auth/db error to a Dutch, user-facing message instead of showing the raw
 * technical error text (e.g. "Failed to fetch") directly in the UI. */
export function getAuthErrorMessage(error: { message?: string } | null | undefined): string {
  const msg = error?.message || '';
  if (!msg || /fetch|network|timeout|ERR_/i.test(msg)) {
    return 'Kan geen verbinding maken met de server. Controleer je internetverbinding en probeer het opnieuw.';
  }
  if (/duplicate|already registered|already exists/i.test(msg)) {
    return 'Deze naam of dit e-mailadres is al in gebruik.';
  }
  if (/invalid login credentials/i.test(msg)) {
    return 'Onjuiste e-mailadres of wachtwoord.';
  }
  if (/email not confirmed/i.test(msg)) {
    return 'Bevestig eerst je e-mailadres via de link die we hebben gestuurd.';
  }
  if (/rate limit|too many requests/i.test(msg)) {
    return 'Te veel pogingen. Wacht even en probeer het opnieuw.';
  }
  return msg;
}
