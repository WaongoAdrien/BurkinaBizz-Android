// lib/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../types';

// ── Put your Firebase Auth UID here after you first sign in as admin ──────────
// In Firebase Console → Authentication → copy your UID → paste below
export const ADMIN_UID = 'YOUR_ADMIN_UID_HERE';
// ─────────────────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  isAdmin: boolean;
  isPending: boolean;
  isApprovedVendor: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      // Unsubscribe previous profile listener
      if (profileUnsub) { profileUnsub(); profileUnsub = null; }

      if (firebaseUser) {
        // Real-time listener so role changes (pending→vendor) reflect immediately
        profileUnsub = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (snap) => {
            if (snap.exists()) {
              setUserProfile(snap.data() as User);
            }
            setLoading(false);
          },
          () => setLoading(false)
        );
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // New signups are PENDING until admin approves
  const signUp = async (email: string, password: string, name: string, phone: string) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(newUser, { displayName: name });

    // Check if this UID is the designated admin
    const role = newUser.uid === ADMIN_UID ? 'admin' : 'pending';

    const profile: User = {
      uid: newUser.uid,
      name,
      email,
      phone,
      role,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', newUser.uid), profile);
    setUserProfile(profile);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserProfile(null);
  };

  const isAdmin = userProfile?.role === 'admin';
  const isPending = userProfile?.role === 'pending';
  const isApprovedVendor = userProfile?.role === 'vendor' || isAdmin;

  return (
    <AuthContext.Provider value={{
      user, userProfile, loading,
      isAdmin, isPending, isApprovedVendor,
      signIn, signUp, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
