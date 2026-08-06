'use client';

const STORAGE_KEY = 'arenaos_owner_session';
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface OwnerSession {
  phone: string;
  tournamentId: string;
  teamOwnerId: string;
  name: string;
  createdAt: number;
}

export function saveOwnerSession(session: Omit<OwnerSession, 'createdAt'>): void {
  if (typeof window === 'undefined') return;
  const full: OwnerSession = { ...session, createdAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
}

export function getOwnerSession(): OwnerSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as OwnerSession;
    if (!session.createdAt || Date.now() - session.createdAt > SESSION_MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearOwnerSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
