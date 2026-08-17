'use client';

import {
  getDoc as fsGetDoc,
  getDocs as fsGetDocs,
  DocumentReference,
  Query,
  DocumentData,
} from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

export type WithId<T> = T & { id: string };

/**
 * Fetches a single document from Firestore.
 * This is a one-time fetch and does not listen for real-time updates.
 * It includes robust error handling for permission issues.
 * @param docRef The DocumentReference of the document to fetch.
 * @returns A promise that resolves to the document data with its ID, or null if it doesn't exist.
 */
export async function getDoc<T>(docRef: DocumentReference): Promise<WithId<T> | null> {
  try {
    const docSnap = await fsGetDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as T) };
    }
    return null;
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'get',
      });
      errorEmitter.emit('permission-error', permissionError);
    }
    // Re-throw other errors or handle them as needed
    throw error;
  }
}

/**
 * Fetches documents from a Firestore collection based on a query.
 * This is a one-time fetch and does not listen for real-time updates.
 * It includes robust error handling for permission issues.
 * @param query The Firestore Query to execute.
 * @returns A promise that resolves to an array of document data, each with its ID.
 */
export async function getDocs<T>(q: Query): Promise<WithId<T>[]> {
  try {
    const querySnapshot = await fsGetDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as T) }));
  } catch (error: any) {
    if (error.code === 'permission-denied') {
       const path = (q as any)._query.path.canonicalString();
       const permissionError = new FirestorePermissionError({
         path: path,
         operation: 'list',
       });
       errorEmitter.emit('permission-error', permissionError);
    }
    // Re-throw other errors or handle them as needed
    throw error;
  }
}
