import { AuthProvider } from '@/context/auth-context';
import TikTokClient from '@/app/tiktok-client';
import { getPublicCreationsAction, getTrendingCreationsAction } from '@/server/actions';
import type { Creation } from '@/lib/types';

// TikTok风格的页面
export default async function TikTokPage() {
  // 服务端获取初始数据
  let publicCreations: Creation[] = [];
  let trendingCreations: Creation[] = [];

  try {
    [publicCreations, trendingCreations] = await Promise.all([
      getPublicCreationsAction(20), // 只加载20个
      getTrendingCreationsAction(20),
    ]);
  } catch (error) {
    console.error("Failed to fetch initial server data:", error);
  }

  return (
    <AuthProvider>
      <TikTokClient
        initialPublicCreations={publicCreations}
        initialTrendingCreations={trendingCreations}
      />
    </AuthProvider>
  );
}
