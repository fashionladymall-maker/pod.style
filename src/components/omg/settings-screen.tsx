"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Bell,
  Lock,
  Globe,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface SettingsScreenProps {
  onBack: () => void;
  onLogout: () => void;
  onViewHistory?: () => void;
  isAuthenticated: boolean;
}

interface SettingItem {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  showArrow?: boolean;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
}

export function SettingsScreen({
  onBack,
  onLogout,
  onViewHistory,
  isAuthenticated,
}: SettingsScreenProps) {
  const { toast } = useToast();
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(true);

  const accountSettings: SettingItem[] = [
    {
      icon: <User className="w-5 h-5" />,
      label: '编辑资料',
      description: '修改头像、昵称等',
      showArrow: true,
      onClick: () => {
        toast({
          title: '即将推出',
          description: '编辑资料功能正在开发中，敬请期待！',
          duration: 3000,
        });
      },
    },
    {
      icon: <Lock className="w-5 h-5" />,
      label: '隐私设置',
      description: '管理你的隐私选项',
      showArrow: true,
      onClick: () => {
        toast({
          title: '即将推出',
          description: '隐私设置功能正在开发中，敬请期待！',
          duration: 3000,
        });
      },
    },
  ];

  const appSettings: SettingItem[] = [
    {
      icon: <Clock className="w-5 h-5" />,
      label: '浏览历史',
      description: '查看观看记录',
      showArrow: true,
      onClick: onViewHistory,
    },
    {
      icon: <Bell className="w-5 h-5" />,
      label: '通知',
      description: '接收点赞、评论等通知',
      showSwitch: true,
      switchValue: notifications,
      onSwitchChange: setNotifications,
    },
    {
      icon: <Globe className="w-5 h-5" />,
      label: '语言',
      description: '简体中文',
      showArrow: true,
      onClick: () => {
        toast({
          title: '即将推出',
          description: '语言设置功能正在开发中，敬请期待！',
          duration: 3000,
        });
      },
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      icon: <HelpCircle className="w-5 h-5" />,
      label: '帮助中心',
      showArrow: true,
      onClick: () => {
        toast({
          title: '即将推出',
          description: '帮助中心功能正在开发中，敬请期待！',
          duration: 3000,
        });
      },
    },
    {
      icon: <Info className="w-5 h-5" />,
      label: '关于',
      description: 'POD.STYLE v1.0.0',
      showArrow: true,
      onClick: () => {
        toast({
          title: '即将推出',
          description: '关于功能正在开发中，敬请期待！',
          duration: 3000,
        });
      },
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <motion.button
      key={item.label}
      whileTap={{ scale: 0.98 }}
      onClick={item.onClick}
      disabled={item.showSwitch}
      className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left"
    >
      <div className="flex items-center gap-3">
        <div className="text-gray-400">{item.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium">{item.label}</p>
          {item.description && (
            <p className="text-gray-400 text-sm mt-0.5">{item.description}</p>
          )}
        </div>
        {item.showArrow && (
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
        {item.showSwitch && (
          <Switch
            checked={item.switchValue}
            onCheckedChange={item.onSwitchChange}
            className="flex-shrink-0"
          />
        )}
      </div>
    </motion.button>
  );

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* 头部 */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-gray-400 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-white">设置</h1>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* 账号设置 */}
          {isAuthenticated && (
            <section>
              <h2 className="text-sm font-semibold text-gray-400 mb-3 px-1">
                账号设置
              </h2>
              <div className="space-y-2">
                {accountSettings.map(renderSettingItem)}
              </div>
            </section>
          )}

          {/* 应用设置 */}
          <section>
            <h2 className="text-sm font-semibold text-gray-400 mb-3 px-1">
              应用设置
            </h2>
            <div className="space-y-2">
              {appSettings.map(renderSettingItem)}
            </div>
          </section>

          {/* 支持 */}
          <section>
            <h2 className="text-sm font-semibold text-gray-400 mb-3 px-1">
              支持
            </h2>
            <div className="space-y-2">
              {supportSettings.map(renderSettingItem)}
            </div>
          </section>

          {/* 退出登录 */}
          {isAuthenticated && (
            <section>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onLogout}
                className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
              >
                <div className="flex items-center justify-center gap-2">
                  <LogOut className="w-5 h-5 text-red-500" />
                  <span className="text-red-500 font-semibold">退出登录</span>
                </div>
              </motion.button>
            </section>
          )}

          {/* 版本信息 */}
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">POD.STYLE</p>
            <p className="text-gray-600 text-xs mt-1">Version 1.0.0</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

