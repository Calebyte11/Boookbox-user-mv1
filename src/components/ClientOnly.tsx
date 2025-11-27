import React, { useState, useEffect, type ReactNode } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * A component that only renders its children on the client side.
 * On the server, it renders a fallback (or nothing).
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps): ReactNode {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted ? children : fallback;
}