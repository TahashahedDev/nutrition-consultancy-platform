
import { Hero } from '@/components/sections/hero';
import { About } from '@/components/sections/about';
import { Plans } from '@/components/sections/plans';
import { Testimonials } from '@/components/sections/testimonials';
import { Contact } from '@/components/sections/contact';
import { Cta } from '@/components/sections/cta';

/**
 * The main homepage of the application.
 * It is a server component that composes various sections.
 * @returns {React.ReactElement} The home page component.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Plans />
      <Testimonials />
      <Cta />
      <Contact />
    </>
  );
}
