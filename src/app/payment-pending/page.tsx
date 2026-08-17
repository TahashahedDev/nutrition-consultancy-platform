
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hourglass, Rocket } from 'lucide-react';
import { motion as m } from 'framer-motion';
import { Balancer } from 'react-wrap-balancer';
import { useUser } from '@/firebase';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * A page displayed to the user after they have indicated payment.
 * It shows a clear "waiting for verification" message and automatically
 * redirects if the user's status changes to active.
 * @returns {React.ReactElement} The payment pending page component.
 */
export default function PaymentPendingPage() {
  const { user } = useUser();
  const router = useRouter();

  // Effect to automatically redirect if the user becomes subscribed.
  useEffect(() => {
    if (user?.isSubscribed) {
      router.replace('/dashboard');
    }
  }, [user, router]);
  
  return (
    <div className="container flex min-h-[calc(100vh-10rem)] items-center justify-center p-4">
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="w-full max-w-md text-center shadow-lg overflow-hidden border-primary/20 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/40">
          <CardHeader className="bg-secondary/50 dark:bg-secondary/20 p-8">
            <m.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, scale: { type: "spring", stiffness: 300, damping: 10 } }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4"
            >
              <m.div
                animate={{
                  rotate: 360,
                  scale: [1, 1.1, 1, 1.1, 1],
                }}
                transition={{
                  rotate: { duration: 3, ease: "linear", repeat: Infinity },
                  scale: { duration: 2, ease: "easeInOut", repeat: Infinity, delay: 0.5 }
                }}
              >
                <Hourglass className="h-10 w-10 text-primary" />
              </m.div>
            </m.div>
            <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <CardTitle className="text-3xl font-headline text-primary"><Balancer>Verification in Progress</Balancer></CardTitle>
            </m.div>
          </CardHeader>
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <CardContent className="space-y-6 p-8">
              <p className="text-muted-foreground/80 text-sm">
                <Balancer>Your payment is being confirmed. Your dashboard will unlock automatically as soon as your plan is active.</Balancer>
              </p>
               <m.div 
                 className="flex items-center justify-center gap-3 rounded-lg bg-primary/10 p-4"
                 animate={{ scale: [1, 1.03, 1] }}
                 transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
               >
                  <Rocket className="h-6 w-6 text-primary" />
                  <p className="text-base font-bold text-primary"><Balancer>Activation is nearly instant!</Balancer></p>
              </m.div>
            </CardContent>
          </m.div>
        </Card>
      </m.div>
    </div>
  );
}
