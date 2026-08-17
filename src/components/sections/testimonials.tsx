
'use client';

import * as React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Balancer } from 'react-wrap-balancer';
import Autoplay from 'embla-carousel-autoplay';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

/**
 * @constant testimonials An array of client testimonial objects.
 */
const testimonials = [
  {
    name: 'Priya S.',
    location: 'Mumbai',
    quote: "Sara's guidance was a game-changer for me. I not only lost weight but also gained so much energy. Her approach is realistic and sustainable. I can't recommend her enough!",
  },
  {
    name: 'Amit R.',
    location: 'Delhi',
    quote: "I had been struggling with digestive issues for years. Sara's personalized plan and deep knowledge of gut health helped me finally find relief and understand my body better.",
  },
  {
    name: 'Sneha K.',
    location: 'Bangalore',
    quote: "Working with Sara felt like having a true partner in my health journey. She's incredibly supportive, knowledgeable, and her passion for nutrition is contagious. Truly transformative!",
  },
  {
    name: 'Rajiv M.',
    location: 'Pune',
    quote: "The 6-month transformation plan was worth every penny. I've learned habits that will last a lifetime. Sara is professional, empathetic, and truly cares about her clients' success.",
  },
];

/**
 * The "Testimonials" section for the homepage, displayed in a carousel.
 * It now autoplays and includes scroll-triggered animations.
 * @returns {React.ReactElement} The Testimonials section component.
 */
export function Testimonials() {
  const plugin = React.useRef(
    Autoplay({ delay: 1000, stopOnInteraction: true })
  );

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.section 
      ref={ref}
      id="testimonials" 
      className="relative w-full py-16 md:py-24 lg:py-32 bg-secondary overflow-hidden"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 50 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(40%_100%_at_50%_0%,hsl(var(--primary)/0.1),transparent)] dark:bg-[radial-gradient(40%_100%_at_50%_0%,hsl(var(--primary)/0.15),transparent)]"
        />
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-primary">What Clients Say</h2>
          <p className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            <Balancer>Success Stories</Balancer>
          </p>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
            <Balancer>Hear from individuals who have transformed their health with personalized guidance from Sara Shahed.</Balancer>
          </p>
        </div>

        <Carousel
          plugins={[plugin.current]}
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full max-w-4xl mx-auto"
          aria-roledescription="carousel"
        >
          <CarouselContent className="-ml-4">
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <motion.div 
                  className="p-1 h-full"
                  whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                >
                  <Card className="h-full flex flex-col bg-background shadow-sm">
                    <CardContent className="p-6 flex-grow flex flex-col justify-between">
                      <blockquote className="text-lg font-semibold leading-snug">
                        “{testimonial.quote}”
                      </blockquote>
                      <div className="mt-6">
                        <p className="font-bold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </div>
    </motion.section>
  );
}
