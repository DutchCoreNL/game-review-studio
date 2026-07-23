// LOCAL-ONLY STUB.
//
// This game used to be backed by Supabase (auth + edge functions + realtime), simulating
// "other players" server-side. It is now a fully single-player game whose living world is
// simulated locally (see src/game/world/). There is no backend and no network access.
//
// Rather than edit the ~90 call sites that reference `supabase.*`, this module provides a
// safe, chainable no-op stand-in: every query resolves to `{ data: null, error: null }`,
// every edge-function invoke resolves to a soft failure, and realtime channels do nothing.
// Callers already guard with `if (data)` / `data || []`, so they degrade gracefully to their
// local behaviour. Features that genuinely need world data read from GameState.world instead.

type Result = { data: any; error: any };

const OK: Result = { data: null, error: null };

/** A thenable, infinitely-chainable query builder that always resolves to a no-op result. */
function makeQuery(): any {
  const result: Result = { data: null, error: null };
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      // Make it awaitable: `await supabase.from(x).select()` resolves to OK.
      if (prop === 'then') {
        return (resolve: (r: Result) => void) => resolve(result);
      }
      if (prop === 'catch' || prop === 'finally') {
        return () => query;
      }
      // Any query method (select/eq/order/insert/update/delete/single/maybeSingle/...) returns
      // the same chainable proxy so `.from().select().eq().single()` all work.
      return () => query;
    },
  };
  const query = new Proxy(function () {}, handler);
  return query;
}

const noopChannel: any = {
  on() { return noopChannel; },
  subscribe() { return noopChannel; },
  unsubscribe() { return Promise.resolve('ok'); },
  send() { return Promise.resolve('ok'); },
};

export const supabase: any = {
  from() { return makeQuery(); },
  rpc() { return makeQuery(); },
  channel() { return noopChannel; },
  removeChannel() { return Promise.resolve('ok'); },
  removeAllChannels() { return Promise.resolve('ok'); },
  functions: {
    // Edge functions no longer exist — resolve to a soft failure so callers show their
    // "offline"/local fallback rather than crashing.
    invoke() {
      return Promise.resolve({ data: null, error: { message: 'Offline (lokaal spel)' } });
    },
  },
  auth: {
    getUser() { return Promise.resolve({ data: { user: null }, error: null }); },
    getSession() { return Promise.resolve({ data: { session: null }, error: null }); },
    signInAnonymously() { return Promise.resolve({ data: { user: null, session: null }, error: null }); },
    signUp() { return Promise.resolve({ data: { user: null, session: null }, error: null }); },
    signInWithPassword() { return Promise.resolve({ data: { user: null, session: null }, error: null }); },
    signOut() { return Promise.resolve({ error: null }); },
    onAuthStateChange() {
      return { data: { subscription: { unsubscribe() {} } } };
    },
  },
};
