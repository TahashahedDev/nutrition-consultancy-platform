

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { DietPlan } from '@/lib/types';
import { useMemoFirebase } from '@/firebase/hooks';

/**
 * A real-time hook to fetch a user's assigned diet plans from Firestore.
 * @param {string | null | undefined} userId - The ID of the user whose plans to fetch.
 * @returns {{ plans: DietPlan[], isLoading: boolean }} An object containing an array of diet plans and a loading state.
 */
export function useDietPlans(userId?: string | null): { plans: DietPlan[], isLoading: boolean } {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize the Firestore query to prevent unnecessary re-fetches on component re-renders.
  const dietPlansQuery = useMemoFirebase(() => (firestore && userId) 
    ? query(collection(firestore, `users/${userId}/dietPlans`), orderBy('createdAt', 'desc'))
    : null,
  [firestore, userId]);

  useEffect(() => {
    if (!dietPlansQuery) {
        setIsLoading(true);
        setDietPlans([]);
        return;
    };

    setIsLoading(true);
    // Subscribe to real-time updates for the diet plans.
    const unsubscribe: Unsubscribe = onSnapshot(dietPlansQuery, 
      (snapshot) => {
        const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DietPlan));
        setDietPlans(plans);
        setIsLoading(false);
      },
      (error) => {
        toast({ 
          variant: 'destructive', 
          title: 'Error Loading Plan', 
          description: 'Could not fetch your diet plan.' 
        });
        setIsLoading(false);
      }
    );

    // Unsubscribe from the listener when the component unmounts to prevent memory leaks.
    return () => unsubscribe();
  }, [dietPlansQuery, toast]);
  
  // Memoize the returned array to prevent consumers from re-rendering unnecessarily
  const memoizedPlans = useMemo(() => dietPlans, [dietPlans]);

  return { plans: memoizedPlans, isLoading };
}

    
