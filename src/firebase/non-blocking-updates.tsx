

'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * A non-blocking wrapper for Firestore's `setDoc`.
 * It immediately initiates the write operation but doesn't wait for it to complete.
 * Instead, it attaches a `.catch()` block to handle permission errors gracefully
 * by emitting a structured error for debugging, without crashing the app.
 * @param {DocumentReference} docRef - The reference to the Firestore document.
 * @param {any} data - The data to set in the document.
 * @param {SetOptions} [options] - Optional settings for the set operation (e.g., merge).
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options?: SetOptions) {
  setDoc(docRef, data, options || {}).catch(error => {
    if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: (options && 'merge' in options) ? 'update' : 'create',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError; // Re-throw to be caught by the UI if needed
    }
    throw error; // Re-throw other errors
  })
}


/**
 * A non-blocking wrapper for Firestore's `addDoc`.
 * @param {CollectionReference} colRef - The reference to the Firestore collection.
 * @param {any} data - The data for the new document.
 * @returns {Promise<DocumentReference>} A promise that resolves with the new document's reference.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any): Promise<DocumentReference> {
  const promise = addDoc(colRef, data)
    .catch(error => {
     if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: colRef.path,
            operation: 'create',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      }
      // Re-throw the error so the caller can handle it if they choose to await the promise.
      throw error;
    });
  return promise;
}


/**
 * A non-blocking wrapper for Firestore's `updateDoc`.
 * @param {DocumentReference} docRef - The reference to the Firestore document.
 * @param {any} data - The fields to update.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data)
    .catch(error => {
      if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      }
      throw error;
    });
}


/**
 * A non-blocking wrapper for Firestore's `deleteDoc`.
 * @param {DocumentReference} docRef - The reference to the Firestore document to delete.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .catch(error => {
      if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      }
      throw error;
    });
}
