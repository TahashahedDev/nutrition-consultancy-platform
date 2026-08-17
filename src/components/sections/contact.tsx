
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone } from 'lucide-react';
import { Balancer } from 'react-wrap-balancer';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';


/**
 * The "Contact" section for the homepage.
 * Provides direct contact options like WhatsApp and email.
 * Includes scroll-triggered animations.
 * @returns {React.ReactElement} The Contact section component.
 */
export function Contact() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const chatMessage = encodeURIComponent("Hello Sara, I'm interested in learning more about your nutrition plans.");
  const callbackMessage = encodeURIComponent("Hello Sara, I'm visiting your website and would like to request a callback.");
  
  return (
    <motion.section 
      ref={ref}
      id="contact" 
      className="w-full py-16 md:py-24 lg:py-32 bg-background"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 50 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-primary">Get in Touch</h2>
          <p className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            <Balancer>Start Your Journey Today</Balancer>
          </p>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
            <Balancer>Have questions or ready to book? Connect with me directly using the options below.</Balancer>
          </p>
        </div>
        <div className="mx-auto w-full max-w-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: inView ? 1 : 0, scale: inView ? 1 : 0.9 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
            >
              <Card className="shadow-lg transition-shadow duration-300 hover:shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-6 w-6 text-primary"/>
                    Direct Contact
                  </CardTitle>
                  <CardDescription><Balancer>For immediate inquiries, feel free to reach out.</Balancer></CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                   <p className="text-muted-foreground text-sm"><Balancer>Send a message on WhatsApp for the quickest response, request a callback, or send an email.</Balancer></p>
                  <div className="space-y-3">
                    <Button asChild size="lg" className="w-full">
                      <a href={`https://wa.me/918308725353?text=${chatMessage}`} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="w-full">
                      <a href={`https://wa.me/918308725353?text=${callbackMessage}`} target="_blank" rel="noopener noreferrer">Request a Callback</a>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="w-full">
                      <a href="mailto:sarashabbirshahed@gmail.com"><Mail className="mr-2 h-4 w-4" />Send an Email</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
