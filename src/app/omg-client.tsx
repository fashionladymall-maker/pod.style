"use client";

// @ts-nocheck

import React, { useState, useEffect, useContext } from 'react';
import { OMGApp } from '@/components/omg/omg-app';
import { AuthContext } from '@/context/auth-context';
import type { Creation } from '@/lib/types';
import LoadingScreen from '@/components/screens/loading-screen';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface OMGClientProps {
  initialPublicCreations: Creation[];
  initialTrendingCreations: Creation[];
}

export default function OMGClient({
  initialPublicCreations,
  initialTrendingCreations,
}: OMGClientProps) {
  const { toast } = useToast();
  const authContext = useContext(AuthContext);
  const user = authContext?.user ?? null;
  const authLoading = authContext?.authLoading ?? false;
  const [creations, setCreations] = useState<Creation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 合并公共创作和热门创作，去重
  useEffect(() => {
    const allCreations = [...initialTrendingCreations, ...initialPublicCreations];
    const uniqueCreations = Array.from(
      new Map(allCreations.map(c => [c.id, c])).values()
    );
    setCreations(uniqueCreations);
    // 即使没有数据也要停止加载状态
    setIsLoading(false);
  }, [initialPublicCreations, initialTrendingCreations]);

  // 登录
  const handleLogin = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('认证服务未初始化');
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: '登录成功',
        description: '欢迎回来！',
      });
    } catch (error: any) {
      throw new Error(error.message || '登录失败');
    }
  };

  // 注册
  const handleRegister = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('认证服务未初始化');
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: '注册成功',
        description: '欢迎加入！',
      });
    } catch (error: any) {
      throw new Error(error.message || '注册失败');
    }
  };

  // 退出登录
  const handleLogout = async () => {
    if (!auth) {
      throw new Error('认证服务未初始化');
    }
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message || '退出失败');
    }
  };

  // 只在认证加载时显示加载屏幕
  // 数据加载完成后即使为空也显示应用
  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <OMGApp
      initialCreations={creations}
      userId={user?.uid || null}
      isAuthenticated={!!user && !user.isAnonymous}
      onLogin={handleLogin}
      onRegister={handleRegister}
      onLogout={handleLogout}
    />
  );
}
