
'use client';

import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Balancer } from 'react-wrap-balancer';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

/**
 * The "About Me" section for the homepage.
 * Includes scroll-triggered animations.
 * @returns {React.ReactElement} The About section component.
 */
export function About() {
  const qualifications = [
    'Certified Nutrition Specialist (CNS)',
    'Bachelor of Science in Nutrition and Dietetics',
    'Specialist in Weight Management & Gut Health',
    'Evidence-Based Nutritional Guidance',
  ];

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  return (
    <motion.section 
      ref={ref}
      id="about" 
      className="w-full py-16 md:py-24 lg:py-32 bg-background"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 50 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="container px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-primary">About Me</h2>
              <h3 className="font-headline text-3xl md:text-4xl font-bold">
                <Balancer>Your Partner in Health & Wellness</Balancer>
              </h3>
            </div>
            <p className="text-muted-foreground md:text-lg">
              <Balancer>I'm Sara Shahed, a passionate and certified nutrition consultant dedicated to helping individuals transform their lives through the power of food. My philosophy is rooted in a science-based, personalized approach. I don't believe in restrictive diets, but in building sustainable, healthy habits that nourish your body and mind.</Balancer>
            </p>
            <p className="text-muted-foreground md:text-lg">
              <Balancer>Together, we'll create a customized plan that fits your lifestyle, preferences, and health goals, empowering you to achieve lasting results.</Balancer>
            </p>
          </div>
           <Card className="bg-secondary/50 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
             <CardContent className="p-8">
                <h4 className="font-semibold text-lg mb-4">My Core Qualifications</h4>
                <ul className="space-y-3">
                  {qualifications.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
             </CardContent>
           </Card>
        </div>
      </div>
    </motion.section>
  );
}
