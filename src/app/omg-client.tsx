"use client";

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
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const storageKey = 'podstyle_guest_user';
    const existing = window.localStorage.getItem(storageKey);
    if (existing) {
      setGuestId(existing);
      return;
    }
    const generated = window.crypto?.randomUUID
      ? `guest-${window.crypto.randomUUID()}`
      : `guest-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(storageKey, generated);
    setGuestId(generated);
  }, []);

  const resolvedUserId = user?.uid ?? guestId;

  // 合并公共创作和热门创作，去重
  useEffect(() => {
    const allCreations = [...initialTrendingCreations, ...initialPublicCreations];
    const uniqueCreations = Array.from(
      new Map(allCreations.map(c => [c.id, c])).values()
    );
    setCreations(uniqueCreations);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败';
      throw new Error(message);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : '注册失败';
      throw new Error(message);
    }
  };

  // 退出登录
  const handleLogout = async () => {
    if (!auth) {
      throw new Error('认证服务未初始化');
    }
    try {
      await signOut(auth);
    } catch (error) {
      const message = error instanceof Error ? error.message : '退出失败';
      throw new Error(message);
    }
  };

  // 只在认证加载时显示加载屏幕
  // 数据加载完成后即使为空也显示应用
  if (authLoading || !resolvedUserId) {
    return <LoadingScreen />;
  }

  return (
    <OMGApp
      initialCreations={creations}
      userId={resolvedUserId}
      isAuthenticated={Boolean(user) || Boolean(guestId)}
      onLogin={handleLogin}
      onRegister={handleRegister}
      onLogout={handleLogout}
    />
  );
}
