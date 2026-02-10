import { useState, useEffect } from 'react';

/**
 * Hook that returns true when the window width is >= the given breakpoint.
 * Re-renders the component on resize so the value is always current.
 */
export function useIsDesktop(breakpoint = 1024): boolean {
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth >= breakpoint : false
    );

    useEffect(() => {
        const mql = window.matchMedia(`(min-width: ${breakpoint}px)`);

        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);

        // Set initial value
        setIsDesktop(mql.matches);

        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, [breakpoint]);

    return isDesktop;
}
