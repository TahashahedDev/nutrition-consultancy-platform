'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Scale, Ruler, HeartPulse, PersonStanding, Footprints } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';

/**
 * @interface LogProgressFormProps
 * Props for the LogProgressForm component.
 */
interface LogProgressFormProps {
  onFormSubmit: (data: Record<string, string>) => Promise<void>;
  isSubmitting: boolean;
}

type MetricName = 'weight' | 'waist' | 'chest' | 'hip' | 'thighs';

/**
 * An array defining the metric fields for the progress logging form.
 * This makes it easy to add or remove fields in the future.
 */
const metricFields: {
  name: MetricName;
  label: string;
  icon: ForwardRefExoticComponent<Omit<SVGProps<SVGSVGElement>, "ref"> & RefAttributes<SVGSVGElement>>;
  placeholder: string;
}[] = [
  { name: 'weight', label: 'Weight (kg)', icon: Scale, placeholder: 'e.g., 75.5' },
  { name: 'waist', label: 'Waist (in)', icon: Ruler, placeholder: 'e.g., 34.25' },
  { name: 'chest', label: 'Chest (in)', icon: HeartPulse, placeholder: 'e.g., 40' },
  { name: 'hip', label: 'Hip (in)', icon: PersonStanding, placeholder: 'e.g., 42.5' },
  { name: 'thighs', label: 'Thighs (in)', icon: Footprints, placeholder: 'e.g., 24' },
];

/**
 * A dedicated, reusable form component for logging multiple progress metrics at once.
 * It uses controlled inputs with `useState` and includes robust validation.
 * @param {LogProgressFormProps} props - The component props.
 * @returns {React.ReactElement} The progress logging form.
 */
export const LogProgressForm = React.memo(function LogProgressForm({ onFormSubmit, isSubmitting }: LogProgressFormProps) {
  const { toast } = useToast();
  const [formState, setFormState] = useState<Record<MetricName, string>>({
    weight: '',
    waist: '',
    chest: '',
    hip: '',
    thighs: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Allow empty strings, numbers, and a single decimal point.
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
        setFormState(prevState => ({
            ...prevState,
            [name as MetricName]: value,
        }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // --- Robust Validation ---
    for (const field of metricFields) {
        const valueStr = formState[field.name];
        const valueNum = parseFloat(valueStr);

        if (valueStr.trim() === '') {
            toast({
                variant: 'destructive',
                title: 'Missing Field',
                description: `The "${field.label}" field cannot be empty.`,
            });
            return;
        }

        if (isNaN(valueNum) || valueNum <= 0) {
            toast({
                variant: 'destructive',
                title: 'Invalid Input',
                description: `Please enter a valid, positive number for "${field.label}".`,
            });
            return;
        }

        // Logical value validation
        if (field.name === 'weight') {
            if (valueNum >= 1000) { // Weight should not be 4 digits or more
                toast({ variant: 'destructive', title: 'Invalid Weight', description: 'Please enter a realistic weight.' });
                return;
            }
        } else { // For waist, chest, hip, thighs
             if (valueNum >= 100) { // Measurements should not be 3 digits or more
                toast({ variant: 'destructive', title: `Invalid ${field.label}`, description: `${field.label} seems too high. Please enter a value less than 100.` });
                return;
            }
        }
    }
    // --- End Validation ---

    await onFormSubmit(formState);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {metricFields.map(field => (
          <div key={field.name}>
            <Label htmlFor={field.name} className="flex items-center gap-2 text-sm font-medium mb-2">
                <field.icon className="h-5 w-5 text-primary/80" />
                {field.label}
            </Label>
            <Input
                id={field.name}
                name={field.name}
                type="text" // Use text to allow for more controlled input handling
                inputMode="decimal" // Provides a numeric-friendly keyboard on mobile devices
                placeholder={field.placeholder}
                disabled={isSubmitting}
                className="h-11"
                value={formState[field.name]}
                onChange={handleInputChange}
                required // Use native validation for a good baseline
            />
          </div>
        ))}
      </div>
      <div className="pt-2">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
          Save Progress
        </Button>
      </div>
    </form>
  );
});
LogProgressForm.displayName = 'LogProgressForm';
