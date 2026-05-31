'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session } from '@/lib/types';
import { loadSession, saveSession, clearSession, getDeviceId } from '@/lib/session';
import { getSupabaseBrowser } from '@/lib/supabase/client';

interface SessionContextValue {
  session: Session | null;
  loading: boolean;
  login: (token: string, displayName?: string) => Promise<Session>;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue>({
  session: null,
  loading: true,
  login: async () => {
    throw new Error('SessionProvider manquant');
  },
  logout: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(loadSession());
    setLoading(false);
  }, []);

  const login = useCallback(async (token: string, displayName = 'Participant') => {
    const supabase = getSupabaseBrowser();
    const device_id = getDeviceId();
    const { data, error } = await supabase.rpc('login_with_token', {
      p_token: token,
      p_device_id: device_id,
      p_display_name: displayName,
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error('Jeton invalide');
    const s: Session = {
      user_id: row.user_id,
      family_id: row.family_id,
      family_name: row.family_name,
      family_avatar: row.family_avatar,
      family_color: row.family_color,
      role: row.role,
    };
    saveSession(s);
    setSession(s);
    return s;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  return (
    <SessionContext.Provider value={{ session, loading, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
