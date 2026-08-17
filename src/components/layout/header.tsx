
'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import React, { useState, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/#about', label: 'About' },
  { href: '/#services', label: 'Services' },
  { href: '/#testimonials', label: 'Testimonials' },
  { href: '/#contact', label: 'Contact' },
];

interface AuthButtonProps extends Omit<ButtonProps, 'asChild' | 'onClick'> {
    isMobile?: boolean;
    onLinkClick: () => void;
}

const AuthButtons = React.memo(function AuthButtons({ isMobile = false, onLinkClick, ...buttonProps }: AuthButtonProps) {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const router = useRouter();

    const handleLogout = useCallback(async () => {
      onLinkClick();
      if (auth) {
        await signOut(auth);
        router.push('/');
      }
    }, [auth, onLinkClick, router]);

    if (isUserLoading) {
      return null;
    }
    
    const dashboardHref = user?.isAdmin ? '/admin' : '/dashboard';

    const commonButtonProps = {
      ...buttonProps,
      className: isMobile ? 'w-full' : '',
    };

    if (user) {
      return (
        <div className={`flex items-center gap-2 ${isMobile ? 'flex-col-reverse' : ''}`}>
           <Button {...commonButtonProps} onClick={handleLogout}>
            Logout
          </Button>
          <Button asChild variant={isMobile ? 'outline' : 'ghost'} {...commonButtonProps}>
            <Link href={dashboardHref} onClick={onLinkClick}>Dashboard</Link>
          </Button>
        </div>
      );
    }
    return (
      <div className={`flex items-center gap-2 ${isMobile ? 'flex-col' : ''}`}>
        <Button asChild size="sm" variant="outline" {...commonButtonProps}>
          <Link href="/login" onClick={onLinkClick}>Client Login</Link>
        </Button>
        <Button asChild size="sm" {...commonButtonProps}>
          <Link href="/register" onClick={onLinkClick}>Register</Link>
        </Button>
      </div>
    );
});
AuthButtons.displayName = 'AuthButtons';

function HeaderComponent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLinkClick = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);
  
  const MobileNav = React.memo(function MobileNav() {
    return (
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
            <Menu />
            <span className="sr-only">Open menu</span>
            </Button>
        </SheetTrigger>
        <SheetContent side="left">
            <SheetHeader>
            <Link href="/" className="flex items-center gap-2" onClick={handleLinkClick}>
                <span className="font-bold text-lg">Sara Shahed</span>
            </Link>
            </SheetHeader>
            <div className="flex flex-col space-y-4 mt-8">
            {navItems.map((item) => (
                <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className="text-lg text-foreground hover:text-primary transition-colors"
                >
                {item.label}
                </Link>
            ))}
            <div className="mt-4 border-t pt-4">
                <AuthButtons isMobile={true} onLinkClick={handleLinkClick} />
            </div>
            </div>
        </SheetContent>
        </Sheet>
    );
  });
  MobileNav.displayName = 'MobileNav';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center">
          <span className="font-bold text-xl">Sara Shahed</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-foreground/70 transition-colors hover:text-primary font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <AuthButtons onLinkClick={() => {}} />
          </div>
          <ThemeToggle />
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
HeaderComponent.displayName = 'HeaderComponent';

export const Header = React.memo(HeaderComponent);
