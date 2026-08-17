
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore } from '@/firebase';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Balancer } from 'react-wrap-balancer';
import type { NutritionPlan } from '@/lib/types';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { toDate } from '@/lib/utils';

export function Plans() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [plansData, setPlansData] = useState<NutritionPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (!firestore) {
        setIsLoadingPlans(true);
        return;
    };
    
    setIsLoadingPlans(true);
    const plansQuery = query(collection(firestore, 'nutritionPlans'), orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(plansQuery, (snapshot) => {
        const plans: NutritionPlan[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                price: data.price,
                description: data.description,
                durationMonths: data.durationMonths,
                features: data.features || [],
                isPopular: data.isPopular || false,
                recommendation: data.recommendation || '',
                createdAt: toDate(data.createdAt),
            };
        });
        setPlansData(plans);
        setIsLoadingPlans(false);
    }, (error) => {
        console.error("Error fetching plans: ", error);
        toast({ variant: 'destructive', title: 'Error Loading Plans', description: 'Could not fetch plans. Please try again later.' });
        setIsLoadingPlans(false);
    });

    return () => unsubscribe();
  }, [firestore, toast]);


  const handleChoosePlan = useCallback((planId: string) => {
    if (!user) {
      toast({
        title: 'Please Login',
        description: 'You need to be logged in to choose a plan.',
        action: (<Button onClick={() => router.push(`/login?redirect=/checkout/${planId}`)}>Login</Button>),
      });
      router.push(`/login?redirect=/checkout/${planId}`);
    } else if (user.isSubscribed) {
        toast({ title: 'Already Subscribed', description: 'You already have an active nutrition plan.' });
    } else {
      router.push(`/checkout/${planId}`);
    }
  }, [user, router, toast]);
  
  const isSubscribed = user?.isSubscribed || false;
  const isLoading = isUserLoading || isLoadingPlans;

  return (
    <motion.section 
        ref={ref}
        id="services" 
        className="w-full py-16 md:py-24 lg:py-32 bg-background"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 50 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-primary">Services & Pricing</h2>
          <p className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            <Balancer>Invest in Your Health</Balancer>
          </p>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
            <Balancer>Choose a plan that suits your journey. Each program is designed to provide you with the tools, support, and knowledge for lasting success.</Balancer>
          </p>
        </div>

        {isLoading && (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )}

        {!isLoading && plansData.length > 0 && (
            <>
            {isSubscribed && (
                 <Card className="max-w-2xl mx-auto border-2 border-green-500 bg-green-50 dark:bg-green-900/30 text-center shadow-md mb-12">
                    <CardHeader>
                        <Zap className="mx-auto h-10 w-10 text-green-600 mb-2" />
                        <CardTitle className="text-2xl font-semibold text-green-800 dark:text-green-200"><Balancer>You have an Active Plan!</Balancer></CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-green-700 dark:text-green-300">
                         <Balancer>Welcome! You can access your personalized diet and tracking from your dashboard.</Balancer>
                        </p>
                        <Button asChild>
                            <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch justify-center">
            {plansData.map((plan, index) => {
                return (
                <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.1 }}
                    whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
                    className="h-full"
                >
                    <Card 
                        className={cn(
                        "flex flex-col h-full overflow-hidden transition-shadow duration-300",
                        plan.isPopular ? "border-primary border-2 shadow-lg" : "bg-secondary",
                        isSubscribed ? "opacity-60" : "hover:shadow-xl"
                        )}
                    >
                        {plan.isPopular && (
                        <div className="bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold text-center">
                            Most Popular
                        </div>
                        )}
                        <CardHeader className="pt-6">
                        <CardTitle><Balancer>{plan.title}</Balancer></CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-6">
                        <div className="text-4xl font-bold">{plan.price}</div>
                        <CardDescription className="min-h-[40px]"><Balancer>{plan.description}</Balancer></CardDescription>
                        {plan.recommendation && (
                            <p className="text-sm font-semibold text-primary"><Balancer>{plan.recommendation}</Balancer></p>
                        )}
                        <ul className="space-y-3">
                            {plan.features?.map((feature) => (
                            <li key={feature} className="flex items-start gap-3">
                                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                                <span className="text-sm text-foreground">{feature}</span>
                            </li>
                            ))}
                        </ul>
                        </CardContent>
                        <CardFooter>
                         <Button 
                            className="w-full" 
                            variant={plan.isPopular ? 'default' : 'outline'}
                            onClick={() => handleChoosePlan(plan.id)}
                            disabled={isSubscribed}
                          >
                            {isSubscribed ? 'Plan Active' : 'Choose Plan'}
                          </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
                );
            })}
            </div>
            </>
        )}
         {!isLoading && plansData.length === 0 && (
          <div className="text-center text-muted-foreground bg-secondary p-8 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Plans Coming Soon</h3>
            <p>The nutrition plans are being finalized. Please check back shortly!</p>
          </div>
        )}
      </div>
    </motion.section>
  );
}
