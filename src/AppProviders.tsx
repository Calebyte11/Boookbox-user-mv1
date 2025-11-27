/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { ToastProvider } from '@/hooks/useToast';
import LocationErrorBoundary from '@/components/LocationErrorBoundary'; // Assuming this component exists
import { Theme } from '@radix-ui/themes';

// Create a client instance once, it will be reused on the client
const queryClient = new QueryClient();

type Post = {
  title: string;
  message?: string;
  images?: string[];
  postedBy?: {
    id: string;
    role?: string;
    name?: string;
    fullName?: string;
    organizationName?: string;
  };
  data?: {
    resource?: any;
  };
  type?: string;
};

interface AppProvidersProps {
  children: React.ReactNode;
  serverPost?: Post;
}

export function AppProviders({ children, serverPost }: AppProvidersProps) {
  // If we have a post from the server, we can use it to initialize
  // the query cache. This is an alternative to dehydrate/hydrate for simple cases.
  // Note: The dehydrate/hydrate method is generally more robust.
  if (serverPost) {
    // You could potentially use this to seed data, but the dehydration/hydration
    // flow handled by entry-client.tsx is the more standard pattern.
  }
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <LocationErrorBoundary>
          <ToastProvider>
            <Theme appearance="light">{children}</Theme>
          </ToastProvider>
        </LocationErrorBoundary>
      </QueryClientProvider>
    </HelmetProvider>
  );
}