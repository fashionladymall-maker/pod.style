import { AuthProvider } from '@/context/auth-context';
import OMGClient from '@/app/omg-client';
import { getPublicCreationsAction, getTrendingCreationsAction } from '@/server/actions';
import type { Creation } from '@/lib/types';
import { isFirebaseAdminConfigured } from '@/server/firebase/admin';

// OMG 风格的主页面
export default async function Page() {
  // 服务端获取初始数据
  let publicCreations: Creation[] = [];
  let trendingCreations: Creation[] = [];

  // 只在生产环境或有完整凭据时才获取服务端数据
  // 本地开发时直接使用空数据，让客户端处理
  const isProduction = process.env.NODE_ENV === 'production';
  const hasCredentials = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (isProduction || hasCredentials) {
    try {
      [publicCreations, trendingCreations] = await Promise.all([
        getPublicCreationsAction(20), // 只加载20个
        getTrendingCreationsAction(20),
      ]);
    } catch (error) {
      console.error("Failed to fetch initial server data:", error);
      // 即使失败也继续，使用空数据
    }
  } else {
    console.warn("Local development without credentials. Using empty initial data. Client will handle data fetching.");
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
