import { AuthProvider } from '@/context/auth-context';
import OMGClient from '@/app/omg-client';
import { getPublicCreationsAction, getTrendingCreationsAction } from '@/server/actions';
import type { Creation } from '@/lib/types';
import { isFirebaseAdminConfigured } from '@/server/firebase/admin';
import { mockCreations } from '@/lib/test-data/mock-creations';

// OMG 风格的主页面
export default async function Page() {
  // 服务端获取初始数据
  let publicCreations: Creation[] = [];
  let trendingCreations: Creation[] = [];

  // 检测环境
  const isProduction = process.env.NODE_ENV === 'production';
  const hasCredentials = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const isTest = process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT_TEST === 'true';

  // 测试环境或本地开发无凭据时使用 mock 数据
  if (isTest || (!isProduction && !hasCredentials)) {
    console.log("Using mock data for testing/development");
    publicCreations = mockCreations;
    trendingCreations = mockCreations.slice(0, 3);
  } else if (isProduction || hasCredentials) {
    try {
      [publicCreations, trendingCreations] = await Promise.all([
        getPublicCreationsAction(20),
        getTrendingCreationsAction(20),
      ]);
    } catch (error) {
      console.error("Failed to fetch initial server data:", error);
      // 失败时使用 mock 数据作为后备
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
