'use client';

import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useDietPlans } from '@/hooks/data/useDietPlans';
import { useClientData } from '@/hooks/data/useClientData';
import { Loader2, Zap, Send, Calendar as CalendarIcon, CheckCircle, Quote, PauseCircle, Info, CalendarClock, Weight, Ruler, Hourglass, XCircle, BarChart3, ListTodo, ChevronLeft, ChevronRight, Rocket } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isToday, differenceInDays, endOfDay, startOfDay } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Balancer } from 'react-wrap-balancer';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DietPlan, ClientData, DayPlan, Meal } from '@/lib/types';
import { LogProgressForm } from '@/components/dashboard/LogProgressForm';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toDate } from '@/lib/utils';
import { doc, updateDoc, collection, writeBatch } from 'firebase/firestore';


const motivationalQuotes = [
  "The greatest wealth is health.",
  "Your body is your most priceless possession. Take care of it.",
  "A healthy outside starts from the inside.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "Believe you can and you're halfway there.",
  "The only bad workout is the one that didn't happen.",
  "Eat to live, don't live to eat.",
  "It's not a diet, it's a lifestyle change.",
  "Take care of your body. It's the only place you have to live.",
  "Every step is progress, no matter how small.",
];

const groupClientDataBySubmission = (data: ClientData[]): ClientData[] => {
  if (!data || data.length === 0) return [];
  const submissionsMap = new Map<string, ClientData>();
  const sortedData = [...data].sort((a, b) => {
      const dateA = toDate(a.date)?.getTime() || 0;
      const dateB = toDate(b.date)?.getTime() || 0;
      return dateA - dateB;
  });
  sortedData.forEach(entry => {
      const date = toDate(entry.date);
      if (!date || !entry.type || typeof entry.value !== 'number') return;
      const submissionKey = date.toISOString();
      const metricType = entry.type;
      const existingEntry = submissionsMap.get(submissionKey) || {
          id: submissionKey, 
          date: entry.date,
      };
      const updatedEntry = { ...existingEntry, [metricType]: entry.value };
      submissionsMap.set(submissionKey, updatedEntry as ClientData);
  });
  const grouped = Array.from(submissionsMap.values());
  return grouped.sort((a, b) => {
      const dateA = toDate(a.date)?.getTime() || 0;
      const dateB = toDate(b.date)?.getTime() || 0;
      return dateB - dateA;
  });
};

const MealItem = React.memo(function MealItem({ meal, index, user, selectedPlan, selectedDayInfo, isConfirmingMeal, onConfirmMeal }: {
    meal: Meal;
    index: number;
    user: ReturnType<typeof useUser>['user'];
    selectedPlan: DietPlan;
    selectedDayInfo: { dayNumber: number; dayPlan: DayPlan; };
    isConfirmingMeal: string | null;
    onConfirmMeal: (planId: string, dayId: string, mealId: string) => void;
}) {
    const messageBody = `
Hello Sara,
This is a meal photo submission from:
Client: ${user?.displayName || user?.email}
---
[MEAL LOG]
Day: ${selectedDayInfo?.dayNumber}
Meal Time: ${meal.time}
Meal: ${meal.description.split('\n')[0]}
---
    `.trim();
    const whatsAppMessage = encodeURIComponent(messageBody);
    const whatsAppLink = `https://wa.me/918308725353?text=${whatsAppMessage}`;

    const handleConfirmClick = useCallback(() => {
      onConfirmMeal(selectedPlan.id, selectedDayInfo.dayPlan.id, meal.id);
    }, [onConfirmMeal, selectedPlan.id, selectedDayInfo.dayPlan.id, meal.id]);

    return (
        <motion.div
            key={meal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
        >
            <AccordionItem value={`item-${index}`}>
                <AccordionTrigger className="text-lg font-semibold hover:no-underline data-[state=open]:text-primary">
                    <div className="flex items-center gap-4">
                        <Badge variant={meal.photoSubmitted ? "default" : "secondary"} className={cn("text-base", meal.photoSubmitted ? "bg-green-600 hover:bg-green-700" : "")}>{meal.time}</Badge>
                        <span>Meal {index + 1}</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2">
                        <h4 className="font-semibold text-base">Recipe & Instructions</h4>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap rounded-md border p-4 bg-secondary/30 break-words">{meal.description}</div>
                    </div>
                    <div className="bg-secondary/50 p-4 space-y-4 flex flex-col justify-center transition-all hover:shadow-md rounded-lg">
                        <h4 className="font-semibold text-base">Submit Photo</h4>
                        <p className="text-xs text-muted-foreground">First, send your photo on WhatsApp, then confirm here.</p>
                        {meal.photoSubmitted ? (<Button className="w-full" variant="secondary" disabled><CheckCircle className="mr-2 h-4 w-4"/>Submitted</Button>) : (
                            <div className="space-y-2">
                                <Button asChild className="w-full"><a href={whatsAppLink} target="_blank" rel="noopener noreferrer">Send Photo on WhatsApp</a></Button>
                                <Button className="w-full" variant="outline" onClick={handleConfirmClick} disabled={isConfirmingMeal === meal.id}>{isConfirmingMeal === meal.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}I have sent the photo</Button>
                            </div>
                        )}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </motion.div>
    );
});
MealItem.displayName = 'MealItem';

function useProgressLogger(userId: string | null | undefined, onFormSuccess: () => void) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmittingProgress, setIsSubmittingProgress] = useState(false);
    const handleLogData = useCallback(async (formData: Record<string, string>) => {
        if (!firestore || !userId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the database.' });
            return;
        }
        const requiredFields = ['weight', 'waist', 'chest', 'hip', 'thighs'];
        for (const field of requiredFields) {
            const value = parseFloat(formData[field]);
            if (!formData[field] || isNaN(value) || value <= 0) {
                toast({ variant: 'destructive', title: 'Invalid Input', description: `Please enter a valid, positive number for "${field}".` });
                return;
            }
        }
        setIsSubmittingProgress(true);
        try {
            const now = new Date();
            const collectionRef = collection(firestore, `users/${userId}/progressData`);
            const batch = writeBatch(firestore);
            requiredFields.forEach(field => {
                 const dataRef = doc(collectionRef);
                 batch.set(dataRef, {
                    value: parseFloat(formData[field]),
                    type: field,
                    date: now,
                 });
            });
            await batch.commit();
            
            toast({ title: 'Success!', description: 'Your progress has been logged.' });
            onFormSuccess();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Submission Error', description: error.message || 'There was a problem saving your data.' });
        } finally {
            setIsSubmittingProgress(false);
        }
    }, [firestore, userId, toast, onFormSuccess]);
    return { handleLogData, isSubmittingProgress };
}

const SubscribedDashboard = React.memo(function SubscribedDashboard() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { plans: dietPlans, isLoading: isLoadingPlans } = useDietPlans(user?.uid);
    const { data: clientData, isLoading: isLoadingData } = useClientData(user?.uid);
    const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));
    const [currentWeek, setCurrentWeek] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [isConfirmingMeal, setIsConfirmingMeal] = useState<string | null>(null);
    const [formKey, setFormKey] = useState(Date.now());
    const isLoading = isLoadingPlans || isLoadingData;

    const quoteForSelectedDay = useMemo(() => {
        const dayOfMonth = selectedDate.getDate();
        return motivationalQuotes[dayOfMonth % motivationalQuotes.length];
    }, [selectedDate]);

    const expirationInfo = useMemo(() => {
        if (!user?.isSubscribed || !user.subscriptionEndDate) return { isExpiringSoon: false, daysLeft: 0 };
        const endDate = toDate(user.subscriptionEndDate);
        if (!endDate) return { isExpiringSoon: false, daysLeft: 0 };
        const daysLeft = differenceInDays(endOfDay(endDate), startOfDay(new Date()));
        return { isExpiringSoon: daysLeft <= 7 && daysLeft >= 0, daysLeft: Math.max(0, daysLeft) };
    }, [user]);

    const processedPlans = useMemo(() => {
        return dietPlans
            .map(p => ({ ...p, startDate: toDate(p.startDate) }))
            .filter(p => p.startDate)
            .map(p => ({ ...p, startDate: startOfDay(p.startDate as Date), endDate: p.days.length > 0 ? endOfDay(addDays(startOfDay(p.startDate as Date), p.days.length - 1)) : null }));
    }, [dietPlans]);
    
    const getPlanForDate = useCallback((date: Date): { plan: DietPlan; dayPlan: DayPlan, dayNumber: number } | null => {
        const normalizedTargetDate = startOfDay(date);
        for (const plan of processedPlans) {
            if (!plan.startDate || !plan.endDate) continue;
            if (normalizedTargetDate >= plan.startDate && normalizedTargetDate <= plan.endDate) {
                const dayNumber = differenceInDays(normalizedTargetDate, plan.startDate) + 1;
                if (dayNumber > 0 && dayNumber <= plan.days.length) {
                    const correctDay = plan.days.find(d => d.day === dayNumber);
                    if (correctDay) return { plan: plan as DietPlan, dayPlan: correctDay, dayNumber };
                }
            }
        }
        return null;
    }, [processedPlans]);

    const startDate = useMemo(() => toDate(user?.subscriptionStartDate), [user?.subscriptionStartDate]);
    const endDate = useMemo(() => toDate(user?.subscriptionEndDate), [user?.subscriptionEndDate]);

    const handleConfirmMealSubmission = useCallback(async (planId: string, dayId: string, mealId: string) => {
        if (!firestore || !user?.uid) return;
        setIsConfirmingMeal(mealId);
        try {
            const planToUpdate = dietPlans.find(p => p.id === planId);
            if (!planToUpdate) throw new Error("Plan not found.");
            
            const updatedDays: DayPlan[] = JSON.parse(JSON.stringify(planToUpdate.days));
            
            const dayIndex = updatedDays.findIndex((d) => d.id === dayId);
            if (dayIndex === -1) throw new Error("Day not found.");
            
            const mealIndex = updatedDays[dayIndex].meals.findIndex((m) => m.id === mealId);
            if (mealIndex === -1) throw new Error("Meal not found.");

            updatedDays[dayIndex].meals[mealIndex].photoSubmitted = true;
            
            const planRef = doc(firestore, `users/${user.uid}/dietPlans`, planId);
            await updateDoc(planRef, { days: updatedDays });

            toast({ title: 'Meal Logged!', description: 'Great job staying on track!', className: 'bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-700' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not confirm submission.' });
        } finally {
            setIsConfirmingMeal(null);
        }
    }, [firestore, user?.uid, dietPlans, toast]);
    
    const onFormSuccess = useCallback(() => setFormKey(Date.now()), []);
    const { handleLogData, isSubmittingProgress } = useProgressLogger(user?.uid, onFormSuccess);
    const sortedHistoryData = useMemo(() => groupClientDataBySubmission(clientData), [clientData]);
    
    const chartData = useMemo(() => {
      if (!sortedHistoryData || sortedHistoryData.length === 0) return [];
      const chartPoints = sortedHistoryData.map(entry => {
          const date = toDate(entry.date);
          if (!date) return null;
          return {
            date: format(date, 'MMM d'),
            weight: entry.weight,
            waist: entry.waist,
            chest: entry.chest,
            hip: entry.hip,
            thighs: entry.thighs
          };
      }).filter((p): p is NonNullable<typeof p> => p !== null);
      return chartPoints.reverse(); 
    }, [sortedHistoryData]);
    
    const weekDays = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(currentWeek, i)), [currentWeek]);
    const selectedDayInfo = useMemo(() => getPlanForDate(selectedDate), [selectedDate, getPlanForDate]);
    const selectedDayPlan = selectedDayInfo?.dayPlan;
    const selectedPlan = selectedDayInfo?.plan;
    
    const handleSelectDate = useCallback((day: Date) => setSelectedDate(day), []);
    const handleChangeWeek = useCallback((direction: 'next' | 'prev') => setCurrentWeek(prev => addDays(prev, direction === 'next' ? 7 : -7)), []);

    if (isLoading) {
        return <div className="flex min-h-[calc(100vh-20rem)] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }
    
    if (user?.isPaused) {
        const resumeMessage = encodeURIComponent(`Hello Sara, I would like to resume my plan. My registered email is: ${user.email}`);
        return (
          <Card className="max-w-2xl mx-auto border-2 border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-center shadow-md">
            <CardHeader>
              <PauseCircle className="mx-auto h-12 w-12 text-orange-600 mb-4" />
              <CardTitle className="text-2xl font-semibold text-orange-800 dark:text-orange-200"><Balancer>Your Plan is Paused</Balancer></CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700 dark:text-orange-300"><Balancer>Your nutrition plan is currently on hold. Your subscription end date will be extended accordingly. Please contact us to resume your plan.</Balancer></p>
                <Button asChild variant="outline" className="mt-4"><a href={`https://wa.me/918308725353?text=${resumeMessage}`} target="_blank" rel="noopener noreferrer">Contact to Resume</a></Button>
            </CardContent>
          </Card>
        );
    }

    return (
        <div className="space-y-6">
            {expirationInfo.isExpiringSoon && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="bg-yellow-50 dark:bg-yellow-900/40 border-yellow-400 text-yellow-800 dark:text-yellow-200">
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                            <Info className="w-6 h-6" />
                            <div className="flex-1">
                                <CardTitle className="text-lg">Your Plan is Expiring Soon!</CardTitle>
                                <CardDescription className="text-yellow-700 dark:text-yellow-300">Your plan expires in {expirationInfo.daysLeft} day{expirationInfo.daysLeft !== 1 ? 's' : ''}. Renew now to continue your journey without interruption.</CardDescription>
                            </div>
                            <Button asChild variant="secondary" size="sm"><Link href="/#services">Renew Plan</Link></Button>
                        </CardHeader>
                    </Card>
                </motion.div>
            )}
            <header className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-headline font-bold tracking-tight break-words text-center"><Balancer>Welcome, {user?.displayName || user?.email}</Balancer></h1>
                <p className="text-muted-foreground max-w-2xl mx-auto text-center"><Balancer>This is your personal space to track your nutrition journey.</Balancer></p>
            </header>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="overflow-hidden shadow-sm transition-all hover:shadow-md bg-secondary/50">
                    <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(60%_100%_at_0%_0%,hsl(var(--primary)/0.05),transparent)] dark:bg-[radial-gradient(60%_100%_at_0%_0%,hsl(var(--primary)/0.1),transparent)]" />
                    <CardContent className="p-4 flex flex-col items-center gap-4 text-center">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Quote className="h-4 w-4" />
                            <Balancer>{quoteForSelectedDay}</Balancer>
                        </div>
                        <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">Start Date:</span>
                                <span className="text-muted-foreground">{startDate ? format(startDate, 'PPP') : 'N/A'}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">End Date:</span>
                                <span className="text-muted-foreground">{endDate ? format(endDate, 'PPP') : 'N/A'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
            <Tabs defaultValue="diet-plan" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto">
                    <TabsTrigger value="diet-plan"><ListTodo className="w-4 h-4 mr-2"/>My Diet Plan</TabsTrigger>
                    <TabsTrigger value="progress"><BarChart3 className="w-4 h-4 mr-2"/>My Progress</TabsTrigger>
                </TabsList>
                <TabsContent value="diet-plan" className="pt-6">
                    {processedPlans.length === 0 ? <div className="text-center py-10 bg-secondary/50 rounded-lg"><p className="text-muted-foreground">Your personalized diet plan will appear here once the administrator creates it.</p></div> :
                    (
                        <div className="space-y-6">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <Card className="shadow-sm transition-all hover:shadow-md">
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-4">
                                            <Button aria-label="Previous week" variant="outline" size="icon" onClick={() => handleChangeWeek('prev')}><ChevronLeft className="h-4 w-4" /></Button>
                                            <h3 className="font-semibold text-center text-lg tabular-nums">{format(currentWeek, 'MMMM yyyy')}</h3>
                                            <Button aria-label="Next week" variant="outline" size="icon" onClick={() => handleChangeWeek('next')}><ChevronRight className="h-4 w-4" /></Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-7 gap-1 sm:gap-2">
                                        {weekDays.map(day => {
                                            const dayInfo = getPlanForDate(day);
                                            const dayPlan = dayInfo?.dayPlan;
                                            let progress = 0;
                                            if (dayPlan) {
                                                const totalMeals = dayPlan.meals.length;
                                                const submittedMeals = dayPlan.meals.filter(m => m.photoSubmitted).length;
                                                if (totalMeals > 0) progress = (submittedMeals / totalMeals) * 100;
                                            }
                                            const isDaySelected = isSameDay(day, selectedDate);
                                            const isDayToday = isToday(day);
                                            return (
                                                <motion.button key={day.toISOString()} onClick={() => handleSelectDate(day)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={cn("h-auto aspect-auto sm:aspect-square flex flex-col gap-1 p-2 sm:p-2 relative items-center justify-center rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", isDaySelected ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-secondary hover:bg-secondary/80', isDayToday && !isDaySelected && "ring-2 ring-primary/70", !dayPlan && "opacity-60")}>
                                                    <AnimatePresence>{isDaySelected && <motion.div layoutId="selected-day-indicator" className="absolute inset-0 bg-primary rounded-lg z-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />}</AnimatePresence>
                                                    <div className={cn("absolute top-1 text-[10px] sm:text-xs font-medium z-10", isDaySelected ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{format(day, 'EEE')}</div>
                                                    <div className="relative flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 z-10 mt-2">
                                                        {dayPlan && (<svg className="absolute inset-0 h-full w-full" viewBox="0 0 36 36"><path className={cn("stroke-current", isDaySelected ? "text-primary-foreground/30" : "text-border")} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3" /><path className={cn("stroke-current", isDaySelected ? "text-white" : "text-primary")} strokeDasharray={`${progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3" strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.5s ease-in-out' }} /></svg>)}
                                                        <span className="text-xl sm:text-2xl font-bold z-10">{format(day, 'd')}</span>
                                                    </div>
                                                </motion.button>
                                            )
                                        })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                <Card className="shadow-sm transition-all hover:shadow-md">
                                    <CardHeader>
                                        <CardTitle>Meals for {format(selectedDate, 'PPP')}</CardTitle>
                                        <CardDescription>Select a meal to see instructions and submit your photo confirmation.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {selectedDayPlan && selectedPlan && selectedDayInfo ? (
                                            <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                                                <AnimatePresence>
                                                {selectedDayPlan.meals.map((meal, index) => (
                                                    <MealItem key={meal.id} meal={meal} index={index} user={user} selectedPlan={selectedPlan} selectedDayInfo={selectedDayInfo} isConfirmingMeal={isConfirmingMeal} onConfirmMeal={handleConfirmMealSubmission} />
                                                ))}
                                                </AnimatePresence>
                                            </Accordion>
                                        ) : (
                                            <div className="text-center py-10 text-muted-foreground"><CalendarIcon className="mx-auto h-10 w-10 mb-2"/><p>No diet plan assigned for this day.</p></div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="progress" className="pt-6">
                    <div className="space-y-8">
                        {chartData.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
                                        <CardHeader><CardTitle className="flex items-center gap-2"><Weight className="h-5 w-5 text-primary" /> Weight (kg)</CardTitle><CardDescription>Your weight trend over time.</CardDescription></CardHeader>
                                        <CardContent><div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><defs><linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }} /><Area type="monotone" dataKey="weight" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorWeight)" strokeWidth={2} name="Weight (kg)" connectNulls dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8, strokeWidth: 2 }} /></AreaChart></ResponsiveContainer></div></CardContent>
                                    </Card>
                                </motion.div>
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
                                        <CardHeader><CardTitle className="flex items-center gap-2"><Ruler className="h-5 w-5 text-accent" /> Measurements (in)</CardTitle><CardDescription>Your body measurement trends.</CardDescription></CardHeader>
                                        <CardContent><div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}/><Legend wrapperStyle={{fontSize: "12px"}}/><Line type="monotone" dataKey="waist" stroke="hsl(var(--accent))" strokeWidth={2} name="Waist" connectNulls dot={{ r: 4 }} activeDot={{ r: 8 }} /><Line type="monotone" dataKey="chest" stroke="#82ca9d" strokeWidth={2} name="Chest" connectNulls dot={{ r: 4 }} activeDot={{ r: 8 }} /><Line type="monotone" dataKey="hip" stroke="#ffc658" strokeWidth={2} name="Hip" connectNulls dot={{ r: 4 }} activeDot={{ r: 8 }} /><Line type="monotone" dataKey="thighs" stroke="#ff8042" strokeWidth={2} name="Thighs" connectNulls dot={{ r: 4 }} activeDot={{ r: 8 }} /></LineChart></ResponsiveContainer></div></CardContent>
                                    </Card>
                                </motion.div>
                            </div>
                        ) : (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300"><CardHeader><CardTitle>Progress Analysis</CardTitle><CardDescription>Visualize your journey and review your history.</CardDescription></CardHeader><CardContent><div className="text-center py-10 text-muted-foreground rounded-lg bg-secondary/30"><BarChart3 className="mx-auto h-10 w-10 mb-2" /><p><Balancer>Log your progress to see your charts and begin your journey!</Balancer></p></div></CardContent></Card>
                            </motion.div>
                        )}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}><Card><CardHeader><CardTitle>Log Your Weekly Progress</CardTitle><CardDescription>Add new data points to track your journey. All fields are required.</CardDescription></CardHeader><CardContent><LogProgressForm key={formKey} onFormSubmit={handleLogData} isSubmitting={isSubmittingProgress} /></CardContent></Card></motion.div>
                        {sortedHistoryData.length > 0 && (
                             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}><Card><CardHeader><CardTitle>Data History</CardTitle><CardDescription>A log of all your submitted measurements. Newest entries are at the top.</CardDescription></CardHeader><CardContent><div className="w-full overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Weight (kg)</TableHead><TableHead>Waist (in)</TableHead><TableHead>Chest (in)</TableHead><TableHead>Hip (in)</TableHead><TableHead>Thighs (in)</TableHead></TableRow></TableHeader><TableBody>{sortedHistoryData.map((entry) => (<TableRow key={entry.id}><TableCell className="font-medium whitespace-nowrap">{toDate(entry.date) ? format(toDate(entry.date)!, 'PPP p') : 'Processing...'}</TableCell><TableCell>{(entry as any).weight ?? '–'}</TableCell><TableCell>{(entry as any).waist ?? '–'}</TableCell><TableCell>{(entry as any).chest ?? '–'}</TableCell><TableCell>{(entry as any).hip ?? '–'}</TableCell><TableCell>{(entry as any).thighs ?? '–'}</TableCell></TableRow>))}</TableBody></Table></div></CardContent></Card></motion.div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
});
SubscribedDashboard.displayName = 'SubscribedDashboard';

function DashboardStateRenderer() {
  const { user } = useUser();

  if (user?.isSubscribed) {
    return <SubscribedDashboard />;
  }

  if (user?.isPaymentPending) {
    return (
        <Card className="max-w-2xl mx-auto border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 text-center shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
          <CardHeader>
            <Hourglass className="mx-auto h-12 w-12 text-yellow-500" />
            <CardTitle className="text-2xl font-semibold"><Balancer>Payment Under Review</Balancer></CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground"><Balancer>Thank you for your submission! Your payment is being verified by the admin. This page will automatically update once your plan is active.</Balancer></p>
          </CardContent>
        </Card>
    );
  }
  
  if (user) { 
    const isDeactivated = !user.isSubscribed && !user.isPaymentPending && user.subscriptionStartDate;
    if (isDeactivated) {
        const reactivateMessage = encodeURIComponent(`Hello Sara, I'd like to reactivate my plan. My registered email is: ${user.email}`);
        return (
          <Card className="max-w-2xl mx-auto border-2 border-destructive/50 bg-destructive/5 dark:bg-destructive/10 text-center shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
            <CardHeader>
                <XCircle className="mx-auto h-12 w-12 text-destructive" />
                <CardTitle className="text-2xl font-semibold text-destructive/90"><Balancer>Your Plan is Inactive</Balancer></CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground"><Balancer>Your subscription has ended or was deactivated. Please contact support if you believe this is an error.</Balancer></p>
                <div className="flex justify-center gap-4">
                    <Button asChild size="lg" variant="destructive">
                        <a href={`https://wa.me/918308725353?text=${reactivateMessage}`} target="_blank" rel="noopener noreferrer">Contact Support</a>
                    </Button>
                </div>
            </CardContent>
        </Card>
        );
    }
    
    // Default state for new, non-subscribed users
    return (
      <>
          <header className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-headline font-bold tracking-tight break-words text-center"><Balancer>Welcome, {user?.displayName || user?.email}</Balancer></h1>
          </header>
          <Card className="max-w-2xl mx-auto border-2 border-primary/50 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <CardHeader className="text-center">
                  <Zap className="mx-auto h-12 w-12 text-primary" />
                  <CardTitle className="text-2xl font-semibold"><Balancer>Get Started</Balancer></CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                  <p className="text-muted-foreground"><Balancer>To access your custom diet plans and progress tracking, please subscribe to a nutrition plan.</Balancer></p>
                  <Button asChild size="lg">
                      <a href="/#services">View Nutrition Plans</a>
                  </Button>
              </CardContent>
          </Card>
      </>
    );
  }

  // Fallback while user object is still loading
  return <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
}


export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-7xl py-10 space-y-8 px-4">
      <DashboardStateRenderer />
    </div>
  );
}
