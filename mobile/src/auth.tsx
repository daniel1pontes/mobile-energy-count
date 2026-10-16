import * as SecureStore from 'expo-secure-store';
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { apiRequest, type SessionResponse, type User } from './api';

type StoredSession = SessionResponse;

// Expo Go may be older than the SDK used by this project. In that case its
// native SecureStore module can reject the call even though the JS package is
// correct. Keep the current session usable and retry secure persistence once
// the Expo Go client is updated.
let volatileSession: StoredSession | null = null;

type AuthContextValue = {
  isLoading: boolean;
  token: string | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  signOut: () => Promise<void>;
};

const sessionKey = 'energia-em-dia-session';
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<StoredSession | null>(null);

  useEffect(() => {
    async function restoreSession() {
      try {
        const stored = await SecureStore.getItemAsync(sessionKey);
        if (stored) {
          const restoredSession = JSON.parse(stored) as StoredSession;
          volatileSession = restoredSession;
          setSession(restoredSession);
        }
      } catch {
        setSession(volatileSession);
      } finally {
        setIsLoading(false);
      }
    }

    void restoreSession();
  }, []);

  async function saveSession(nextSession: StoredSession) {
    volatileSession = nextSession;
    try {
      await SecureStore.setItemAsync(sessionKey, JSON.stringify(nextSession));
    } catch {
      console.warn('SecureStore indisponível neste Expo Go; a sessão será mantida somente enquanto o app estiver aberto.');
    }
    setSession(nextSession);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      token: session?.token ?? null,
      user: session?.user ?? null,
      signIn: async (email, password) => {
        const nextSession = await apiRequest<SessionResponse>('/auth/login', {
          method: 'POST',
          body: { email, password },
        });
        await saveSession(nextSession);
      },
      signUp: async (name, email, password) => {
        const nextSession = await apiRequest<SessionResponse>('/auth/register', {
          method: 'POST',
          body: { name, email, password },
        });
        await saveSession(nextSession);
      },
      updateUser: async (user) => {
        if (!session) {
          return;
        }
        await saveSession({ ...session, user });
      },
      signOut: async () => {
        volatileSession = null;
        try {
          await SecureStore.deleteItemAsync(sessionKey);
        } catch {
          console.warn('Não foi possível remover a sessão persistida do SecureStore.');
        }
        setSession(null);
      },
    }),
    [isLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }
  return context;
}
