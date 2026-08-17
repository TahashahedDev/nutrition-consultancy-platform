
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, PlusCircle, Edit, Trash2, Tag, CheckCircle, XCircle } from 'lucide-react';
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
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toDate } from '@/lib/utils';
import { format } from 'date-fns';
import { Coupon } from '@/lib/types';


/**
 * Admin page for managing discount coupons.
 * @returns {React.ReactElement} The coupons management page.
 */
export default function ManageCouponsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState<Partial<Coupon> | null>(null);

  const [code, setCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);

  const [couponsData, setCouponsData] = useState<Coupon[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(true);

  const couponsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'coupons'), orderBy('createdAt', 'desc')) : null, [firestore]);

  const fetchCoupons = useCallback(async () => {
    if (!couponsQuery) return;
    setIsLoadingCoupons(true);
    try {
      const snapshot = await getDocs(couponsQuery);
      setCouponsData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon)));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch coupons.' });
    } finally {
      setIsLoadingCoupons(false);
    }
  }, [couponsQuery, toast]);

  useEffect(() => {
    if (!isUserLoading && (!user || !user.isAdmin)) {
      router.push('/admin/login');
    } else if (user) {
      fetchCoupons();
    }
  }, [user, isUserLoading, router, fetchCoupons]);

  const resetFormState = useCallback(() => {
    setCode('');
    setDiscountAmount('');
    setIsActive(true);
    setCurrentCoupon(null);
  }, []);

  const openDialog = useCallback((coupon: Partial<Coupon> | null = null) => {
    if (coupon) {
      setCurrentCoupon(coupon);
      setCode(coupon.code || '');
      setDiscountAmount(coupon.discountAmount || '');
      setIsActive(coupon.isActive !== false);
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
    if (!firestore) return;

    const parsedDiscount = typeof discountAmount === 'number' ? discountAmount : parseFloat(String(discountAmount));
    if (!code || isNaN(parsedDiscount) || parsedDiscount <= 0) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'A valid Code and a positive Discount Amount are required.' });
      return;
    }

    setIsSubmitting(true);
    const couponData = {
      code: code.toUpperCase().trim(),
      discountAmount: parsedDiscount,
      isActive,
    };

    try {
      if (currentCoupon?.id) {
        const couponRef = doc(firestore, 'coupons', currentCoupon.id);
        await updateDoc(couponRef, couponData);
        toast({ title: 'Coupon Updated!' });
      } else {
        const colRef = collection(firestore, 'coupons');
        await addDoc(colRef, { ...couponData, createdAt: serverTimestamp() });
        toast({ title: 'Coupon Created!' });
      }
      handleDialogChange(false);
      await fetchCoupons();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Submission Error', description: 'Could not save the coupon.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [firestore, code, discountAmount, isActive, currentCoupon, toast, fetchCoupons, handleDialogChange]);

  const handleDeleteCoupon = useCallback(async (couponId: string) => {
    if (!firestore) return;
    try {
      const couponRef = doc(firestore, 'coupons', couponId);
      await deleteDoc(couponRef);
      toast({ title: 'Coupon Deleted' });
      await fetchCoupons();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Deletion Error' });
    }
  }, [firestore, toast, fetchCoupons]);

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
            <h1 className="text-4xl font-headline font-bold"><Balancer>Manage Coupons</Balancer></h1>
            <p className="text-muted-foreground mt-2"><Balancer>Create and manage discount codes for your clients.</Balancer></p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog(null)}><PlusCircle className="mr-2 h-4 w-4" />Add New Coupon</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{currentCoupon?.id ? 'Edit' : 'Create'} Coupon</DialogTitle>
                <DialogDescription>Fill in the details for the discount coupon.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="coupon-code">Coupon Code</Label>
                  <Input id="coupon-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g., FESTIVAL20" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount-amount">Discount Amount (INR)</Label>
                  <Input id="discount-amount" type="number" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="e.g., 1500" required />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
                  <Label htmlFor="is-active">Coupon is Active</Label>
                </div>
                <DialogFooter className="pt-4">
                  <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Coupon
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Existing Coupons</CardTitle>
          <CardDescription>A list of all available discount codes.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCoupons ? (
            <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {couponsData && couponsData.length > 0 ? (
                    couponsData.map(coupon => (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-mono font-semibold">{coupon.code}</TableCell>
                        <TableCell>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(coupon.discountAmount)}</TableCell>
                        <TableCell>
                          {coupon.isActive ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 hover:bg-green-200"><CheckCircle className="mr-1 h-3 w-3" /> Active</Badge>
                          ) : (
                            <Badge variant="secondary"><XCircle className="mr-1 h-3 w-3" /> Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{coupon.createdAt ? format(toDate(coupon.createdAt)!, 'PPP') : 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openDialog(coupon)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete the coupon <span className="font-mono bg-muted p-1 rounded">{coupon.code}</span>. This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCoupon(coupon.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                        No coupons have been created yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
