
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Balancer } from 'react-wrap-balancer';
import { motion } from 'framer-motion';

/**
 * A page for users to request a password reset email.
 * This component is optimized for a smooth user experience with clear states.
 * @returns {React.ReactElement} The forgot password page component.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

  /**
   * Handles the password reset request.
   * It uses Firebase Authentication to send a reset link to the provided email.
   * @param {React.FormEvent} e - The form event.
   */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!auth) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Authentication service not available. Please try again later.',
        });
        setIsLoading(false);
        return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Reset Link Sent!',
        description: 'Please check your email inbox (and spam folder) for the password reset link.',
      });
      setIsSubmitted(true);
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account was found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        default:
          break;
      }
      toast({
        variant: 'destructive',
        title: 'Request Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">
            <Balancer>Forgot Password</Balancer>
          </CardTitle>
          <CardDescription>
            <Balancer>
                {isSubmitted 
                ? "You can now close this page." 
                : "Enter your email and we'll send you a link to reset your password."
                }
            </Balancer>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
             <motion.div 
                className="text-center space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
             >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-muted-foreground"><Balancer>If an account with that email exists, a password reset link has been sent.</Balancer></p>
                <Button asChild variant="secondary" className="w-full">
                    <Link href="/login">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                    </Link>
                </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </form>
          )}
           <div className="mt-4 text-center text-sm">
            Remember your password?{' '}
            <Link href="/login" className="underline hover:text-primary">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    