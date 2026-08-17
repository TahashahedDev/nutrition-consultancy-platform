
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Balancer } from 'react-wrap-balancer';

/**
 * @constant ADMIN_EMAIL The static email address for the administrator account.
 */
const ADMIN_EMAIL = 'admin@sarashahed.com';

/**
 * A page for the one-time creation of the admin account.
 * This should only be used once to set up the administrator.
 * @returns {React.ReactElement} The admin creation page component.
 */
export default function CreateAdminPage() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  /**
   * Handles the sign-up process for the admin user.
   * It creates an authentication entry and a corresponding user profile in Firestore.
   * @param {React.FormEvent} e - The form event.
   */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!auth || !firestore) {
        setError('Services not available. Please try again later.');
        setIsLoading(false);
        return;
    }

    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setIsLoading(false);
        return;
    }

    try {
      // Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, password);
      const user = userCredential.user;

      // Create the admin user profile in Firestore, setting the crucial `isAdmin` flag.
      // This flag will be read by a backend process to set the custom claim.
      await setDoc(doc(firestore, "users", user.uid), {
        email: user.email,
        createdAt: serverTimestamp(),
        isAdmin: true, // This flag is used by backend logic to set the custom auth claim.
        isSubscribed: true, // Admins should have access to all features.
      });

      // NOTE: A backend function (triggered by this document creation) is responsible
      // for setting the `isAdmin: true` custom claim on the user's auth token.
      // This is a more secure and robust approach for role-based access control.

      router.push('/admin');
      toast({
        title: 'Admin Account Created!',
        description: "You have been successfully logged in.",
      });
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This admin account has already been created. Please login instead.';
          break;
        case 'auth/weak-password':
            errorMessage = 'Password is too weak. Please choose a stronger password.';
            break;
        default:
            break;
      }
       toast({
        variant: 'destructive',
        title: 'Admin Creation Failed',
        description: errorMessage,
      });
      setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline"><Balancer>Create Admin Account</Balancer></CardTitle>
          <CardDescription><Balancer>This is a one-time setup for the administrator.</Balancer></CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                value={ADMIN_EMAIL}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Choose a strong password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
             {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Admin & Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
