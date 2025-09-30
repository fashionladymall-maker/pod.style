"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Home, Search, PlusCircle, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NavTab = 'home' | 'discover' | 'create' | 'inbox' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onCreateClick: () => void;
}

export function BottomNav({ activeTab, onTabChange, onCreateClick }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-white/10">
      <div className="flex items-center justify-around h-16 px-2">
        {/* 首页 */}
        <NavButton
          icon={Home}
          label="首页"
          active={activeTab === 'home'}
          onClick={() => onTabChange('home')}
        />

        {/* 发现 */}
        <NavButton
          icon={Search}
          label="发现"
          active={activeTab === 'discover'}
          onClick={() => onTabChange('discover')}
        />

        {/* 创作按钮（中间大按钮）*/}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onCreateClick}
          className="relative -mt-4"
        >
          <div className="relative">
            {/* 背景装饰 */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-xl blur-sm opacity-75" />
            
            {/* 主按钮 */}
            <div className="relative w-14 h-10 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <div className="absolute inset-0.5 bg-black rounded-xl" />
              <PlusCircle className="relative w-7 h-7 text-white" />
            </div>
          </div>
        </motion.button>

        {/* 消息 */}
        <NavButton
          icon={MessageCircle}
          label="消息"
          active={activeTab === 'inbox'}
          onClick={() => onTabChange('inbox')}
          badge={3}
        />

        {/* 我的 */}
        <NavButton
          icon={User}
          label="我"
          active={activeTab === 'profile'}
          onClick={() => onTabChange('profile')}
        />
      </div>
    </div>
  );
}

// 导航按钮组件
function NavButton({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 min-w-[60px]"
    >
      <div className="relative">
        <Icon
          className={cn(
            "w-6 h-6 transition-colors",
            active ? "text-white" : "text-gray-400"
          )}
        />
        {badge && badge > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">
              {badge > 9 ? '9+' : badge}
            </span>
          </div>
        )}
      </div>
      <span
        className={cn(
          "text-[10px] transition-colors",
          active ? "text-white font-medium" : "text-gray-400"
        )}
      >
        {label}
      </span>
    </motion.button>
  );
}
