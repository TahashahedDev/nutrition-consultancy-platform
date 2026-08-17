
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, initializeAuth, browserLocalPersistence } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore
} from 'firebase/firestore'

if (typeof self !== 'undefined' && process.env.NODE_ENV === 'development') {
  (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

type FirebaseServices = {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

let firebaseServices: FirebaseServices | null = null;

export function initializeFirebase(): FirebaseServices {
  if (firebaseServices) {
    return firebaseServices;
  }

  const isInitialized = getApps().length > 0;
  const app = isInitialized ? getApp() : initializeApp(firebaseConfig);
  
  let firestore: Firestore;
  try {
     firestore = isInitialized
      ? getFirestore(app)
      : initializeFirestore(app, {
          localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
        });
  } catch(e) {
    firestore = getFirestore(app);
  }

  const auth = isInitialized 
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: browserLocalPersistence
      });
  
  firebaseServices = {
    firebaseApp: app,
    auth: auth,
    firestore: firestore,
  };
  
  return firebaseServices;
}

export * from './provider';
export * from './client-provider';
export * from './firestore/data';
export * from './errors';
export * from './error-emitter';
export * from './hooks';
export * from './non-blocking-updates';
