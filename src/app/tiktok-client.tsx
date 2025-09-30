"use client";

import React, { useState, useEffect, useContext } from 'react';
import { TikTokApp } from '@/components/tiktok/tiktok-app';
import { AuthContext } from '@/context/auth-context';
import type { Creation } from '@/lib/types';
import LoadingScreen from '@/components/screens/loading-screen';

interface TikTokClientProps {
  initialPublicCreations: Creation[];
  initialTrendingCreations: Creation[];
}

export default function TikTokClient({
  initialPublicCreations,
  initialTrendingCreations,
}: TikTokClientProps) {
  const authContext = useContext(AuthContext);
  const user = authContext?.user ?? null;
  const authLoading = authContext?.loading ?? false;
  const [creations, setCreations] = useState<Creation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 合并公共创作和热门创作，去重
  useEffect(() => {
    const allCreations = [...initialTrendingCreations, ...initialPublicCreations];
    const uniqueCreations = Array.from(
      new Map(allCreations.map(c => [c.id, c])).values()
    );
    setCreations(uniqueCreations);
    setIsLoading(false);
  }, [initialPublicCreations, initialTrendingCreations]);

  // 处理创作按钮点击
  const handleGenerateClick = () => {
    // TODO: 打开创作界面
    console.log('Open create screen');
  };

  if (authLoading || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <TikTokApp
      initialCreations={creations}
      userId={user?.uid || 'anonymous'}
      onGenerateClick={handleGenerateClick}
    />
  );
}
