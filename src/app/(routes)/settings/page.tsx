
'use client';

import { useCallback, useContext, useEffect, useState, useTransition } from 'react';
import { AuthContext } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  getUserSettingsAction,
  updateUserSettingsAction,
} from '@/features/users/server/actions';
import type { UserSettings, UserSettingsUpdate } from '@/features/users/types';
import { DEFAULT_USER_SETTINGS } from '@/features/users/types';

const mergeSettings = (base: UserSettings, updates: UserSettingsUpdate): UserSettings => ({
  ...base,
  notifications: {
    ...base.notifications,
    ...(updates.notifications ?? {}),
  },
  privacy: {
    ...base.privacy,
    ...(updates.privacy ?? {}),
  },
  language: updates.language ?? base.language,
  theme: updates.theme ?? base.theme,
  updatedAt: updates.updatedAt ?? base.updatedAt,
});

const LANGUAGE_OPTIONS = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English (US)' },
];

export default function SettingsPage() {
  const auth = useContext(AuthContext);
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const displayName = auth?.user?.displayName ?? auth?.user?.email ?? '未命名用户';
  const email = auth?.user?.email ?? '未绑定邮箱';

  useEffect(() => {
    const currentUser = auth?.user;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const result = await getUserSettingsAction(currentUser.uid);
        if (!cancelled && result.success) {
          setSettings(result.settings);
        } else if (!cancelled && !result.success) {
          toast({
            variant: 'destructive',
            title: '无法加载设置',
            description: result.error,
          });
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : '加载设置时出现问题。';
          toast({
            variant: 'destructive',
            title: '无法加载设置',
            description: message,
          });
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
  }, [auth?.user, toast]);

  const pushUpdate = useCallback(
    (updates: UserSettingsUpdate) => {
      const currentUser = auth?.user;
      if (!currentUser) {
        toast({
          variant: 'destructive',
          title: '尚未登录',
          description: '请先登录以更新个人设置。',
        });
        return;
      }

      const previous = settings;
      const optimistic = mergeSettings(previous, updates);
      setSettings(optimistic);

      startTransition(async () => {
        try {
          const result = await updateUserSettingsAction({
            userId: currentUser.uid,
            settings: updates,
          });

          if (!result.success) {
            throw new Error(result.error);
          }

          setSettings(result.settings);
        } catch (error) {
          setSettings((current) => (current === optimistic ? previous : current));
          const message = error instanceof Error ? error.message : '更新设置失败，请稍后再试。';
          toast({
            variant: 'destructive',
            title: '更新失败',
            description: message,
          });
        }
      });
    },
    [auth?.user, settings, toast],
  );

  const toggleNotification = (key: keyof UserSettings['notifications']) => {
    const nextValue = !settings.notifications[key];
    pushUpdate({
      notifications: {
        ...settings.notifications,
        [key]: nextValue,
      },
    });
  };

  const togglePrivacy = (key: keyof UserSettings['privacy']) => {
    const nextValue = !settings.privacy[key];
    pushUpdate({
      privacy: {
        ...settings.privacy,
        [key]: nextValue,
      },
    });
  };

  const handleThemeToggle = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    pushUpdate({ theme: nextTheme });
  };

  const handleLanguageChange = (value: string) => {
    pushUpdate({ language: value });
  };

  const toggleTrackClasses = (active: boolean) =>
    `w-12 h-6 rounded-full transition-colors ${
      active ? 'bg-blue-600' : 'bg-zinc-600'
    } ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`;

  const toggleKnobClasses = (active: boolean) =>
    `w-5 h-5 bg-white rounded-full transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`;

  const handleSignOut = async () => {
    try {
      await auth?.signOut?.();
      toast({ title: '已退出登录', description: '期待再次见到你。' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '退出登录失败，请稍后重试。';
      toast({ variant: 'destructive', title: '退出失败', description: message });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p>正在加载设置...</p>
        </div>
      </div>
    );
  }

  if (!auth?.user) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">请登录后查看设置</h1>
          <p className="text-gray-400">设置仅对登录用户开放。</p>
        </div>
      </div>
    );
  }

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
                <p className="text-sm text-gray-400">{displayName}</p>
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-zinc-700/60 rounded-lg text-sm text-gray-400 cursor-not-allowed"
                disabled
              >
                即将开放
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">邮箱</p>
                <p className="text-sm text-gray-400">{email}</p>
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-zinc-700/60 rounded-lg text-sm text-gray-400 cursor-not-allowed"
                disabled
              >
                即将开放
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">密码</p>
                <p className="text-sm text-gray-400">••••••••</p>
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-zinc-700/60 rounded-lg text-sm text-gray-400 cursor-not-allowed"
                disabled
              >
                即将开放
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
                type="button"
                disabled={isPending}
                onClick={() => toggleNotification('email')}
                className={toggleTrackClasses(settings.notifications.email)}
              >
                <div className={toggleKnobClasses(settings.notifications.email)} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">推送通知</p>
                <p className="text-sm text-gray-400">接收应用推送</p>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => toggleNotification('push')}
                className={toggleTrackClasses(settings.notifications.push)}
              >
                <div className={toggleKnobClasses(settings.notifications.push)} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">点赞通知</p>
                <p className="text-sm text-gray-400">有人点赞你的设计时通知</p>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => toggleNotification('likes')}
                className={toggleTrackClasses(settings.notifications.likes)}
              >
                <div className={toggleKnobClasses(settings.notifications.likes)} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">评论通知</p>
                <p className="text-sm text-gray-400">有人评论你的设计时通知</p>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => toggleNotification('comments')}
                className={toggleTrackClasses(settings.notifications.comments)}
              >
                <div className={toggleKnobClasses(settings.notifications.comments)} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">关注通知</p>
                <p className="text-sm text-gray-400">有人关注你时通知</p>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => toggleNotification('followers')}
                className={toggleTrackClasses(settings.notifications.followers)}
              >
                <div className={toggleKnobClasses(settings.notifications.followers)} />
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
                type="button"
                disabled={isPending}
                onClick={() => togglePrivacy('profilePublic')}
                className={toggleTrackClasses(settings.privacy.profilePublic)}
              >
                <div className={toggleKnobClasses(settings.privacy.profilePublic)} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">显示邮箱</p>
                <p className="text-sm text-gray-400">在个人资料中显示邮箱</p>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => togglePrivacy('showEmail')}
                className={toggleTrackClasses(settings.privacy.showEmail)}
              >
                <div className={toggleKnobClasses(settings.privacy.showEmail)} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">公开设计</p>
                <p className="text-sm text-gray-400">允许其他人查看你的设计</p>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => togglePrivacy('showDesigns')}
                className={toggleTrackClasses(settings.privacy.showDesigns)}
              >
                <div className={toggleKnobClasses(settings.privacy.showDesigns)} />
              </button>
            </div>
          </div>
        </section>

        {/* 偏好设置 */}
        <section>
          <h2 className="text-xl font-bold mb-4">体验偏好</h2>
          <div className="bg-zinc-800 rounded-lg divide-y divide-zinc-700">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">界面主题</p>
                <p className="text-sm text-gray-400">当前：{settings.theme === 'dark' ? '深色模式' : '浅色模式'}</p>
              </div>
              <button
                type="button"
                onClick={handleThemeToggle}
                disabled={isPending}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  isPending ? 'bg-zinc-700/60 cursor-not-allowed text-gray-300' : 'bg-zinc-700 hover:bg-zinc-600'
                }`}
              >
                切换为{settings.theme === 'dark' ? '浅色' : '深色'}模式
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">界面语言</p>
                <p className="text-sm text-gray-400">选择偏好的显示语言</p>
              </div>
              <select
                value={settings.language}
                onChange={(event) => handleLanguageChange(event.target.value)}
                disabled={isPending}
                className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {settings.updatedAt && (
            <p className="mt-3 text-xs text-gray-500">
              最近更新：{new Date(settings.updatedAt).toLocaleString('zh-CN')}
            </p>
          )}
        </section>

        {/* 退出登录 */}
        <section>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
          >
            退出登录
          </button>
        </section>
      </div>
    </div>
  );
}
