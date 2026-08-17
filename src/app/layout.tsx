
import type { Metadata } from 'next';
import './globals.css';
import { Sora, Work_Sans } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { Provider as BalancerProvider } from 'react-wrap-balancer';
import React from 'react';

const sora = Sora({ 
  subsets: ['latin'], 
  variable: '--font-sora',
  display: 'swap',
});
const workSans = Work_Sans({ 
  subsets: ['latin'], 
  variable: '--font-work-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sara Shahed - Your Personal Nutrition Consultant',
  description:
    'Achieve your health goals with personalized nutrition plans from Sara Shahed. Expert guidance for a healthier you.',
  keywords: ['nutrition', 'health', 'diet', 'wellness', 'consultant'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  const generalInquiryMessage = encodeURIComponent("Hello Sara, I'm visiting your website and have a question.");

  const SafeThemeProvider = ThemeProvider as unknown as React.FC<{
    children: React.ReactNode;
    attribute?: "class" | "data-theme";
    defaultTheme?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
  }>;

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`font-body antialiased ${sora.variable} ${workSans.variable}`}>
        <FirebaseClientProvider>
          <BalancerProvider>
            <SafeThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
            >
                <div className="flex min-h-screen flex-col">
                  <Header />
                  <main className="flex-grow">{children}</main>
                  <Footer />
                </div>
                <Button asChild size="icon" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg" aria-label="Chat on WhatsApp">
                    <a href={`https://wa.me/918308725353?text=${generalInquiryMessage}`} target="_blank" rel="noopener noreferrer">
                        <MessageSquare className="h-7 w-7" />
                    </a>
                </Button>
                <Toaster />
            </SafeThemeProvider>
          </BalancerProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
