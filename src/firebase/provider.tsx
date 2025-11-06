'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { usePathname, useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import type { Professional } from '@/lib/types';
import { isAfter } from 'date-fns';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  professional: Professional | null;
  isAccountActive: boolean | null;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  professional: Professional | null;
  isAccountActive: boolean | null;
}

export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  professional: Professional | null;
  isAccountActive: boolean | null;
}

export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
    professional: null,
    isAccountActive: null,
  });

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth) {
      setUserAuthState(prev => ({ ...prev, isUserLoading: false, userError: new Error("Auth service not provided.") }));
      return;
    }

    setUserAuthState(prev => ({ ...prev, isUserLoading: true }));

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          const professionalRef = doc(firestore, 'professionals', firebaseUser.uid);
          const professionalSnap = await getDoc(professionalRef);
          
          if (professionalSnap.exists()) {
            const professionalData = professionalSnap.data() as Professional;
            const isActive = professionalData.activationExpiresAt ? isAfter(new Date(professionalData.activationExpiresAt), new Date()) : false;
            setUserAuthState({
              user: firebaseUser,
              isUserLoading: false,
              userError: null,
              professional: professionalData,
              isAccountActive: isActive
            });
          } else {
            // New user, professional profile not created yet, considered inactive
             setUserAuthState({
              user: firebaseUser,
              isUserLoading: false,
              userError: null,
              professional: null,
              isAccountActive: false,
            });
          }
        } else {
           setUserAuthState({ user: null, isUserLoading: false, userError: null, professional: null, isAccountActive: null });
        }
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error, professional: null, isAccountActive: null });
      }
    );
    return () => unsubscribe();
  }, [auth, firestore]);

  useEffect(() => {
    if (userAuthState.isUserLoading) {
      return; // Wait until auth state is resolved
    }

    const isUserLoggedIn = !!userAuthState.user;
    const isLoginPage = pathname === '/login';
    const isActivatePage = pathname === '/activate';
    
    if (!isUserLoggedIn && !isLoginPage) {
      router.push('/login');
    } else if (isUserLoggedIn && isLoginPage) {
      router.push('/');
    } else if (isUserLoggedIn && !userAuthState.isAccountActive && !isActivatePage) {
      router.push('/activate');
    } else if (isUserLoggedIn && userAuthState.isAccountActive && isActivatePage) {
        router.push('/');
    }

  }, [userAuthState, pathname, router]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      ...userAuthState
    };
  }, [firebaseApp, firestore, auth, userAuthState]);
  
  const isAuthPage = pathname === '/login' || pathname === '/activate';
  
  // Don't render AppShell on auth pages
  if (isAuthPage) {
      return (
        <FirebaseContext.Provider value={contextValue}>
            <FirebaseErrorListener />
            {children}
        </FirebaseContext.Provider>
      )
  }

  // Show loading for main app content until auth is resolved
  if (userAuthState.isUserLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-2xl font-bold">Carregando...</div>
        </div>
    );
  }

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      <AppShell>{children}</AppShell>
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
    professional: context.professional,
    isAccountActive: context.isAccountActive,
  };
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};
