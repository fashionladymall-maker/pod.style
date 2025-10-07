'use client';

import { useState } from 'react';

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<'trending' | 'new' | 'following'>('trending');

  const categories = [
    '全部', 'T恤', '连帽衫', '马克杯', '手机壳', '贴纸', '海报', '帆布包'
  ];

  const mockDesigns = Array.from({ length: 12 }).map((_, i) => ({
    id: `design-${i}`,
    title: `设计作品 ${i + 1}`,
    author: `用户${i + 1}`,
    likes: Math.floor(Math.random() * 1000),
    image: `https://picsum.photos/400/600?random=${i}`,
  }));

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* 顶部导航 */}
      <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold mb-4">发现</h1>

          {/* 标签页 */}
          <div className="flex gap-6 mb-4">
            <button
              onClick={() => setActiveTab('trending')}
              className={`pb-2 ${
                activeTab === 'trending'
                  ? 'border-b-2 border-blue-500 font-medium'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              热门
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`pb-2 ${
                activeTab === 'new'
                  ? 'border-b-2 border-blue-500 font-medium'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              最新
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`pb-2 ${
                activeTab === 'following'
                  ? 'border-b-2 border-blue-500 font-medium'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              关注
            </button>
          </div>

          {/* 分类 */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm whitespace-nowrap transition-colors"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 瀑布流网格 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mockDesigns.map((design) => (
            <div
              key={design.id}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[2/3] bg-zinc-800 rounded-lg overflow-hidden mb-2">
                <img
                  src={design.image}
                  alt={design.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* 悬浮信息 */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <div className="w-full">
                    <p className="font-medium mb-1">{design.title}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">{design.author}</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                        </svg>
                        {design.likes}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

