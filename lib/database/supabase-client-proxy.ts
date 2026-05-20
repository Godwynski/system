export function getCachedAuthSession(): any | null {
  if (typeof window === 'undefined') return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const val = localStorage.getItem(key);
        if (val) {
          const parsed = JSON.parse(val);
          if (parsed && (parsed.user || parsed.currentSession?.user)) {
            return parsed.user || parsed.currentSession?.user;
          }
        }
      }
    }
    const sessionStr = localStorage.getItem('sb-session');
    return sessionStr ? JSON.parse(sessionStr) : null;
  } catch {
    return null;
  }
}

export function cacheAuthSession(userData: any) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('sb-session', JSON.stringify(userData));
  } catch {}
}

class ClientOfflineQueryBuilder {
  private table: string;
  private chain: Array<{ method: string; args: any[] }> = [];

  constructor(table: string) {
    this.table = table;
  }

  select(...args: any[]) {
    this.chain.push({ method: 'select', args });
    return this;
  }
  eq(...args: any[]) {
    this.chain.push({ method: 'eq', args });
    return this;
  }
  neq(...args: any[]) {
    this.chain.push({ method: 'neq', args });
    return this;
  }
  gte(...args: any[]) {
    this.chain.push({ method: 'gte', args });
    return this;
  }
  lte(...args: any[]) {
    this.chain.push({ method: 'lte', args });
    return this;
  }
  ilike(...args: any[]) {
    this.chain.push({ method: 'ilike', args });
    return this;
  }
  order(...args: any[]) {
    this.chain.push({ method: 'order', args });
    return this;
  }
  limit(...args: any[]) {
    this.chain.push({ method: 'limit', args });
    return this;
  }
  range(...args: any[]) {
    this.chain.push({ method: 'range', args });
    return this;
  }
  or(...args: any[]) {
    this.chain.push({ method: 'or', args });
    return this;
  }
  in(...args: any[]) {
    this.chain.push({ method: 'in', args });
    return this;
  }
  single(...args: any[]) {
    this.chain.push({ method: 'single', args });
    return this;
  }
  maybeSingle(...args: any[]) {
    this.chain.push({ method: 'maybeSingle', args });
    return this;
  }

  insert(values: any) {
    this.chain.push({ method: 'insert', args: [values] });
    return this;
  }

  update(values: any) {
    this.chain.push({ method: 'update', args: [values] });
    return {
      eq: (column: string, value: any) => {
        this.chain.push({ method: 'eq', args: [column, value] });
        return this;
      },
      in: (column: string, valuesList: any[]) => {
        this.chain.push({ method: 'in', args: [column, valuesList] });
        return this;
      }
    };
  }

  delete() {
    this.chain.push({ method: 'delete', args: [] });
    return {
      eq: (column: string, value: any) => {
        this.chain.push({ method: 'eq', args: [column, value] });
        return this;
      }
    };
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const response = await fetch('/api/db-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: this.table,
          chain: this.chain
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (onfulfilled) {
        return onfulfilled(result);
      }
      return result;
    } catch (err) {
      if (onrejected) {
        return onrejected(err);
      }
      return { data: null, error: err };
    }
  }
}

export function wrapWithClientOfflineProxy<T extends object>(originalClient: T): T {
  return new Proxy(originalClient, {
    get(target, prop, receiver) {
      // Intercept auth checks
      if (prop === 'auth') {
        const originalAuth = (target as any).auth;
        return new Proxy(originalAuth, {
          get(authTarget, authProp) {
            if (authProp === 'getUser') {
              return async function getUser() {
                const online = typeof window !== 'undefined' ? navigator.onLine : true;
                if (online) {
                  try {
                    const res = await authTarget.getUser();
                    if (res.data?.user) {
                      cacheAuthSession(res.data.user);
                      return res;
                    }
                    const isNetErr = res.error && (
                      res.error.status === 503 ||
                      res.error.name === 'AuthRetryableFetchError' ||
                      res.error.constructor?.name === 'AuthRetryableFetchError' ||
                      String(res.error.message || '').toLowerCase().includes('fetch failed')
                    );
                    if (isNetErr) {
                      const cachedUser = getCachedAuthSession();
                      if (cachedUser) {
                        return { data: { user: cachedUser }, error: null };
                      }
                    }
                    return res;
                  } catch (err) {
                    console.warn('[SUPABASE-CLIENT-PROXY] getUser online request failed, falling back to cache:', err);
                    const cachedUser = getCachedAuthSession();
                    if (cachedUser) {
                      return { data: { user: cachedUser }, error: null };
                    }
                    return { data: { user: null }, error: { message: 'Authentication verification failed due to network status.', status: 400 } };
                  }
                } else {
                  // Offline fallback
                  const cachedUser = getCachedAuthSession();
                  if (cachedUser) {
                    return { data: { user: cachedUser }, error: null };
                  }
                  return { data: { user: null }, error: { message: 'Authentication verification failed due to network status.', status: 400 } };
                }
              };
            }
            if (authProp === 'getSession') {
              return async function getSession() {
                const online = typeof window !== 'undefined' ? navigator.onLine : true;
                if (online) {
                  try {
                    const res = await authTarget.getSession();
                    if (res.data?.session?.user) {
                      return res;
                    }
                    const isNetErr = res.error && (
                      res.error.status === 503 ||
                      res.error.name === 'AuthRetryableFetchError' ||
                      res.error.constructor?.name === 'AuthRetryableFetchError' ||
                      String(res.error.message || '').toLowerCase().includes('fetch failed')
                    );
                    if (isNetErr) {
                      const cachedUser = getCachedAuthSession();
                      if (cachedUser) {
                        return { data: { session: { user: cachedUser } }, error: null };
                      }
                    }
                    return res;
                  } catch (err) {
                    console.warn('[SUPABASE-CLIENT-PROXY] getSession online request failed, falling back to cache:', err);
                    const cachedUser = getCachedAuthSession();
                    if (cachedUser) {
                      return { data: { session: { user: cachedUser } }, error: null };
                    }
                    return { data: { session: null }, error: err };
                  }
                } else {
                  const cachedUser = getCachedAuthSession();
                  if (cachedUser) {
                    return { data: { session: { user: cachedUser } }, error: null };
                  }
                  return { data: { session: null }, error: null };
                }
              };
            }

            if (authProp === 'signInWithPassword') {
              return async function signInWithPassword(credentials: any) {
                const online = typeof window !== 'undefined' ? navigator.onLine : true;
                if (online) {
                  try {
                    const res = await authTarget.signInWithPassword(credentials);
                    if (res.data?.user) {
                      cacheAuthSession(res.data.user);
                      // Sync session to local server
                      await fetch('/api/auth-proxy', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'login', user: res.data.user })
                      });
                      return res;
                    }
                    const isNetErr = res.error && (
                      res.error.status === 503 ||
                      res.error.name === 'AuthRetryableFetchError' ||
                      res.error.constructor?.name === 'AuthRetryableFetchError' ||
                      String(res.error.message || '').toLowerCase().includes('fetch failed')
                    );
                    if (!isNetErr) {
                      return res;
                    }
                    console.warn('[SUPABASE-CLIENT-PROXY] signInWithPassword online returned network error, trying offline fallback:', res.error);
                  } catch (err) {
                    console.warn('[SUPABASE-CLIENT-PROXY] signInWithPassword online failed, trying offline fallback:', err);
                  }
                }

                // Offline auth fallback
                try {
                  const response = await fetch('/api/auth-proxy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'login-offline',
                      email: credentials.email,
                      password: credentials.password
                    })
                  });
                  if (!response.ok) {
                    const errRes = await response.json();
                    return { data: { user: null, session: null }, error: errRes.error || { message: 'Offline authentication failed.' } };
                  }
                  const resData = await response.json();
                  cacheAuthSession(resData.user);
                  return { data: { user: resData.user, session: resData.session }, error: null };
                } catch (err: any) {
                  return { data: { user: null, session: null }, error: { message: err.message || 'Offline authentication network error.' } };
                }
              };
            }

            if (authProp === 'signOut') {
              return async function signOut() {
                const online = typeof window !== 'undefined' ? navigator.onLine : true;
                if (online) {
                  try {
                    await authTarget.signOut();
                  } catch (err) {
                    console.warn('[SUPABASE-CLIENT-PROXY] signOut online failed:', err);
                  }
                }
                
                // Clear locally in server and client
                try {
                  await fetch('/api/auth-proxy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'logout' })
                  });
                } catch {}

                if (typeof window !== 'undefined') {
                  localStorage.removeItem('sb-session');
                  for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
                      localStorage.removeItem(key);
                    }
                  }
                }
                return { error: null };
              };
            }

            return Reflect.get(authTarget, authProp);
          }
        });
      }

      // Intercept database tables queries
      if (prop === 'from') {
        return function from(table: string) {
          // Check if we are running locally in electron
          const isElectron = process.env.ELECTRON_MODE === 'true' || process.env.NEXT_PUBLIC_ELECTRON_MODE === 'true';
          if (isElectron) {
            return new ClientOfflineQueryBuilder(table);
          }
          // If not in Electron, proceed with standard Supabase client
          return (target as any).from(table);
        };
      }

      return Reflect.get(target, prop, receiver);
    }
  }) as T;
}
