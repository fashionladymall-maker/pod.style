'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getUserProfileAction } from '@/features/users/server/actions';
import { getCreationsAction } from '@/features/creations/server/actions';
import type { UserProfile } from '@/features/users/types';
import type { Creation } from '@/lib/types';

const buildPlaceholderAvatar = (name: string) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`;

export default function ProfilePage() {
  const auth = useContext(AuthContext);
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = auth?.user?.uid ?? null;
  const fallbackName = auth?.user?.displayName ?? auth?.user?.email ?? '访客用户';

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const [profileResult, userCreations] = await Promise.all([
          getUserProfileAction(userId),
          getCreationsAction(userId).catch(() => [] as Creation[]),
        ]);

        if (cancelled) {
          return;
        }

        if (profileResult.success) {
          setProfile(profileResult.profile ?? null);
        } else {
          toast({
            variant: 'destructive',
            title: '加载资料失败',
            description: profileResult.error,
          });
        }

        setCreations(userCreations);
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : '加载个人资料时出现问题。';
          toast({ variant: 'destructive', title: '加载资料失败', description: message });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [userId, toast]);

  const designCount = creations.length;
  const totalLikes = useMemo(
    () => creations.reduce((sum, creation) => sum + (creation.likeCount ?? 0), 0),
    [creations],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p>正在加载个人资料...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">请登录后查看个人主页</h1>
          <p className="text-gray-400">登录后可查看作品、收藏与历史记录。</p>
        </div>
      </div>
    );
  }

  const displayName = profile?.name ?? fallbackName;
  const email = profile?.email ?? auth?.user?.email ?? '未绑定邮箱';
  const avatar = profile?.avatar ?? buildPlaceholderAvatar(displayName);
  const followers = profile?.followersCount ?? 0;
  const following = profile?.followingCount ?? 0;

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* 头部 */}
      <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-6">
            {/* 头像 */}
            <Image
              src={avatar}
              alt={displayName}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full border-4 border-zinc-700 object-cover"
            />

            {/* 用户信息 */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{displayName}</h1>
              <p className="text-gray-400 mb-2">{email}</p>
              <p className="text-sm text-gray-500 max-w-md">
                {profile?.bio ?? '填写个人简介，展示你的设计风格与灵感来源。'}
              </p>

              {/* 统计 */}
              <div className="flex gap-6 text-sm mt-4">
                <div>
                  <span className="font-bold text-lg">{designCount}</span>
                  <span className="text-gray-400 ml-1">设计</span>
                </div>
                <div>
                  <span className="font-bold text-lg">{totalLikes}</span>
                  <span className="text-gray-400 ml-1">获赞</span>
                </div>
                <div>
                  <span className="font-bold text-lg">{followers}</span>
                  <span className="text-gray-400 ml-1">粉丝</span>
                </div>
                <div>
                  <span className="font-bold text-lg">{following}</span>
                  <span className="text-gray-400 ml-1">关注</span>
                </div>
              </div>
            </div>

            {/* 编辑按钮 */}
            <Link
              href="/settings"
              className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
            >
              编辑资料
            </Link>
          </div>
        </div>
      </div>

      {/* 标签页 */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex gap-8 border-b border-zinc-800 mb-6">
          <button className="py-4 border-b-2 border-blue-500 font-medium">
            我的设计
          </button>
          <button className="py-4 text-gray-400 cursor-not-allowed" disabled>
            收藏（即将上线）
          </button>
          <button className="py-4 text-gray-400 cursor-not-allowed" disabled>
            点赞（即将上线）
          </button>
        </div>

        {/* 设计网格 */}
        {creations.length === 0 ? (
          <div className="py-16 text-center text-gray-400 border border-dashed border-zinc-700 rounded-xl">
            暂无设计，去首页生成你的第一件作品吧。
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
            {creations.map((creation) => (
              <div
                key={creation.id}
                className="relative aspect-square bg-zinc-800 rounded-lg overflow-hidden hover:opacity-80 transition-opacity cursor-pointer"
              >
                <Image
                  src={
                    creation.previewPatternUri ??
                    creation.patternUri ??
                    buildPlaceholderAvatar(creation.prompt ?? 'Design')
                  }
                  alt={creation.prompt ?? '创作预览'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs text-white">
                  <p className="font-medium truncate">{creation.prompt ?? '未命名创作'}</p>
                  <p className="text-gray-300">{creation.likeCount ?? 0} 次喜欢 · {creation.orderCount ?? 0} 单售出</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
