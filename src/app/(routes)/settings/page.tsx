'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      likes: true,
      comments: true,
      followers: true,
    },
    privacy: {
      profilePublic: true,
      showEmail: false,
      showDesigns: true,
    },
    language: 'zh-CN',
    theme: 'dark',
  });

  const handleToggle = (category: string, key: string) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...(prev as any)[category],
        [key]: !(prev as any)[category][key],
      },
    }));
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* 头部 */}
      <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">设置</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-8">
        {/* 账户设置 */}
        <section>
          <h2 className="text-xl font-bold mb-4">账户设置</h2>
          <div className="bg-zinc-800 rounded-lg divide-y divide-zinc-700">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">用户名</p>
                <p className="text-sm text-gray-400">FE @FeR3AgxV</p>
              </div>
              <button className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors">
                修改
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">邮箱</p>
                <p className="text-sm text-gray-400">1504885923@qq.com</p>
              </div>
              <button className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors">
                修改
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">密码</p>
                <p className="text-sm text-gray-400">••••••••</p>
              </div>
              <button className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors">
                修改
              </button>
            </div>
          </div>
        </section>

        {/* 通知设置 */}
        <section>
          <h2 className="text-xl font-bold mb-4">通知设置</h2>
          <div className="bg-zinc-800 rounded-lg divide-y divide-zinc-700">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">邮件通知</p>
                <p className="text-sm text-gray-400">接收重要更新的邮件</p>
              </div>
              <button
                onClick={() => handleToggle('notifications', 'email')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.notifications.email ? 'bg-blue-600' : 'bg-zinc-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.notifications.email ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">推送通知</p>
                <p className="text-sm text-gray-400">接收应用推送</p>
              </div>
              <button
                onClick={() => handleToggle('notifications', 'push')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.notifications.push ? 'bg-blue-600' : 'bg-zinc-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.notifications.push ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">点赞通知</p>
                <p className="text-sm text-gray-400">有人点赞你的设计时通知</p>
              </div>
              <button
                onClick={() => handleToggle('notifications', 'likes')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.notifications.likes ? 'bg-blue-600' : 'bg-zinc-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.notifications.likes ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">评论通知</p>
                <p className="text-sm text-gray-400">有人评论你的设计时通知</p>
              </div>
              <button
                onClick={() => handleToggle('notifications', 'comments')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.notifications.comments ? 'bg-blue-600' : 'bg-zinc-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.notifications.comments ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">关注通知</p>
                <p className="text-sm text-gray-400">有人关注你时通知</p>
              </div>
              <button
                onClick={() => handleToggle('notifications', 'followers')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.notifications.followers ? 'bg-blue-600' : 'bg-zinc-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.notifications.followers ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* 隐私设置 */}
        <section>
          <h2 className="text-xl font-bold mb-4">隐私设置</h2>
          <div className="bg-zinc-800 rounded-lg divide-y divide-zinc-700">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">公开个人资料</p>
                <p className="text-sm text-gray-400">允许其他人查看你的资料</p>
              </div>
              <button
                onClick={() => handleToggle('privacy', 'profilePublic')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.privacy.profilePublic ? 'bg-blue-600' : 'bg-zinc-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.privacy.profilePublic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">显示邮箱</p>
                <p className="text-sm text-gray-400">在个人资料中显示邮箱</p>
              </div>
              <button
                onClick={() => handleToggle('privacy', 'showEmail')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.privacy.showEmail ? 'bg-blue-600' : 'bg-zinc-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.privacy.showEmail ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">公开设计</p>
                <p className="text-sm text-gray-400">允许其他人查看你的设计</p>
              </div>
              <button
                onClick={() => handleToggle('privacy', 'showDesigns')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.privacy.showDesigns ? 'bg-blue-600' : 'bg-zinc-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.privacy.showDesigns ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* 退出登录 */}
        <section>
          <button className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors">
            退出登录
          </button>
        </section>
      </div>
    </div>
  );
}

