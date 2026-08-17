// Firebase Web SDK configuration. These values identify the Firebase project
// to the client SDK; they are not secrets (see Firebase's own guidance:
// https://firebase.google.com/docs/projects/api-keys) and access is
// enforced separately by src/firestore.rules. They are read from
// environment variables so the project can be pointed at a different
// Firebase project (e.g. staging) without code changes — see .env.example.
// The defaults below match the project this app currently ships with.

export const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-3755355049-29407',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:178948832174:web:8a4ef71f074d7fcec0e63f',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'studio-3755355049-29407.appspot.com',
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCvgHbDSIYYE061QQ_JH-q21mOHYObtnzI',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'studio-3755355049-29407.firebaseapp.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '178948832174',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-YJ935K4F0V',
};
