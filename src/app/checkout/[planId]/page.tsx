
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, CheckCircle, AlertTriangle, Tag, Sparkles, Rocket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Balancer } from 'react-wrap-balancer';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';
import { NutritionPlan, Coupon } from '@/lib/types';


/**
 * A checkout page for manual UPI payment.
 * On submission, it flags the user's profile as pending and redirects them.
 * @returns {React.ReactElement} The checkout page component.
 */
export default function CheckoutPage() {
  const params = useParams();
  const planId = params.planId as string;
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();
  
  const qrCodeImage = getPlaceholderImage('upi-qr-code');

  const finalPriceDetails = useMemo(() => {
    if (!plan?.price) return { original: 0, final: 0, discount: 0 };
    const originalPrice = parseFloat(plan.price.replace(/[^0-9.]/g, '')) || 0;
    let finalPrice = originalPrice;
    let discount = 0;

    if (appliedCoupon) {
        discount = appliedCoupon.discountAmount;
        finalPrice = Math.max(0, originalPrice - discount);
    }
    
    return { original: originalPrice, final: finalPrice, discount };
  }, [plan, appliedCoupon]);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to proceed with checkout.',
        variant: 'destructive',
        action: (<Button onClick={() => router.push(`/login?redirect=/checkout/${planId}`)}>Login</Button>),
      });
      router.push(`/login?redirect=/checkout/${planId}`);
    } else if (user.isSubscribed) {
        toast({ title: "Already Subscribed", description: "You already have an active plan." });
        router.replace('/dashboard');
    }
  }, [user, isUserLoading, router, toast, planId]);

  useEffect(() => {
    if (!firestore || !planId) return;

    const fetchPlan = async () => {
        setIsLoadingPlan(true);
        try {
            const planRef = doc(firestore, 'nutritionPlans', planId);
            const planSnap = await getDoc(planRef);
            if (planSnap.exists()) {
                setPlan({ id: planSnap.id, ...planSnap.data() } as NutritionPlan);
            } else {
                toast({ variant: 'destructive', title: 'Plan Not Found', description: 'The selected plan could not be loaded.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load plan details.' });
        } finally {
            setIsLoadingPlan(false);
        }
    };
    fetchPlan();
  }, [firestore, planId, toast]);

  const handleApplyCoupon = useCallback(async () => {
      if (!firestore || !couponCode) return;
      
      setIsVerifyingCoupon(true);
      setCouponError(null);
      setAppliedCoupon(null);
      
      try {
          const q = query(collection(firestore, 'coupons'), where('code', '==', couponCode.toUpperCase().trim()));
          const couponSnap = await getDocs(q);
          
          if(couponSnap.empty) {
              setCouponError('This coupon code is not valid.');
              return;
          }
          
          const coupon = { id: couponSnap.docs[0].id, ...couponSnap.docs[0].data() } as Coupon;
          
          if (!coupon.isActive) {
              setCouponError('This coupon is no longer active.');
              return;
          }
          
          setAppliedCoupon(coupon);
          toast({ title: "Coupon Applied!", description: `You've saved ₹${coupon.discountAmount}!`, className: "bg-green-100 dark:bg-green-900 border-green-500" });
          setShowConfetti(true);

      } catch (error) {
          setCouponError('Could not verify the coupon code. Please try again.');
      } finally {
          setIsVerifyingCoupon(false);
      }
  }, [firestore, couponCode, toast]);

  const handlePaymentConfirmation = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !plan || !firestore) return;
    
    setIsSubmitting(true);
    
    const userRef = doc(firestore, 'users', user.uid);
    // Use setDoc with merge: true for a robust update/create operation.
    // This avoids race conditions for new users and works reliably.
    setDocumentNonBlocking(userRef, { 
        isPaymentPending: true,
        planId: plan.id,
    }, { merge: true });

    router.push('/payment-pending');

  }, [user, plan, firestore, router]);

  const isLoading = isUserLoading || isLoadingPlan;

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (!plan) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader><AlertTriangle className="mx-auto h-12 w-12 text-destructive" /><CardTitle className="mt-4 text-2xl font-bold">Plan Not Found</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">The plan you are trying to purchase does not exist.</p>
                    <Button asChild variant="link" className="mt-4"><Link href="/#services">View Plans</Link></Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl py-12 md:py-20 relative">
      <AnimatePresence>
        {showConfetti && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 5 }}>
            <Confetti width={width} height={height} recycle={false} numberOfPieces={400} onConfettiComplete={() => setShowConfetti(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline"><Balancer>Manual UPI Payment</Balancer></CardTitle>
          <CardDescription><Balancer>Complete your payment to activate your selected plan.</Balancer></CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="rounded-lg border bg-secondary p-4 space-y-2">
            <h3 className="font-semibold text-lg">{plan.title}</h3>
            <div className="flex justify-between items-baseline">
                <span className="text-muted-foreground">Plan Price</span>
                <span className={appliedCoupon ? 'line-through text-muted-foreground' : 'font-bold'}>₹{finalPriceDetails.original.toFixed(2)}</span>
            </div>
             {appliedCoupon && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-baseline text-green-600 dark:text-green-400">
                    <span className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4"/>Coupon Discount</span>
                    <span className="font-bold">- ₹{finalPriceDetails.discount.toFixed(2)}</span>
                </motion.div>
            )}
            <div className="flex justify-between items-baseline text-2xl font-bold text-primary border-t pt-2 mt-2">
                <span>Total Amount</span>
                <motion.div key={finalPriceDetails.final} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <span>₹{finalPriceDetails.final.toFixed(2)}</span>
                </motion.div>
            </div>
          </div>

          <div className="space-y-3">
              <Label htmlFor="coupon-code">Have a Coupon Code?</Label>
              <div className="flex gap-2">
                  <Input id="coupon-code" placeholder="Enter code here" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} disabled={isVerifyingCoupon || !!appliedCoupon} />
                  <Button onClick={handleApplyCoupon} disabled={isVerifyingCoupon || !couponCode || !!appliedCoupon} className="whitespace-nowrap">
                      {isVerifyingCoupon && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                      {appliedCoupon ? <CheckCircle className="mr-2 h-4 w-4" /> : <Tag className="mr-2 h-4 w-4"/>}
                      {appliedCoupon ? 'Applied' : 'Apply'}
                  </Button>
              </div>
              {couponError && <p className="text-sm text-destructive">{couponError}</p>}
          </div>
          
          <div className="space-y-4 text-center pt-4">
            <h3 className="font-semibold">1. Scan to Pay ₹{finalPriceDetails.final.toFixed(2)}</h3>
            {qrCodeImage && (
              <div className="flex justify-center p-4 bg-white rounded-lg w-fit mx-auto">
                  <Image src={qrCodeImage.imageUrl} alt={qrCodeImage.description} width={220} height={220} data-ai-hint={qrCodeImage.imageHint} className="rounded-md" unoptimized />
              </div>
             )}
            <div>
              <p className="text-sm text-muted-foreground mt-2">Or pay directly to UPI ID:</p>
              <p className="font-mono text-lg font-semibold tracking-wider bg-muted inline-block px-3 py-1 rounded">8857051372@ptsbi</p>
            </div>
             <p className="text-muted-foreground pt-4 text-sm"><Balancer>2. After paying, click the button below to notify us. Your account will be activated by the admin after confirmation.</Balancer></p>
          </div>

          <form onSubmit={handlePaymentConfirmation}>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CheckCircle className="mr-2 h-5 w-5" />
              I Have Paid, Proceed to Verification
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground">
          <p><Balancer>Once your payment is verified by the administrator, your plan will be activated. You will be notified on your dashboard. If you face any issues, please contact support.</Balancer></p>
        </CardFooter>
      </Card>
    </div>
  );
}
