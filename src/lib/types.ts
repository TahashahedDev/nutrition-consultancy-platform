
import { z } from 'zod';

/**
 * This file contains shared TypeScript types for data structures used across the application.
 * Having a single source of truth for types helps maintain consistency and reduce errors.
 */

/**
 * @interface Meal
 * Defines the shape of a single meal in a diet plan.
 */
export interface Meal {
  id: string;
  time: string;
  description: string;
  photoSubmitted?: boolean;
}

/**
 * @interface DayPlan
 * Defines the shape of a single day's plan, containing multiple meals.
 */
export interface DayPlan {
  id: string;
  day: number;
  meals: Meal[];
}

/**
 * @interface DietPlan
 * Defines the shape of a multi-day diet plan for a client.
 * The `createdAt` and `startDate` properties are of type `any` to accommodate Firestore's Timestamp object.
 */
export interface DietPlan {
  id: string;
  title: string;
  createdAt: any; 
  startDate: any;
  days: DayPlan[];
  clientId?: string;
}

/**
 * @interface UserProfile
 * Defines the shape of a user's profile data stored in Firestore.
 * Date-related fields are `any` to handle Firestore Timestamps.
 */
export interface UserProfile {
  id: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  createdAt?: any; 
  isSubscribed?: boolean;
  planId?: string;
  subscriptionStartDate?: any;
  subscriptionEndDate?: any;
  isAdmin?: boolean;
  isPaused?: boolean;
  pausedAt?: any;
  isPaymentPending?: boolean;
}

/**
 * @interface ClientData
 * Represents a single data point (like weight or waist measurement) logged by a client.
 * `date` is `any` to accommodate Firestore's Timestamp.
 */
export interface ClientData {
  id: string;
  date: any; 
  type?: 'weight' | 'waist' | 'chest' | 'hip' | 'thighs';
  value?: number;
  weight?: number;
  waist?: number;
  chest?: number;
  hip?: number;
  thighs?: number;
}

/**
 * @interface AdminNote
 * Represents private notes made by an administrator about a specific client.
 * `createdAt` is `any` for Firestore's Timestamp.
 */
export interface AdminNote {
    id: string;
    clientId: string;
    followUpNote?: string;
    counsellingNote?: string;
    createdAt: any;
}

/**
 * @interface NutritionPlan
 * Defines the shape of a nutrition plan object offered as a service.
 */
export interface NutritionPlan {
  id: string;
  title: string;
  price: string;
  description: string;
  durationMonths: number;
  features: string[];
  isPopular?: boolean;
  recommendation?: string;
  createdAt?: any;
}

/**
 * @interface Coupon
 * Defines the shape of a discount coupon.
 */
export interface Coupon {
  id: string;
  code: string;
  discountAmount: number;
  isActive: boolean;
  createdAt: any;
}
