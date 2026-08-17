
'use client';

import React, { createContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';

// --- Type Definitions ---

/**
 * @interface FirebaseProviderProps
 * Props for the main Firebase provider component.
 */
interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

/**
 * @interface UserProfile
 * Represents the custom data stored for a user in Firestore.
 */
interface UserProfile {
  id: string;
  isSubscribed?: boolean;
  isAdmin?: boolean;
  [key: string]: any; // Allow other properties
}

/**
 * @interface AugmentedUser
 * Combines the Firebase Auth User with the custom Firestore UserProfile.
 * This is the user object that will be exposed throughout the app via the `useUser` hook.
 */
export type AugmentedUser = User & UserProfile;

/**
 * @interface UserAuthState
 * Internal state for managing the user's authentication and profile data.
 */
interface UserAuthState {
  user: AugmentedUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

/**
 * @interface FirebaseContextState
 * The complete shape of the context value provided by FirebaseProvider.
 */
export interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: AugmentedUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// --- Context Definition ---

/**
 * @constant FirebaseContext
 * The React context that provides Firebase services and user state to the application.
 */
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);


// --- Provider Component ---

/**
 * The main provider component that initializes Firebase services and manages user state.
 * It listens for authentication changes and fetches the corresponding user profile from Firestore,
 * making a single, consolidated user object available to the entire application.
 * @param {FirebaseProviderProps} props - The props for the provider.
 * @returns {React.ReactElement} The provider component.
 */
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
  });

  /**
   * This `useEffect` is the core of the user authentication and data hydration logic.
   * It sets up a listener for Firebase Auth state changes (`onAuthStateChanged`).
   * When a user signs in, it then sets up a *second*, real-time listener (`onSnapshot`)
   * for that user's profile document in Firestore.
   *
   * By combining the auth data and Firestore data into a single `AugmentedUser` object,
   * we provide a complete and consistent user state to the entire app, preventing the need
   * for components to fetch this data individually.
   */
  useEffect(() => {
    if (!auth || !firestore) {
      setUserAuthState({ user: null, isUserLoading: false, userError: null });
      return;
    }
    let unsubscribeFromProfile: (() => void) | null = null;

    // Listen for changes in authentication state (login/logout).
    const unsubscribeFromAuth = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        // If the user logs out, clean up any profile listeners and reset the state.
        if (!firebaseUser) {
          if (unsubscribeFromProfile) unsubscribeFromProfile();
          setUserAuthState({ user: null, isUserLoading: false, userError: null });
          return;
        }

        // If a user is logged in, start listening for their profile data in Firestore.
        const profileRef = doc(firestore, 'users', firebaseUser.uid);
        unsubscribeFromProfile = onSnapshot(
          profileRef,
          (profileSnap) => {
            if (!profileSnap.exists()) {
                // If the profile doesn't exist yet, just use the auth user data.
                // This can happen for a brand new user before their doc is created.
                setUserAuthState({ 
                    user: firebaseUser as AugmentedUser, // Cast for consistency
                    isUserLoading: false, 
                    userError: null 
                });
                return;
            }
            // Combine auth user data with Firestore profile data.
            const augmentedUser: AugmentedUser = {
              ...firebaseUser, // Spread properties from the auth user (uid, email, etc.)
              id: profileSnap.id,
              ...(profileSnap.data() as Omit<UserProfile, 'id'>), // Spread data from Firestore doc
            };
             setUserAuthState({ user: augmentedUser, isUserLoading: false, userError: null });
          },
          (error) => {
            // Handle errors fetching the profile (e.g., permissions).
            console.error("Error fetching user profile:", error);
            setUserAuthState({ user: firebaseUser as AugmentedUser, isUserLoading: false, userError: error });
          }
        );
      },
      (error) => {
        // Handle errors with the auth listener itself.
        console.error("Firebase auth state error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );

    // Cleanup function to unsubscribe from both listeners when the provider unmounts.
    return () => {
      unsubscribeFromAuth();
      if (unsubscribeFromProfile) {
        unsubscribeFromProfile();
      }
    };
  }, [auth, firestore]);

  /**
   * Memoize the context value to prevent unnecessary re-renders of consumers
   * when the provider's internal state changes but the context value itself has not.
   */
  const contextValue = useMemo((): FirebaseContextState => ({
      firebaseApp,
      firestore,
      auth,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
  }), [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};
