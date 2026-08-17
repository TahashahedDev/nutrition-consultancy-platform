
'use client';

import { useState, useEffect } from 'react';

/**
 * @interface WindowSize
 * Defines the shape of the window size object.
 */
interface WindowSize {
  width: number;
  height: number;
}

/**
 * A custom hook to get the current window size.
 * This is useful for components that need to adapt to different screen sizes,
 * for example, for animations like confetti that need to fill the screen.
 * @returns {WindowSize} An object containing the current window width and height.
 */
export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  return windowSize;
}
