import { useEffect, useRef } from 'react';

/** Calls onReach when the returned sentinel element scrolls into view (with a 400px head start). */
export const useInfiniteScroll = (onReach: () => void, enabled: boolean) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onReachRef = useRef(onReach);
  onReachRef.current = onReach;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !enabled) {
      return;
    }
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && onReachRef.current(), { rootMargin: '400px 0px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled]);

  return sentinelRef;
};
