'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
  const [user] = useState({
    name: 'FE @FeR3AgxV',
    email: '1504885923@qq.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FE',
    createdAt: '2025-09-01',
    designs: 12,
    likes: 156,
    followers: 89,
    following: 45,
  });

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* 头部 */}
      <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-6">
            {/* 头像 */}
            <img
              src={user.avatar}
              alt={user.name}
              className="w-24 h-24 rounded-full border-4 border-zinc-700"
            />

            {/* 用户信息 */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
              <p className="text-gray-400 mb-4">{user.email}</p>

              {/* 统计 */}
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="font-bold text-lg">{user.designs}</span>
                  <span className="text-gray-400 ml-1">设计</span>
                </div>
                <div>
                  <span className="font-bold text-lg">{user.likes}</span>
                  <span className="text-gray-400 ml-1">获赞</span>
                </div>
                <div>
                  <span className="font-bold text-lg">{user.followers}</span>
                  <span className="text-gray-400 ml-1">粉丝</span>
                </div>
                <div>
                  <span className="font-bold text-lg">{user.following}</span>
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
          <button className="py-4 text-gray-400 hover:text-white transition-colors">
            收藏
          </button>
          <button className="py-4 text-gray-400 hover:text-white transition-colors">
            点赞
          </button>
        </div>

        {/* 设计网格 */}
        <div className="grid grid-cols-3 gap-4 pb-12">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-zinc-800 rounded-lg overflow-hidden hover:opacity-80 transition-opacity cursor-pointer"
            >
              <img
                src={`https://picsum.photos/400/400?random=${i}`}
                alt={`设计 ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

