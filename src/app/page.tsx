
import { getPublicCreationsAction, getTrendingCreationsAction } from '@/app/actions';
import AppClient from './app-client';
import type { Creation } from '@/lib/types';

// This is now a React Server Component (RSC)
export default async function Page() {
    
  // Fetch initial public data on the server.
  // This makes the initial load much faster as the data is part of the server-rendered HTML.
  const [publicCreations, trendingCreations] = await Promise.all([
    getPublicCreationsAction(),
    getTrendingCreationsAction()
  ]).catch((error) => {
    console.error("Failed to fetch initial server data:", error);
    // On error, return empty arrays to prevent crashing the page.
    return [[], []] as [Creation[], Creation[]];
  });

  return (
    <AppClient 
      initialPublicCreations={publicCreations} 
      initialTrendingCreations={trendingCreations} 
    />
  );
}
