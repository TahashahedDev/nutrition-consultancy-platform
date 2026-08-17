
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Balancer } from 'react-wrap-balancer';
import { motion } from 'framer-motion';

/**
 * The Hero section for the homepage. This is the first thing users see.
 * It now includes animations for a more engaging entry.
 * @returns {React.ReactElement} The Hero section component.
 */
export function Hero() {
  const consultationMessage = encodeURIComponent("Hello Sara, I saw your website and I'm interested in a free consultation.");
  
  return (
    <section id="home" className="relative w-full py-24 lg:py-40 flex items-center bg-secondary/50 overflow-hidden">
      <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(40%_100%_at_100%_0%,hsl(var(--primary)/0.1),transparent)] dark:bg-[radial-gradient(40%_100%_at_100%_0%,hsl(var(--primary)/0.2),transparent)]"
        />
      <div className="relative z-10 container px-4 md:px-6">
        <motion.div 
            className="max-w-3xl text-center mx-auto space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            <Balancer>Your Journey to a Healthier You Starts Here</Balancer>
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
            <Balancer>Personalized nutrition coaching to help you achieve your wellness goals, feel great, and live a vibrant life.</Balancer>
          </p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            <Button asChild size="lg">
              <Link href="/#services">Explore Services</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={`https://wa.me/918308725353?text=${consultationMessage}`} target="_blank" rel="noopener noreferrer">
                Book a Free Consultation
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
