'use client';

import Image from 'next/image';
import { useState } from 'react';

interface Message {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  lastMessage: string;
  timestamp: Date;
  unread: number;
}

export default function MessagesPage() {
  const [messages] = useState<Message[]>([
    {
      id: '1',
      user: {
        name: '系统通知',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=system',
      },
      lastMessage: '您的订单已发货',
      timestamp: new Date('2025-10-07T10:30:00'),
      unread: 1,
    },
    {
      id: '2',
      user: {
        name: '客服小助手',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=support',
      },
      lastMessage: '有什么可以帮您的吗？',
      timestamp: new Date('2025-10-06T15:20:00'),
      unread: 0,
    },
    {
      id: '3',
      user: {
        name: '设计师 Alice',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      },
      lastMessage: '喜欢你的设计！',
      timestamp: new Date('2025-10-05T09:15:00'),
      unread: 2,
    },
  ]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* 头部 */}
      <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">消息</h1>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="max-w-4xl mx-auto">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            暂无消息
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {messages.map((message) => (
              <div
                key={message.id}
                className="px-6 py-4 hover:bg-zinc-800/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* 头像 */}
                  <div className="relative">
                    <Image
                      src={message.user.avatar}
                      alt={message.user.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full"
                    />
                    {message.unread > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                        {message.unread}
                      </div>
                    )}
                  </div>

                  {/* 消息内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium">{message.user.name}</h3>
                      <span className="text-sm text-gray-400">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${
                      message.unread > 0 ? 'text-white font-medium' : 'text-gray-400'
                    }`}>
                      {message.lastMessage}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
