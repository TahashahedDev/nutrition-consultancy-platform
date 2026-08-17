
import Link from 'next/link';
import React from 'react';

function FooterComponent() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-secondary">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 text-center md:flex-row md:gap-2 md:px-0 md:text-left">
          <p className="text-sm leading-loose text-muted-foreground">
            &copy; {currentYear} Sara Shahed. All Rights Reserved.
          </p>
        </div>
         <div className="text-sm text-muted-foreground">
            <Link href="/policies" className="hover:text-primary transition-colors">
              Policies
            </Link>
          </div>
      </div>
    </footer>
  );
}
FooterComponent.displayName = 'FooterComponent';

export const Footer = React.memo(FooterComponent);
