
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, writeBatch, onSnapshot, getDocs, doc, Unsubscribe, orderBy, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Trash2, CheckCircle, XCircle, Hourglass, TrendingUp, Tag, FileText } from 'lucide-react';
import { subDays, format, addMonths } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Balancer } from 'react-wrap-balancer';
import { UserProfile, NutritionPlan } from '@/lib/types';
import { toDate } from '@/lib/utils';

/**
 * @interface AdminStats - Defines the shape of the statistics object for the admin dashboard.
 */
interface AdminStats {
  totalClients: number;
  activeSubscriptions: number;
  newClientsLast30Days: number;
}

/**
 * A memoized component to display a client's status as a badge.
 * @param {{ client: UserProfile }} props - The client profile object.
 * @returns {React.ReactElement} A rendered badge representing the client's status.
 */
const ClientStatusBadge = React.memo(function ClientStatusBadge({ client }: { client: UserProfile }) {
    if (client.isPaused) {
        return <Badge variant="outline" className="border-orange-500 text-orange-500"><Hourglass className="mr-1 h-3 w-3"/>Paused</Badge>;
    }
    if (client.isSubscribed) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 hover:bg-green-200"><CheckCircle className="mr-1 h-3 w-3"/>Active</Badge>;
    }
     if (client.isPaymentPending) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-500"><Hourglass className="mr-1 h-3 w-3"/>Pending</Badge>;
    }
    return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3"/>Inactive</Badge>;
});
ClientStatusBadge.displayName = 'ClientStatusBadge';


/**
 * The main admin dashboard page, showing client statistics and a list of all clients.
 */
export default function AdminDashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [usersData, setUsersData] = useState<UserProfile[]>([]);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Effect 1: Handle Authentication and Redirection
  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.push('/admin/login');
      return;
    }
    if (!user.isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const nutritionPlansQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'nutritionPlans')) : null, [firestore]);

  // Effect 2: Fetch Firestore Data ONLY after admin is verified
  useEffect(() => {
    if (!user?.isAdmin || !firestore) return;
    
    setIsLoading(true);
    
    const unsubscribes: Unsubscribe[] = [];

    const usersQuery = query(collection(firestore, 'users'), where('isAdmin', '!=', true));
    unsubscribes.push(onSnapshot(usersQuery, (snapshot) => {
      const clients = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as UserProfile));
      setUsersData(clients);

      const thirtyDaysAgo = subDays(new Date(), 30);
      setStats({
          totalClients: clients.length,
          activeSubscriptions: clients.filter(c => c.isSubscribed === true).length,
          newClientsLast30Days: clients.filter(c => toDate(c.createdAt) && toDate(c.createdAt)! >= thirtyDaysAgo).length
      });
      setIsLoading(false);
      
    }, (error) => {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch client list.' });
      setIsLoading(false);
    }));

    if (nutritionPlansQuery) {
        unsubscribes.push(onSnapshot(nutritionPlansQuery, (snapshot) => {
            setNutritionPlans(snapshot.docs.map(d => ({id: d.id, ...d.data()} as NutritionPlan)));
        }));
    }
    
    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, firestore, toast, nutritionPlansQuery]);


  const handleDeleteClient = useCallback(async (clientId: string) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available.' });
      return;
    }
    try {
      const batch = writeBatch(firestore);
      
      const userDocRef = doc(firestore, "users", clientId);
      batch.delete(userDocRef);

      const progressDataQuery = query(collection(firestore, `users/${clientId}/progressData`));
      const progressDataSnapshot = await getDocs(progressDataQuery);
      progressDataSnapshot.forEach(docSnap => batch.delete(docSnap.ref));
      
      const dietPlansQuery = query(collection(firestore, `users/${clientId}/dietPlans`));
      const dietPlansSnapshot = await getDocs(dietPlansQuery);
      dietPlansSnapshot.forEach(docSnap => batch.delete(docSnap.ref));
      
      const adminNotesQuery = query(collection(firestore, 'adminNotes'), where('clientId', '==', clientId));
      const adminNotesSnapshot = await getDocs(adminNotesQuery);
      adminNotesSnapshot.forEach(docSnap => batch.delete(docSnap.ref));
      
      await batch.commit();

      toast({ title: 'Client Deleted', description: 'The client and all their associated data have been removed. NOTE: This does not delete their login account from Firebase Authentication.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the client and their data.' });
    }
  }, [firestore, toast]);
  

  if (isUserLoading || isLoading || !user?.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10 space-y-8 px-4">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-headline font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            <Balancer>Manage your clients, plans, and monitor your business growth.</Balancer>
          </p>
        </div>
        <div className="flex items-center gap-4">
            <Button asChild>
                <Link href="/admin/plans"><FileText className="mr-2 h-4 w-4" />Manage Nutrition Plans</Link>
            </Button>
             <Button asChild variant="outline">
                <Link href="/admin/coupons"><Tag className="mr-2 h-4 w-4" />Manage Coupons</Link>
            </Button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {stats?.totalClients ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">Total registered users</p>
            </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {stats?.activeSubscriptions ?? 0}
                </div>
                 <p className="text-xs text-muted-foreground">Currently subscribed clients</p>
            </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">New Clients (30d)</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {stats?.newClientsLast30Days ?? 0}
                </div>
                 <p className="text-xs text-muted-foreground">Clients joined in the last 30 days</p>
            </CardContent>
        </Card>
      </div>

      <div>
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users /> Client List</CardTitle>
                  <CardDescription>An overview of all registered clients. Click to manage.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="w-full overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead className="hidden md:table-cell">Phone Number</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usersData.length > 0 ? (
                            usersData.map((client) => (
                              <TableRow key={client.id} className="align-middle">
                                <TableCell>
                                    <div className="font-medium">{client.displayName || 'N/A'}</div>
                                    <div className="text-xs text-muted-foreground">{client.email}</div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell whitespace-nowrap">{client.phoneNumber || 'N/A'}</TableCell>
                                <TableCell><ClientStatusBadge client={client} /></TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                      <Button asChild size="sm" variant="outline">
                                          <Link href={`/admin/client/${client.id}`} rel="noopener noreferrer">Manage</Link>
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                              <Trash2 className="h-4 w-4" />
                                              <span className="sr-only">Delete</span>
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              <Balancer>This action cannot be undone. This will permanently delete the client's profile and all associated data like progress logs and diet plans.</Balancer>
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteClient(client.id)}>
                                              Yes, delete client
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center h-24">No clients have registered yet.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
