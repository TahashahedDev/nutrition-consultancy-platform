
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Balancer } from 'react-wrap-balancer';

/**
 * @constant ADMIN_EMAIL The static email address for the administrator account.
 */
const ADMIN_EMAIL = 'admin@sarashahed.com';

/**
 * A login page specifically for the administrator.
 * @returns {React.ReactElement} The admin login page component.
 */
export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();

  // Redirect if user is already logged in
  useEffect(() => {
    if (!isUserLoading && user) {
        if (user.isAdmin) {
            router.push('/admin');
        } else {
            router.push('/dashboard');
        }
    }
  }, [user, isUserLoading, router]);

  /**
   * Handles the sign-in process. It checks if the email matches the admin email
   * before attempting to sign in with Firebase Authentication.
   * @param {React.FormEvent} e - The form event.
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!auth) {
      setError('Authentication service is not available.');
      setIsLoading(false);
      return;
    }
    
    // Ensure only the admin can attempt to log in through this page.
    if (email.toLowerCase() !== ADMIN_EMAIL) {
        setError('This login is for administrators only.');
        setIsLoading(false);
        return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin');
      toast({ title: 'Admin login successful!' });

    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      switch (error.code) {
        case 'auth/user-not-found':
           errorMessage = 'Admin account not found. Please create one first.';
           break;
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        default:
          break;
      }
       toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center bg-secondary px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">
            <Balancer>Admin Login</Balancer>
          </CardTitle>
          <CardDescription>
            <Balancer>Enter your admin credentials to access the dashboard.</Balancer>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@sarashahed.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>              
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
             {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
