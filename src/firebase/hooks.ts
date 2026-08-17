'use client';

import { useContext, useMemo } from 'react';
import { FirebaseContext, type FirebaseContextState, type AugmentedUser } from './provider';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

/**
 * @interface UserHookResult
 * The return type of the `useUser` hook, providing the user object and loading state.
 */
export interface UserHookResult {
  user: AugmentedUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

/**
 * A custom hook to access the core Firebase services (App, Auth, Firestore)
 * and the user authentication state from the `FirebaseContext`.
 * @throws {Error} If used outside of a `FirebaseProvider`.
 * @returns {FirebaseContextState} The Firebase context, including services and user state.
 */
export const useFirebase = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  return context;
};

/** 
 * A custom hook to conveniently access the Firebase Auth instance.
 * @returns {Auth} The Firebase Auth service object.
 */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  if (!auth) throw new Error('Auth service not available.');
  return auth;
};

/** 
 * A custom hook to conveniently access the Firestore instance.
 * @returns {Firestore} The Firestore service object.
 */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  if (!firestore) throw new Error('Firestore service not available.');
  return firestore;
};

/** 
 * A custom hook to conveniently access the Firebase App instance.
 * @returns {FirebaseApp} The Firebase App instance.
 */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  if (!firebaseApp) throw new Error('Firebase App instance not available.');
  return firebaseApp;
};

/**
 * The primary hook for accessing the current user's state throughout the application.
 * It returns a consolidated user object that includes both authentication details
 * (from Firebase Auth) and profile information (from Firestore), along with the loading status.
 * This is the single source of truth for user data.
 * @returns {UserHookResult} An object containing the augmented user, loading state, and any errors.
 */
export const useUser = (): UserHookResult => {
    const { user, isUserLoading, userError } = useFirebase();
    // Memoize the result to ensure the returned object is stable across re-renders
    // if the underlying user, loading, or error states haven't changed.
    // This is a crucial optimization for components that consume this hook.
    return useMemo(() => ({
        user,
        isUserLoading,
        userError
    }), [user, isUserLoading, userError]);
};

/**
 * A hook that memoizes a Firestore query or document reference.
 * This is critical for performance when using real-time listeners (`useCollection`, `useDoc`)
 * in components that re-render, as it prevents the listener from being re-created unnecessarily.
 * It ensures the query/reference object is stable across renders unless its dependencies change.
 *
 * @param factory A function that returns a Firestore query or document reference.
 * @param deps The dependency array for the useMemo hook. The factory will only re-run if these change.
 * @returns The memoized Firestore query or document reference.
 */
export function useMemoFirebase<T>(factory: () => T | null, deps: React.DependencyList): T | null {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(factory, deps);
}
