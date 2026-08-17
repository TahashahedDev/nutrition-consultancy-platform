
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import {
  collection,
  doc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  updateDoc,
  addDoc,
  deleteDoc,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
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
} from '@/components/ui/alert-dialog';
import { Balancer } from 'react-wrap-balancer';
import { NutritionPlan } from '@/lib/types';


/**
 * The admin page for managing purchasable nutrition plans.
 * @returns {React.ReactElement} The rendered page component.
 */
export default function ManagePlansPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<NutritionPlan> | null>(null);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [durationMonths, setDurationMonths] = useState<number | ''>('');
  const [features, setFeatures] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [recommendation, setRecommendation] = useState('');

  const [plansData, setPlansData] = useState<NutritionPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  
  const plansQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'nutritionPlans'), orderBy('createdAt', 'asc')) : null, [firestore]);

  const fetchPlans = useCallback(async () => {
    if (!plansQuery) return;
    setIsLoadingPlans(true);
    try {
      const snapshot = await getDocs(plansQuery);
      setPlansData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NutritionPlan)));
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch nutrition plans.' });
    } finally {
        setIsLoadingPlans(false);
    }
  }, [plansQuery, toast]);

  useEffect(() => {
    if (!isUserLoading && (!user || !user.isAdmin)) {
      router.push('/admin/login');
    } else if(user) {
        fetchPlans();
    }
  }, [user, isUserLoading, router, fetchPlans]);

  const resetFormState = useCallback(() => {
      setTitle('');
      setPrice('');
      setDescription('');
      setDurationMonths('');
      setFeatures('');
      setIsPopular(false);
      setRecommendation('');
      setCurrentPlan(null);
  }, []);

  const openDialog = useCallback((plan: Partial<NutritionPlan> | null = null) => {
    if (plan) {
      setCurrentPlan(plan);
      setTitle(plan.title || '');
      setPrice(plan.price || '');
      setDescription(plan.description || '');
      setDurationMonths(plan.durationMonths || '');
      setFeatures(plan.features?.join('\n') || '');
      setIsPopular(plan.isPopular || false);
      setRecommendation(plan.recommendation || '');
    } else {
      resetFormState();
    }
    setIsDialogOpen(true);
  }, [resetFormState]);

  const handleDialogChange = useCallback((isOpen: boolean) => {
    setIsDialogOpen(isOpen);
    if (!isOpen) {
      resetFormState();
    }
  }, [resetFormState]);

  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database service is not available.' });
        return;
    }
    
    const parsedDuration = parseInt(String(durationMonths), 10);
    
    if (!title || !price || isNaN(parsedDuration) || parsedDuration <= 0) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Title, Price, and a valid positive Duration are required.' });
      return;
    }
    setIsSubmitting(true);

    const planData = {
      title,
      price,
      description,
      durationMonths: parsedDuration,
      features: features.split('\n').filter(f => f.trim() !== ''),
      isPopular,
      recommendation,
    };

    try {
        if (currentPlan?.id) {
          const planRef = doc(firestore, 'nutritionPlans', currentPlan.id);
          await updateDoc(planRef, planData);
          toast({ title: 'Plan Updated!', description: 'The nutrition plan has been successfully updated.' });
        } else {
          const colRef = collection(firestore, 'nutritionPlans');
          await addDoc(colRef, {
            ...planData,
            createdAt: serverTimestamp(),
          });
          toast({ title: 'Plan Created!', description: 'The new nutrition plan is now available.' });
        }
        
        handleDialogChange(false);
        await fetchPlans();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Submission Error', description: 'Could not save the plan.' });
    } finally {
        setIsSubmitting(false);
    }

  }, [firestore, title, price, description, durationMonths, features, isPopular, recommendation, currentPlan, toast, fetchPlans, handleDialogChange]);

  const handleDeletePlan = useCallback(async (planId: string) => {
    if (!firestore) return;
    try {
        const planRef = doc(firestore, 'nutritionPlans', planId);
        await deleteDoc(planRef);
        toast({ title: 'Plan Deleted', description: 'The nutrition plan has been removed.' });
        await fetchPlans();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Deletion Error', description: 'Could not delete the plan.' });
    }
  }, [firestore, toast, fetchPlans]);

  if (isUserLoading || !user || !user.isAdmin) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto py-10">
      <header className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
        </Button>
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-4xl font-headline font-bold"><Balancer>Manage Nutrition Plans</Balancer></h1>
                <p className="text-muted-foreground mt-2"><Balancer>Create, edit, and delete service plans for your clients.</Balancer></p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                <DialogTrigger asChild>
                    <Button onClick={() => openDialog(null)}><PlusCircle className="mr-2 h-4 w-4" />Add New Plan</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle><Balancer>{currentPlan?.id ? 'Edit' : 'Create'} Nutrition Plan</Balancer></DialogTitle>
                        <DialogDescription><Balancer>Fill in the details for the service plan.</Balancer></DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleFormSubmit} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                        <div className="space-y-2">
                            <Label htmlFor="plan-title">Plan Title</Label>
                            <Input id="plan-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., 3-Month Transformation" required />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="plan-price">Price</Label>
                                <Input id="plan-price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g., 6000 INR" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="plan-duration">Duration in Months</Label>
                                <Input id="plan-duration" type="number" value={durationMonths} onChange={(e) => setDurationMonths(e.target.value === '' ? '' : parseInt(e.target.value, 10))} placeholder="e.g., 3" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="plan-desc">Description</Label>
                            <Textarea id="plan-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short summary of the plan." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="plan-features">Features (one per line)</Label>
                            <Textarea id="plan-features" value={features} onChange={(e) => setFeatures(e.target.value)} placeholder="Personalized meal plans\nWeekly check-ins" className="min-h-[100px]" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="plan-recommendation">Recommendation Text (Optional)</Label>
                            <Input id="plan-recommendation" value={recommendation} onChange={(e) => setRecommendation(e.target.value)} placeholder="e.g., Perfect for getting started!" />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="is-popular" checked={isPopular} onCheckedChange={setIsPopular} />
                            <Label htmlFor="is-popular">Mark as "Most Popular"?</Label>
                        </div>
                        <DialogFooter className="mt-4 sticky bottom-0 bg-background py-2">
                            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Plan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
      </header>

      <Card>
        <CardHeader>
            <CardTitle>Existing Plans</CardTitle>
            <CardDescription>Here are the current plans that appear on your homepage.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoadingPlans ? (
                 <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {plansData && plansData.length > 0 ? (
                        plansData.map(plan => (
                            <Card key={plan.id} className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
                                <CardHeader>
                                    <CardTitle><Balancer>{plan.title}</Balancer></CardTitle>
                                    <CardDescription>{plan.price} / {plan.durationMonths} Month{plan.durationMonths > 1 ? 's' : ''}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground"><Balancer>{plan.description}</Balancer></p>
                                </CardContent>
                                <CardFooter className="flex justify-end gap-2">
                                     <Button variant="outline" size="icon" onClick={() => openDialog(plan)}>
                                        <Edit className="h-4 w-4" />
                                        <span className="sr-only">Edit Plan</span>
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon">
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete Plan</span>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the plan.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeletePlan(plan.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-8 col-span-full">No nutrition plans have been created yet. Click "Add New Plan" to get started.</p>
                    )}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
