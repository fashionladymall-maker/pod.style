import { AuthProvider } from '@/context/auth-context';
import AppClient from '@/app/app-client';
import { getPublicCreationsAction, getTrendingCreationsAction } from '@/server/actions';
import type { Creation } from '@/lib/types';

// This is now a React Server Component (RSC)
export default async function LegacyPage() {
    
  // Fetch initial public data on the server.
  // This makes the initial load much faster as the data is part of the server-rendered HTML.
  let publicCreations: Creation[] = [];
  let trendingCreations: Creation[] = [];

  try {
      [publicCreations, trendingCreations] = await Promise.all([
          getPublicCreationsAction(),
          getTrendingCreationsAction()
      ]);
  } catch (error) {
      console.error("Failed to fetch initial server data:", error);
      // On error, we will render with empty arrays to prevent crashing the page.
  }


  return (
    <AuthProvider>
      <AppClient 
        initialPublicCreations={publicCreations} 
        initialTrendingCreations={trendingCreations} 
      />
    </AuthProvider>
  );
}
