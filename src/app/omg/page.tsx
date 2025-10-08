import { AuthProvider } from '@/context/auth-context';
import OMGClient from '@/app/omg-client';
import { getPublicCreationsAction, getTrendingCreationsAction } from '@/server/actions';
import type { Creation } from '@/lib/types';
import { mockCreations } from '@/lib/test-data/mock-creations';
import { isFirebaseAdminConfigured } from '@/server/firebase/admin';

// OMG风格的页面
export default async function OMGPage() {
  // 服务端获取初始数据
  let publicCreations: Creation[] = [];
  let trendingCreations: Creation[] = [];

  const isProduction = process.env.NODE_ENV === 'production';
  const emulatorEnabled = Boolean(
    process.env.EMULATORS_RUNNING ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.STORAGE_EMULATOR_HOST
  );
  const hasServiceCredentials = Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
    process.env.GOOGLE_AUTH_CREDENTIALS
  );
  const shouldUseMockData = !isProduction && !emulatorEnabled && !hasServiceCredentials;

  if (shouldUseMockData || !isFirebaseAdminConfigured()) {
    publicCreations = mockCreations;
    trendingCreations = mockCreations.slice(0, 3);
  } else {
    try {
      [publicCreations, trendingCreations] = await Promise.all([
        getPublicCreationsAction(20),
        getTrendingCreationsAction(20),
      ]);
    } catch (error) {
      console.warn('Failed to fetch initial server data, falling back to mock content:', error);
      publicCreations = mockCreations;
      trendingCreations = mockCreations.slice(0, 3);
    }
  }

  return (
    <AuthProvider>
      <OMGClient
        initialPublicCreations={publicCreations}
        initialTrendingCreations={trendingCreations}
      />
    </AuthProvider>
  );
}
