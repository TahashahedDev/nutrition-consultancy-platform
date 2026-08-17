
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Balancer } from 'react-wrap-balancer';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && user) {
        if (user.isAdmin) {
            router.push('/admin');
        } else {
            router.push('/dashboard');
        }
    }
  }, [user, isUserLoading, router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!auth || !firestore) {
        setError('Services not available. Please try again later.');
        setIsLoading(false);
        return;
    }
    if (displayName.trim().length < 2) {
      const message = 'Please enter your full name.';
      setError(message);
      toast({ variant: 'destructive', title: 'Invalid Name', description: message });
      setIsLoading(false);
      return;
    }
    if (!/^\d{10}$/.test(phoneNumber.trim())) {
      const message = 'Please enter a valid 10-digit phone number.';
      setError(message);
      toast({ variant: 'destructive', title: 'Invalid Phone Number', description: message });
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      const message = 'Password must be at least 6 characters long.';
      setError(message);
      toast({ variant: 'destructive', title: 'Weak Password', description: message });
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: displayName });

      await setDoc(doc(firestore, "users", user.uid), {
        displayName: displayName,
        email: user.email,
        phoneNumber: phoneNumber,
        createdAt: serverTimestamp(),
        isSubscribed: false, 
        isAdmin: false,
      });

      router.push('/dashboard');
      toast({
        title: 'Account Created!',
        description: "Welcome! You have been successfully logged in.",
      });
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already in use. Please login instead.';
          break;
        case 'auth/weak-password':
            errorMessage = 'Password is too weak. Please choose a stronger password.';
            break;
        case 'auth/invalid-email':
            errorMessage = 'The email address is not valid.';
            break;
        default:
            break;
      }
       toast({
        variant: 'destructive',
        title: 'Registration Failed',
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
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline"><Balancer>Create Your Account</Balancer></CardTitle>
          <CardDescription><Balancer>Start your journey to better health today.</Balancer></CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Jane Doe"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g. 9876543210"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Must be at least 6 characters"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
             {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
           <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline hover:text-primary">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
