'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Team } from '@/lib/types';

interface AuthContextType {
  currentTeam: Team | null;
  role: 'commissioner' | 'team' | null;
  login: (email: string, password: string, remember?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [role, setRole] = useState<'commissioner' | 'team' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const me = await fetch('/api/auth/me', { credentials: 'include' });
        if (!me.ok) {
          setCurrentTeam(null);
          setRole(null);
          return;
        }
        const { teamId, role: r } = await me.json();
        if (!teamId) return;
        // Fetch full team details
        const teamsRes = await fetch('/api/teams');
        if (teamsRes.ok) {
          const teams: Team[] = await teamsRes.json();
          const team = teams.find(t => t.teamId === teamId) || null;
          setCurrentTeam(team);
          setRole(r);
        }
      } finally {
        setIsLoading(false);
      }
    };
    hydrate();
  }, []);

  const login = async (email: string, password: string, remember: boolean = true): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, remember }),
      });

      if (!response.ok) {
        return false;
      }
      // Hydrate session
      const me = await fetch('/api/auth/me', { credentials: 'include' });
      if (me.ok) {
        const { teamId, role: r } = await me.json();
        console.log('Login successful, teamId:', teamId, 'role:', r);
        const teamsRes = await fetch('/api/teams');
        if (teamsRes.ok) {
          const teams: Team[] = await teamsRes.json();
          console.log('Available teams:', teams.map(t => ({ id: t.teamId, name: t.teamName })));
          const team = teams.find(t => t.teamId === teamId) || null;
          console.log('Found team:', team ? { id: team.teamId, name: team.teamName } : 'null');
          setCurrentTeam(team);
          setRole(r);
        }
      }
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    setCurrentTeam(null);
    setRole(null);
    // Force full page reload to clear all state
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ currentTeam, role, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
