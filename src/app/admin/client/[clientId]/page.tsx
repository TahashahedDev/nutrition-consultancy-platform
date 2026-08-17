'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, getDocs, serverTimestamp, orderBy, query, onSnapshot, Unsubscribe, where, updateDoc, deleteField, setDoc, writeBatch, deleteDoc, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Trash2, PlusCircle, CheckCircle, XCircle, Eye, NotepadText, History, FileText, Edit, PauseCircle, PlayCircle, User, Mail, CalendarClock, Info, Calendar as CalendarIconUI, Phone } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { format, parse, differenceInDays, addDays, addMonths } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Meal, DayPlan, DietPlan, UserProfile, ClientData, AdminNote, NutritionPlan } from '@/lib/types';
import { Balancer } from 'react-wrap-balancer';
import { cn } from '@/lib/utils';
import { toDate } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dynamic from 'next/dynamic';


/**
 * @constant generateUniqueId - A helper to generate a more unique ID for new meal/day objects.
 * @param {string} prefix - A prefix for the ID.
 * @returns {string} A unique identifier string.
 */
const generateUniqueId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const DietPlanForm = dynamic(() => import('@/components/admin/DietPlanForm'), {
    ssr: false,
    loading: () => <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
});


/**
 * A component to display meal photo submission status for a given diet plan.
 * @param {{ plan: DietPlan }} props - The diet plan to display submissions for.
 * @returns {React.ReactElement} The rendered submission log.
 */
const PlanSubmissions = React.memo(function PlanSubmissions({ plan }: { plan: DietPlan }) {
    const planStartDateValue = toDate(plan.startDate);
    if (!planStartDateValue) return <p className="text-muted-foreground p-4">Plan start date not set.</p>;
    
    const planStartDate = planStartDateValue;

    return (
        <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 py-4">
                {plan.days.map(day => {
                    const dayDate = addDays(planStartDate, day.day - 1);
                    return (
                        <div key={day.id}>
                            <h3 className="font-semibold text-lg mb-2 sticky top-0 bg-background py-1">
                                Day {day.day} <span className="text-sm font-normal text-muted-foreground">({format(dayDate, 'EEE, MMM d')})</span>
                            </h3>
                            <div className="space-y-2">
                                {day.meals.map((meal, mealIndex) => (
                                    <div key={meal.id} className="flex items-center justify-between rounded-md border p-3">
                                        <div>
                                            <p className="font-medium">{meal.time} - Meal {mealIndex + 1}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-xs"><Balancer>{meal.description.split('\n')[0]}</Balancer></p>
                                        </div>
                                        {meal.photoSubmitted ? (
                                            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                                <CheckCircle className="mr-2 h-4 w-4"/> Submitted
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">Not Submitted</Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </ScrollArea>
    );
});
PlanSubmissions.displayName = 'PlanSubmissions';

/**
 * Groups raw client data entries by their submission date.
 * This is useful for displaying all metrics logged on the same day in a single table row.
 * @param {ClientData[]} data - The raw array of client data entries.
 * @returns {ClientData[]} An array of data entries grouped by date.
 */
const groupClientDataBySubmission = (data: ClientData[]): ClientData[] => {
  if (!data || data.length === 0) return [];

  const submissionsMap = new Map<string, ClientData>();

  data.forEach(entry => {
    const date = toDate(entry.date);
    if (!date) return;
    
    const submissionKey = date.toISOString();
    const metricType = entry.type; 

    if (!submissionsMap.has(submissionKey)) {
        submissionsMap.set(submissionKey, {
            id: entry.id,
            date: entry.date,
            [metricType as string]: entry.value,
        } as ClientData);
    } else {
        const existing = submissionsMap.get(submissionKey)!;
        (existing as any)[metricType as string] = entry.value;
    }
  });

  const grouped = Array.from(submissionsMap.values());
  
  return grouped.sort((a, b) => {
    const dateA = toDate(a.date)?.getTime() || 0;
    const dateB = toDate(b.date)?.getTime() || 0;
    return dateB - dateA;
  });
};

/**
 * An inline editor for updating a date field. Memoized for performance.
 * @param {{ label: string, date: Date | null, onSave: (newDate: Date) => void }} props - Component props.
 * @returns {React.ReactElement} The rendered date editor.
 */
const DateEditor = React.memo(function DateEditor({ label, date, onSave }: { label: string, date: Date | null, onSave: (newDate: Date) => void }) {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [dateString, setDateString] = useState(date ? format(date, 'dd/MM/yyyy') : '');

    useEffect(() => {
        setDateString(date ? format(date, 'dd/MM/yyyy') : '');
    }, [date]);

    const handleSave = useCallback(async () => {
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            toast({ variant: 'destructive', title: 'Invalid Format', description: 'Please use DD/MM/YYYY format.' });
            return;
        }
        
        try {
            const parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
            if (isNaN(parsedDate.getTime())) {
                throw new Error("Invalid date value.");
            }
            await onSave(parsedDate);
            setIsEditing(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Invalid Date', description: 'The date you entered is not valid.' });
        }
    }, [dateString, onSave, toast]);

    return (
        <div className="flex items-start gap-3 rounded-md p-3 transition-colors hover:bg-secondary/50">
             {label === 'Start Date' ? 
                <CalendarIconUI className="h-5 w-5 text-muted-foreground mt-0.5" /> : 
                <CalendarClock className="h-5 w-5 text-muted-foreground mt-0.5" />
            }
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <p className="font-semibold">{label}</p>
                    {!isEditing && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                {isEditing ? (
                   <div className="flex items-center gap-2 mt-2">
                       <Input
                         type="text"
                         value={dateString}
                         onChange={(e) => setDateString(e.target.value)}
                         placeholder="DD/MM/YYYY"
                         className="h-8 w-32"
                       />
                       <Button size="sm" onClick={handleSave}>Save</Button>
                       <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                   </div>
                ) : (
                   <p className="text-muted-foreground text-sm">{date ? format(date, 'dd/MM/yyyy') : 'Not set'}</p>
                )}
            </div>
        </div>
    );
});
DateEditor.displayName = 'DateEditor';

/**
 * The main page for managing a single client in the admin dashboard.
 * @returns {React.ReactElement} The client management page.
 */
export default function ManageClientPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [clientProfile, setClientProfile] = useState<UserProfile | null>(null);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [clientData, setClientData] = useState<ClientData[]>([]);
  const [adminNotes, setAdminNotes] = useState<AdminNote | null>(null);
  const [allNutritionPlans, setAllNutritionPlans] = useState<NutritionPlan[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<DietPlan | null>(null);
  const [viewingPlanSubmissions, setViewingPlanSubmissions] = useState<DietPlan | null>(null);
  
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  const [counsellingNote, setCounsellingNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState<'followUp' | 'counselling' | null>(null);

  const [isTogglingSubscription, setIsTogglingSubscription] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  
  useEffect(() => {
    if (!isUserLoading && (!user || !user.isAdmin)) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const clientDocRef = useMemoFirebase(() => firestore && clientId ? doc(firestore, 'users', clientId) : null, [firestore, clientId]);
  const dietPlansQuery = useMemoFirebase(() => firestore && clientId ? query(collection(firestore, `users/${clientId}/dietPlans`), orderBy('createdAt', 'desc')) : null, [firestore, clientId]);
  const clientDataQuery = useMemoFirebase(() => firestore && clientId ? query(collection(firestore, `users/${clientId}/progressData`), orderBy('date', 'desc')) : null, [firestore, clientId]);
  const adminNotesQuery = useMemoFirebase(() => firestore && clientId ? query(collection(firestore, 'adminNotes'), where('clientId', '==', clientId)) : null, [firestore, clientId]);
  const nutritionPlansQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'nutritionPlans')) : null, [firestore]);

  const groupedClientData = useMemo(() => groupClientDataBySubmission(clientData), [clientData]);

  useEffect(() => {
    if (!firestore || !clientId) return;
    
    let isMounted = true;
    setIsLoading(true);
    const unsubscribes: Unsubscribe[] = [];

    const fetchAllData = async () => {
        try {
            if (nutritionPlansQuery) {
                const plansSnapshot = await getDocs(nutritionPlansQuery);
                if (isMounted) {
                    const plans = plansSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as NutritionPlan));
                    setAllNutritionPlans(plans);
                }
            }

            if (clientDocRef) {
                unsubscribes.push(onSnapshot(clientDocRef, (snap) => {
                  if (isMounted) setClientProfile(snap.exists() ? { id: snap.id, ...snap.data() } as UserProfile : null)
                }));
            }
            if (dietPlansQuery) {
                unsubscribes.push(onSnapshot(dietPlansQuery, (snap) => {
                  if (isMounted) setDietPlans(snap.docs.map(p => ({ id: p.id, ...p.data() } as DietPlan)))
                }));
            }
            if (clientDataQuery) {
                unsubscribes.push(onSnapshot(clientDataQuery, (snap) => {
                  if (isMounted) setClientData(snap.docs.map(d => ({ id: d.id, ...d.data() } as ClientData)))
                }));
            }
            if (adminNotesQuery) {
                unsubscribes.push(onSnapshot(adminNotesQuery, (snap) => {
                    if (isMounted) {
                      if (!snap.empty) {
                          const noteDoc = snap.docs[0];
                          const noteData = { id: noteDoc.id, ...noteDoc.data() } as AdminNote;
                          setAdminNotes(noteData);
                          setFollowUpNote(noteData.followUpNote || '');
                          setCounsellingNote(noteData.counsellingNote || '');
                      } else {
                          setAdminNotes(null);
                          setFollowUpNote('');
                          setCounsellingNote('');
                      }
                    }
                }));
            }
        } catch (error) {
            if (isMounted) toast({ variant: 'destructive', title: 'Error', description: 'Could not load page data.' });
        } finally {
            if (isMounted) setIsLoading(false);
        }
    };
    
    fetchAllData();
    
    return () => {
      isMounted = false;
      unsubscribes.forEach(unsub => unsub());
    }
  }, [firestore, clientId, toast, clientDocRef, dietPlansQuery, clientDataQuery, adminNotesQuery, nutritionPlansQuery]);
  

  const handleSaveDate = useCallback(async (field: 'subscriptionStartDate' | 'subscriptionEndDate', date: Date) => {
    if (!clientDocRef) return;
    await updateDoc(clientDocRef, { [field]: date });
    toast({ title: 'Date Updated!', description: 'The subscription date has been saved.' });
  }, [clientDocRef, toast]);
  
  const handlePlanChange = useCallback(async (newPlanId: string) => {
    if (!clientDocRef) return;
    await updateDoc(clientDocRef, { planId: newPlanId });
    toast({ title: 'Plan Updated!', description: "Client's purchased plan has been changed." });
  }, [clientDocRef, toast]);


  const handleDeletePlan = useCallback(async (planId: string) => {
    if (!firestore || !clientId) return;
    const planRef = doc(firestore, `users/${clientId}/dietPlans`, planId);
    await deleteDoc(planRef);
    toast({ title: 'Plan Deleted', description: 'The diet plan has been removed.' });
  }, [firestore, clientId, toast]);

  const handleToggleSubscription = useCallback(async () => {
    if (!clientDocRef || !clientProfile || isTogglingSubscription) return;
    setIsTogglingSubscription(true);
    const newStatus = !clientProfile.isSubscribed;
    
    try {
      if (newStatus) {
        // Use a simple 1-month duration for robust activation
        await updateDoc(clientDocRef, {
          isSubscribed: true,
          isPaymentPending: false, 
          subscriptionStartDate: serverTimestamp(),
          subscriptionEndDate: addMonths(new Date(), 1),
        });
        toast({ title: 'Subscription Activated', description: 'Client is now subscribed and verification is complete.' });

      } else {
        await updateDoc(clientDocRef, { isSubscribed: false });
        toast({ title: 'Subscription Deactivated', description: 'Client is now unsubscribed.' });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not update subscription.' });
    } finally {
      setIsTogglingSubscription(false);
    }
  }, [clientDocRef, clientProfile, isTogglingSubscription, toast]);
  
   const handleTogglePause = useCallback(async () => {
    if (!clientDocRef || !clientProfile || isPausing || !clientProfile.isSubscribed) return;
    setIsPausing(true);
    
    try {
        if (clientProfile.isPaused) { 
            const pausedAtDate = toDate(clientProfile.pausedAt);
            const endDate = toDate(clientProfile.subscriptionEndDate);

            let newEndDate = endDate;
            if (pausedAtDate && endDate) {
                const pausedDuration = differenceInDays(new Date(), pausedAtDate);
                newEndDate = addDays(endDate, pausedDuration > 0 ? pausedDuration : 0);
            }

            await updateDoc(clientDocRef, {
                isPaused: false,
                pausedAt: deleteField(),
                subscriptionEndDate: newEndDate
            });
            toast({ title: 'Subscription Resumed', description: `End date extended to ${newEndDate ? format(newEndDate, 'PPP') : 'N/A'}` });

        } else { 
            await updateDoc(clientDocRef, {
                isPaused: true,
                pausedAt: serverTimestamp(),
            });
            toast({ title: 'Subscription Paused', description: 'The plan is now on hold.' });
        }
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not update subscription pause state.' });
    } finally {
        setIsPausing(false);
    }
  }, [clientProfile, clientDocRef, toast, isPausing]);

  const handleSaveNote = useCallback(async (noteType: 'followUp' | 'counselling') => {
    if (!firestore || !clientId || isSavingNote) return;
    
    setIsSavingNote(noteType);
    const noteContent = noteType === 'followUp' ? followUpNote : counsellingNote;
    
    try {
        if (adminNotes?.id) {
            const noteRef = doc(firestore, 'adminNotes', adminNotes.id);
            await updateDoc(noteRef, {
                [noteType === 'followUp' ? 'followUpNote' : 'counsellingNote']: noteContent,
            });
        } else {
            const newNoteRef = doc(collection(firestore, 'adminNotes'));
            await setDoc(newNoteRef, {
                id: newNoteRef.id,
                clientId,
                [noteType === 'followUp' ? 'followUpNote' : 'counsellingNote']: noteContent,
                createdAt: serverTimestamp(),
            });
        }
        toast({ title: `${noteType === 'followUp' ? 'Follow-up' : 'Counselling'} Note Saved` });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not save note.' });
    } finally {
        setIsSavingNote(null);
    }
  }, [firestore, clientId, followUpNote, counsellingNote, adminNotes, toast, isSavingNote]);

  const handleDeleteNote = useCallback(async (noteType: 'followUp' | 'counselling') => {
      if (!firestore || !adminNotes?.id) return;
      setIsSavingNote(noteType);
      try {
          const noteRef = doc(firestore, 'adminNotes', adminNotes.id);
          await updateDoc(noteRef, {
              [noteType === 'followUp' ? 'followUpNote' : 'counsellingNote']: deleteField(),
          });
          if (noteType === 'followUp') setFollowUpNote('');
          if (noteType === 'counselling') setCounsellingNote('');
          toast({ title: `${noteType === 'followUp' ? 'Follow-up' : 'Counselling'} Note Cleared` });
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not clear the note.' });
      } finally {
          setIsSavingNote(null);
      }
  }, [firestore, adminNotes, toast]);


  const handlePlanSaved = useCallback(() => {
    setIsPlanDialogOpen(false);
    setEditingPlan(null);
  }, []);
  
  const openPlanDialog = useCallback((plan: DietPlan | null) => {
    setEditingPlan(plan);
    setIsPlanDialogOpen(true);
  }, []);

  const handleDeleteDataEntry = useCallback(async (entryDate: any) => {
    if (!firestore || !clientId) return;
    
    const dateToDelete = toDate(entryDate);
    if (!dateToDelete) {
        toast({ variant: 'destructive', title: 'Error', description: 'Invalid date for deletion.' });
        return;
    }

    try {
        const q = query(collection(firestore, `users/${clientId}/progressData`), 
            where('date', '==', Timestamp.fromDate(dateToDelete))
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            toast({ variant: 'destructive', title: 'Not Found', description: 'Could not find entries for this date to delete.' });
            return;
        }

        const batch = writeBatch(firestore);
        snapshot.docs.forEach(docSnap => {
            batch.delete(docSnap.ref);
        });
        
        await batch.commit();
        toast({ title: 'Data Entry Deleted', description: 'The entry has been removed from client history.' });
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete entry.' });
    }
  }, [firestore, clientId, toast]);
  
  const clientDetails = useMemo(() => {
    if (!clientProfile) return null;
    
    const purchasedPlan = allNutritionPlans.find(p => p.id === clientProfile.planId);

    const status = clientProfile.isPaused ? 
        <Badge variant="outline" className="border-orange-500 text-orange-500"><PauseCircle className="mr-2 h-4 w-4"/>Paused</Badge> :
        clientProfile.isSubscribed ? 
        <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-2 h-4 w-4" /> Active</Badge> : 
        clientProfile.isPaymentPending ?
        <Badge variant="outline" className="border-yellow-500 text-yellow-500"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Pending</Badge> :
        <Badge variant="destructive"><XCircle className="mr-2 h-4 w-4" /> Inactive</Badge>;
    
    return {
        name: clientProfile.displayName,
        email: clientProfile.email,
        phone: clientProfile.phoneNumber,
        plan: purchasedPlan,
        status,
        isSubscribed: clientProfile.isSubscribed,
        startDate: toDate(clientProfile.subscriptionStartDate),
        endDate: toDate(clientProfile.subscriptionEndDate),
    };
  }, [clientProfile, allNutritionPlans]);

  if (isUserLoading || isLoading || !clientId) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  return (
    <div className="container mx-auto py-10 px-4">
      <header className="mb-8">
        <Button variant="ghost" asChild className="mb-4"><Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link></Button>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className='flex-1'>
            <h1 className="text-4xl font-headline font-bold">Manage Client</h1>
            <p className="text-muted-foreground mt-2 max-w-prose"><Balancer>Viewing and adding data for {clientProfile?.displayName || clientProfile?.email || 'client'}</Balancer>.</p>
          </div>
          <div className="w-full sm:w-auto">
            <Card className="p-4 transition-all hover:shadow-md">
                <div className="flex flex-col gap-4">
                    <h4 className="font-semibold">Subscription Actions</h4>
                    <div className="flex gap-2 flex-wrap">
                       <Button onClick={handleToggleSubscription} disabled={isLoading || isTogglingSubscription} size="sm">
                          {isTogglingSubscription && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {clientProfile?.isSubscribed ? 'Deactivate' : 'Activate'}
                      </Button>
                      {clientProfile?.isSubscribed && (
                           <Button onClick={handleTogglePause} disabled={isLoading || isPausing} size="sm" variant="outline">
                              {isPausing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {clientProfile.isPaused ? <PlayCircle className="mr-2 h-4 w-4"/> : <PauseCircle className="mr-2 h-4 w-4"/>}
                              {clientProfile.isPaused ? 'Resume' : 'Pause'}
                          </Button>
                      )}
                    </div>
                </div>
            </Card>
          </div>
        </div>
      </header>

      <div className="space-y-8">
        <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
            <CardHeader>
                <CardTitle>Client Details</CardTitle>
                <CardDescription>A summary of the client's information and subscription.</CardDescription>
            </CardHeader>
             <CardContent>
                {isLoading ? <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin"/></div> :
                !clientDetails ? <p className="text-muted-foreground">Could not load client details.</p> :
                (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-start gap-3 rounded-md p-3">
                            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-semibold">Name</p>
                                <p className="text-muted-foreground">{clientDetails.name || 'N/A'}</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-3 rounded-md p-3">
                            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-semibold">Email</p>
                                <p className="text-muted-foreground">{clientDetails.email || 'N/A'}</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-3 rounded-md p-3">
                            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-semibold">Phone</p>
                                <p className="text-muted-foreground">{clientDetails.phone || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-md p-3">
                            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-semibold">Purchased Plan</p>
                                <Select onValueChange={handlePlanChange} value={clientDetails.plan?.id}>
                                  <SelectTrigger className="w-[220px] h-8 text-muted-foreground">
                                    <SelectValue placeholder="Select a plan" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {allNutritionPlans.map(plan => (
                                      <SelectItem key={plan.id} value={plan.id}>{plan.title}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-md p-3">
                            <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-semibold">Subscription Status</p>
                                {clientDetails.status}
                            </div>
                        </div>
                        
                        <DateEditor
                            label="Start Date"
                            date={clientDetails.startDate}
                            onSave={(newDate) => handleSaveDate('subscriptionStartDate', newDate)}
                        />
                        <DateEditor
                            label="End Date"
                            date={clientDetails.endDate}
                            onSave={(newDate) => handleSaveDate('subscriptionEndDate', newDate)}
                        />
                    </div>
                )}
            </CardContent>
        </Card>


        <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <CardTitle>Diet Plans</CardTitle>
                    <CardDescription>Create, edit, and manage diet plans for this client.</CardDescription>
                </div>
                <Button onClick={() => openPlanDialog(null)}><PlusCircle className="mr-2 h-4 w-4" />Create New Plan</Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : (
                    <div className="space-y-4">
                        {dietPlans && dietPlans.length > 0 ? (
                           dietPlans.map(plan => {
                            const totalMeals = plan.days.flatMap(d => d.meals).length;
                            const totalSubmissions = plan.days.flatMap(d => d.meals).filter(m => m.photoSubmitted).length;
                            const allSubmitted = totalMeals > 0 && totalSubmissions === totalMeals;
                            const planStartDate = toDate(plan.startDate);
                            const planEndDate = (planStartDate && plan.days.length > 0) ? addDays(planStartDate, plan.days.length - 1) : null;

                            return (
                             <Card key={plan.id} className="bg-secondary transition-all hover:shadow-md">
                               <CardHeader className="flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                                 <div>
                                   <CardTitle>{plan.title || `Plan from ${planStartDate ? format(planStartDate, 'PPP') : 'N/A'}`}</CardTitle>
                                   <CardDescription>
                                       {planStartDate && planEndDate ? 
                                       `${format(planStartDate, 'MMM d')} - ${format(planEndDate, 'MMM d, yyyy')}` 
                                       : `${plan.days.length} day(s)`}
                                   </CardDescription>
                                 </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Button variant="outline" size="sm" onClick={() => openPlanDialog(plan)}><Edit className="mr-2 h-4 w-4"/> Edit</Button>
                                     <Dialog open={viewingPlanSubmissions?.id === plan.id} onOpenChange={(isOpen) => setViewingPlanSubmissions(isOpen ? plan : null)}>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" disabled={totalSubmissions === 0}>
                                            <div className="flex items-center">
                                                <Eye className="mr-2 h-4 w-4"/> View Submissions
                                                {allSubmitted && <CheckCircle className="ml-2 h-4 w-4 text-green-500" />}
                                            </div>
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                          <DialogTitle>Photo Submissions for "{plan.title || 'this plan'}"</DialogTitle>
                                          <DialogDescription>
                                            <Balancer>A log of all meal photos the client has confirmed sending on WhatsApp for this plan.</Balancer>
                                          </DialogDescription>
                                        </DialogHeader>
                                        {viewingPlanSubmissions && <PlanSubmissions plan={viewingPlanSubmissions} />}
                                      </DialogContent>
                                    </Dialog>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" className='px-2'><Trash2 className="h-4 w-4" /></Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the diet plan.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeletePlan(plan.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                               </CardHeader>
                               <CardContent className="grid gap-2 text-sm">
                                  <p className="text-muted-foreground">
                                    <Balancer><span className="font-semibold text-foreground">{totalSubmissions} of {totalMeals} photo(s)</span> submitted for this plan.</Balancer>
                                  </p>
                               </CardContent>
                             </Card>
                           )
                        })
                        ) : (
                            <p className="text-center text-muted-foreground py-4">No diet plans created for this client yet.</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
      
        <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{editingPlan ? 'Edit' : 'Create New'} Diet Plan</DialogTitle>
                    <DialogDescription>Fill in the details for the diet plan.</DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-hidden">
                    <ScrollArea className="h-full pr-6">
                        <DietPlanForm
                            clientId={clientId}
                            existingPlan={editingPlan}
                            onPlanSaved={handlePlanSaved}
                            isSubmitting={isSubmittingPlan}
                            setIsSubmitting={setIsSubmittingPlan}
                        />
                    </ScrollArea>
                </div>
                <DialogFooter className="border-t pt-4">
                    <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" form="diet-plan-form" disabled={isSubmittingPlan}>
                        {isSubmittingPlan && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        {editingPlan ? 'Update Plan' : 'Save Plan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      
         <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><History /> Client History</CardTitle>
                <CardDescription>A log of the client's submitted data points. Updates in real-time.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin"/></div> :
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Weight (kg)</TableHead>
                                    <TableHead>Waist (in)</TableHead>
                                    <TableHead>Chest (in)</TableHead>
                                    <TableHead>Hip (in)</TableHead>
                                    <TableHead>Thighs (in)</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groupedClientData.length > 0 ? groupedClientData.map(entry => (
                                    <TableRow key={entry.id}>
                                        <TableCell className="font-medium whitespace-nowrap">{toDate(entry.date) ? format(toDate(entry.date)!, 'PPP') : 'Processing...'}</TableCell>
                                        <TableCell>{(entry as any).weight || '–'}</TableCell>
                                        <TableCell>{(entry as any).waist || '–'}</TableCell>
                                        <TableCell>{(entry as any).chest || '–'}</TableCell>
                                        <TableCell>{(entry as any).hip || '–'}</TableCell>
                                        <TableCell>{(entry as any).thighs || '–'}</TableCell>
                                        <TableCell className="text-right">
                                           <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive/70" /></Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                                                  <AlertDialogDescription>This will permanently delete this measurement entry. This action cannot be undone.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                  <AlertDialogAction onClick={() => handleDeleteDataEntry(entry.date)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                              </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={7} className="text-center h-24">No data submitted yet.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </div>
                }
            </CardContent>
         </Card>
        
        {isLoading ? <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin"/></div> :
        (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <Card className="transition-all hover:shadow-lg hover:-translate-y-1 h-full flex flex-col">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2"><NotepadText /> Follow-up Notes</CardTitle>
                      <CardDescription>Private notes about client check-ins, progress, etc.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                      <div className="space-y-4 h-full flex flex-col">
                          <Textarea 
                              value={followUpNote}
                              onChange={(e) => setFollowUpNote(e.target.value)}
                              placeholder="Add follow-up notes..."
                              className="min-h-[150px] flex-grow"
                          />
                      </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                       <Button onClick={() => handleSaveNote('followUp')} disabled={isSavingNote === 'followUp'}>
                          {isSavingNote === 'followUp' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                          Save
                      </Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="outline" disabled={!followUpNote}>Clear</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Clear follow-up note?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete the content of this note.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteNote('followUp')}>Clear Note</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                  </CardFooter>
              </Card>

              <Card className="transition-all hover:shadow-lg hover:-translate-y-1 h-full flex flex-col">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2"><FileText /> Counselling Notes</CardTitle>
                      <CardDescription>Private notes about consultations, goals, etc.</CardDescription>
                  </CardHeader>
                   <CardContent className="flex-grow">
                      <div className="space-y-4 h-full flex flex-col">
                          <Textarea 
                              value={counsellingNote}
                              onChange={(e) => setCounsellingNote(e.target.value)}
                              placeholder="Add counselling notes..."
                              className="min-h-[150px] flex-grow"
                          />
                      </div>
                  </CardContent>
                   <CardFooter className="flex justify-between">
                       <Button onClick={() => handleSaveNote('counselling')} disabled={isSavingNote === 'counselling'}>
                          {isSavingNote === 'counselling' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                          Save
                      </Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="outline" disabled={!counsellingNote}>Clear</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Clear counselling note?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete the content of this note.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteNote('counselling')}>Clear Note</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                  </CardFooter>
              </Card>
            </div>
        )}
      </div>
    </div>
  );
}
