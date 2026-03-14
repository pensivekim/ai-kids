'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getFirebaseAuth } from '../lib/firebase';
import { getUserDoc } from '../lib/auth';
import type { KidsUser } from '../types';

interface AuthCtx {
  firebaseUser: User | null;
  userDoc: KidsUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  firebaseUser: null,
  userDoc: null,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<KidsUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserDoc = async (user: User) => {
    const doc = await getUserDoc(user.uid);
    setUserDoc(doc);
  };

  const refresh = async () => {
    if (firebaseUser) await loadUserDoc(firebaseUser);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      setFirebaseUser(user);
      if (user) {
        await loadUserDoc(user);
      } else {
        setUserDoc(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, userDoc, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
