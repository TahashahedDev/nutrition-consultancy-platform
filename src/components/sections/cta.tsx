
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Balancer } from 'react-wrap-balancer';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';


/**
 * The Call-to-Action (CTA) section for the homepage.
 * Includes scroll-triggered animations.
 * @returns {React.ReactElement} The CTA section component.
 */
export function Cta() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  const consultationMessage = encodeURIComponent("Hello Sara, I'd like to book a free consultation.");

  return (
    <motion.section 
      ref={ref}
      id="cta" 
      className="relative w-full py-16 md:py-24 lg:py-32 bg-primary text-primary-foreground"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 50 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
       <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(40%_100%_at_0%_0%,hsl(var(--accent)/0.3),transparent)]"
        />
      <div className="container px-4 md:px-6">
        <div className="max-w-3xl text-center mx-auto space-y-6">
          <h2 className="font-headline text-3xl md:text-4xl font-bold">
            <Balancer>Ready to Take Control of Your Health?</Balancer>
          </h2>
          <p className="text-lg text-primary-foreground/80">
            <Balancer>Let's work together to build a sustainable, healthy lifestyle that you love. Book your free consultation today to get started.</Balancer>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <a href={`https://wa.me/918308725353?text=${consultationMessage}`} target="_blank" rel="noopener noreferrer">
                Book a Free Consultation
              </a>
            </Button>
             <Button asChild size="lg" variant="outline" className="bg-transparent border border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link href="/#contact">Send a Message</Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
