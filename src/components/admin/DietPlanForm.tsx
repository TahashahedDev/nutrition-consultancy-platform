
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { doc, collection, serverTimestamp, updateDoc, setDoc, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, XCircle, ChevronDown, ChevronUp, Calendar as CalendarIconUI } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DayPlan, DietPlan } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toDate } from '@/lib/utils';
import { useFirestore } from '@/firebase';


const generateUniqueId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;


interface DietPlanFormProps {
  clientId: string;
  existingPlan?: DietPlan | null;
  onPlanSaved: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
}


export default function DietPlanForm({ clientId, existingPlan, onPlanSaved, isSubmitting, setIsSubmitting }: DietPlanFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [days, setDays] = useState<DayPlan[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [planDuration, setPlanDuration] = useState(10);
  
  useEffect(() => {
    if (existingPlan) {
        setDays(existingPlan.days || []);
        const existingStartDate = toDate(existingPlan.startDate);
        setStartDate(existingStartDate ?? undefined);
        setPlanDuration(existingPlan.days?.length || 1);
    } else {
        const initialDays = Array.from({ length: 10 }).map((_, i) => ({
            id: generateUniqueId('day'),
            day: i + 1,
            meals: [{ id: generateUniqueId('meal'), time: '09:00', description: '', photoSubmitted: false }],
        }));
        setDays(initialDays);
        setStartDate(new Date());
        setPlanDuration(10);
    }
  }, [existingPlan]);


  useEffect(() => {
    const currentDayCount = days.length;
    if (planDuration === currentDayCount) return;

    const newDayCount = planDuration > 0 ? planDuration : 0;
  
    if (newDayCount > currentDayCount) {
      const daysToAdd = newDayCount - currentDayCount;
      const newDays = Array.from({ length: daysToAdd }).map((_, i) => ({
        id: generateUniqueId('day'),
        day: currentDayCount + i + 1,
        meals: [{ id: generateUniqueId('meal'), time: '09:00', description: '', photoSubmitted: false }],
      }));
      setDays(prevDays => [...prevDays, ...newDays]);
    } else if (newDayCount < currentDayCount) {
      setDays(prevDays => prevDays.slice(0, newDayCount));
    }
  }, [planDuration, days.length]);


  const handleDietPlanSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !clientId || isSubmitting || !startDate) {
        toast({ variant: 'destructive', title: 'Error', description: 'Start date is required.' });
        return;
    }
    setIsSubmitting(true);

    try {
        const finalDays = days.map((day, index) => ({...day, day: index + 1, meals: day.meals.map(m => ({...m, photoSubmitted: m.photoSubmitted || false}))}));

        const planData: Partial<DietPlan> = {
            clientId,
            days: finalDays,
            startDate: Timestamp.fromDate(startDate),
            createdAt: existingPlan?.createdAt || serverTimestamp(),
            title: `Plan starting ${format(startDate, 'PPP')}`
        };

        if (existingPlan?.id) {
            const planRef = doc(firestore, `users/${clientId}/dietPlans`, existingPlan.id);
            await updateDoc(planRef, planData);
            toast({ title: 'Diet Plan Updated!', description: 'The changes have been saved.' });
        } else {
            const dietPlanRef = doc(collection(firestore, `users/${clientId}/dietPlans`));
            await setDoc(dietPlanRef, { ...planData, id: dietPlanRef.id });
            toast({ title: 'Diet Plan Created!', description: 'The new diet plan has been saved for the client.' });
        }
        onPlanSaved();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not save the diet plan.' });
    } finally {
        setIsSubmitting(false);
    }
  }, [firestore, clientId, isSubmitting, days, existingPlan, toast, onPlanSaved, startDate, setIsSubmitting]);

  const addMeal = useCallback((dayIndex: number) => {
    setDays(prevDays => prevDays.map((day, dIndex) => {
        if (dIndex !== dayIndex || day.meals.length >= 8) return day;
        const newMeals = [...day.meals, { id: generateUniqueId('meal'), time: '12:00', description: '', photoSubmitted: false }];
        return { ...day, meals: newMeals };
    }));
  }, []);

  const removeMeal = useCallback((dayIndex: number, mealIndex: number) => {
    setDays(prevDays => prevDays.map((day, dIndex) => {
        if (dIndex !== dayIndex || day.meals.length <= 1) return day;
        const newMeals = day.meals.filter((_, mIndex) => mIndex !== mealIndex);
        return { ...day, meals: newMeals };
    }));
  }, []);

  const updateMeal = useCallback((dayIndex: number, mealIndex: number, field: 'time' | 'description', value: string) => {
    setDays(prevDays => prevDays.map((day, dIndex) => {
      if (dIndex !== dayIndex) return day;
      const newMeals = day.meals.map((meal, mIndex) => {
        if (mIndex !== mealIndex) return meal;
        return { ...meal, [field]: value };
      });
      return { ...day, meals: newMeals };
    }));
  }, []);

  return (
    <form onSubmit={handleDietPlanSubmit} id="diet-plan-form" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sticky top-0 bg-background z-10 py-4 border-b">
             <div className="space-y-2">
                <Label htmlFor="start-date-popover">Plan Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="start-date-popover"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIconUI className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => setStartDate(date ?? undefined)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
             </div>
             <div className="space-y-2">
                <Label htmlFor="plan-duration-input">Plan Duration (in days)</Label>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="icon" onClick={() => setPlanDuration(d => Math.max(1, d - 1))}><ChevronDown className="h-4 w-4" /></Button>
                    <Input id="plan-duration-input" className="text-center" type="number" value={planDuration} onChange={e => setPlanDuration(parseInt(e.target.value, 10) || 1)} min="1" />
                    <Button type="button" variant="outline" size="icon" onClick={() => setPlanDuration(d => d + 1)}><ChevronUp className="h-4 w-4" /></Button>
                </div>
             </div>
        </div>
        
        {days.map((day, dayIndex) => {
            const dayDate = startDate ? addDays(startDate, day.day - 1) : new Date();
            return (
                <Card key={day.id} className="border-dashed transition-all hover:shadow-md hover:border-primary/30">
                    <CardHeader className="bg-secondary/30 p-4">
                        <CardTitle className="text-lg">
                            Day {day.day}
                            <span className="text-muted-foreground font-normal text-sm ml-2">({format(dayDate, 'EEE, MMM d')})</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                    {day.meals.map((meal, mealIndex) => (
                        <div key={meal.id} className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-4 items-start border-b pb-4 last:border-b-0">
                        <div className="space-y-2">
                            <Label htmlFor={`meal-time-${day.id}-${meal.id}`}>Meal {mealIndex + 1} Time</Label>
                            <Input id={`meal-time-${day.id}-${meal.id}`} type="time" value={meal.time} onChange={(e) => updateMeal(dayIndex, mealIndex, 'time', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                            <Label htmlFor={`meal-desc-${day.id}-${meal.id}`}>Recipe & Instructions</Label>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeMeal(dayIndex, mealIndex)} disabled={day.meals.length <= 1}>
                                <XCircle className="h-4 w-4" />
                            </Button>
                            </div>
                            <Textarea id={`meal-desc-${day.id}-${meal.id}`} value={meal.description} onChange={(e) => updateMeal(dayIndex, mealIndex, 'description', e.target.value)} placeholder={`Details for Meal ${mealIndex + 1}`} className="min-h-[150px]" />
                        </div>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addMeal(dayIndex)} disabled={day.meals.length >= 8}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Meal
                    </Button>
                    </CardContent>
                </Card>
            )
        })}
    </form>
  );
}

    