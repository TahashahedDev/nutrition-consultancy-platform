

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, onSnapshot, Unsubscribe, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ClientData } from '@/lib/types';
import { useMemoFirebase } from '@/firebase/hooks';

/**
 * A real-time hook to fetch a specific client's progress data (e.g., weight, measurements).
 * This data is used for charts and history logs.
 * @param {string | null | undefined} userId - The ID of the user whose data to fetch.
 * @returns {{ data: ClientData[], isLoading: boolean }} An object containing the client's data and a loading state.
 */
export function useClientData(userId?: string | null): { data: ClientData[], isLoading: boolean } {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [clientData, setClientData] = useState<ClientData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize the Firestore query to prevent re-creating it on every render, which would cause performance issues.
  const clientDataQuery = useMemoFirebase(() => (firestore && userId) 
    ? query(collection(firestore, `users/${userId}/progressData`), orderBy('date', 'desc')) 
    : null, 
  [firestore, userId]);

  useEffect(() => {
    if (!clientDataQuery) {
        setIsLoading(true); // Set loading true if there's no query
        setClientData([]);
        return;
    }
    
    setIsLoading(true);
    const unsubscribe: Unsubscribe = onSnapshot(clientDataQuery, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientData));
        setClientData(data);
        setIsLoading(false);
      },
      (error) => {
        toast({ 
          variant: 'destructive', 
          title: 'Error Loading History', 
          description: 'Could not fetch your progress data.' 
        });
        setIsLoading(false);
      }
    );

    // Unsubscribe from the real-time listener when the component unmounts.
    return () => unsubscribe();
  }, [clientDataQuery, toast]);

  // Memoize the returned object to prevent consumers from re-rendering unnecessarily
  const memoizedData = useMemo(() => clientData, [clientData]);

  return { data: memoizedData, isLoading };
}

    
