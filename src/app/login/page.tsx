
'use client';

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { LoginForm } from '@/components/auth/login-form';

/**
 * A loading component displayed as a fallback while the login form is being loaded.
 * @returns {React.ReactElement} A centered loading spinner.
 */
function Loading() {
    return (
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
}

/**
 * The main login page for the application.
 * It uses a Suspense boundary to correctly handle the `useSearchParams` hook
 * used within the LoginForm, which is required for production builds in Next.js.
 * @returns {React.ReactElement} The login page component.
 */
export default function LoginPage() {
    return (
        <Suspense fallback={<Loading />}>
            <LoginForm />
        </Suspense>
    );
}
