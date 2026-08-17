import { Loader2 } from 'lucide-react';

/**
 * A loading component displayed as a fallback for the Dashboard page
 * while its content is being loaded.
 * @returns {React.ReactElement} A centered loading spinner.
 */
export default function Loading() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}
