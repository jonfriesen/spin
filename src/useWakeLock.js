import { useEffect, useRef } from 'react';

export function useWakeLock(isActive = true) {
  const wakeLockRef = useRef(null);

  useEffect(() => {
    if (!isActive) {
      // Release wake lock if not active
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      return;
    }

    // Check if Wake Lock API is supported
    if ('wakeLock' in navigator) {
      const requestWakeLock = async () => {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.log('Wake Lock acquired');
        } catch (err) {
          console.error('Wake Lock request failed:', err);
        }
      };

      requestWakeLock();

      // Re-acquire wake lock when page becomes visible again
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && wakeLockRef.current?.released) {
          requestWakeLock();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Cleanup function
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (wakeLockRef.current) {
          wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
      };
    }
  }, [isActive]);

  return wakeLockRef;
}
