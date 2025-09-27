
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { 
    onAuthStateChanged, 
    signOut as firebaseSignOut, 
    signInAnonymously,
    createUserWithEmailAndPassword,
    EmailAuthProvider,
    signInWithCredential,
    AuthCredential as FirebaseAuthCredential
} from "firebase/auth";
import { FirebaseError } from 'firebase/app';
import type { FirebaseUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { migrateAnonymousDataAction } from '@/server/actions';

interface AuthContextType {
    user: FirebaseUser | null;
    authLoading: boolean;
    isAnonymous: boolean;
    signOut: () => Promise<void>;
    emailSignUp: (email: string, password: string) => Promise<void>;
    emailSignIn: (email: string, password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    authLoading: true,
    isAnonymous: true,
    signOut: async () => {},
    emailSignUp: async () => {},
    emailSignIn: async () => {},
});

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const { toast } = useToast();

    const migrateAndHandleResult = useCallback(async (anonymousUid: string | null, permanentUid: string | null) => {
        if (!anonymousUid || !permanentUid || anonymousUid === permanentUid) {
            return true;
        }

        try {
            const migrationResult = await migrateAnonymousDataAction(anonymousUid, permanentUid);
            if (!migrationResult.success) {
                console.warn('Anonymous data migration failed', migrationResult.error);
                toast({
                    variant: 'destructive',
                    title: '数据合并失败',
                    description: '无法迁移您的匿名创作历史，但您已成功登录。',
                });
                return false;
            }
            return true;
        } catch (error) {
            console.error('Anonymous data migration threw an error:', error);
            toast({
                variant: 'destructive',
                title: '数据合并失败',
                description: '无法迁移您的匿名创作历史，但您已成功登录。',
            });
            return false;
        }
    }, [toast]);

    useEffect(() => {
        const firebaseAuth = auth;
        if (!firebaseAuth) {
            console.warn("Firebase Auth is not initialized.");
            setAuthLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
            } else {
                setUser(null);
                signInAnonymously(firebaseAuth).catch((error: unknown) => {
                    if (error instanceof FirebaseError) {
                        console.warn("Anonymous sign-in failed", {
                            code: error.code,
                            message: error.message,
                        });
                    } else {
                        console.warn("Anonymous sign-in failed", error);
                    }
                    toast({
                        variant: 'destructive',
                        title: '无法连接到认证服务器',
                        description: '请检查您的网络连接，并确保当前域名已在Firebase控制台的“Authorized domains”中正确配置。'
                    });
                });
            }
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, [toast, migrateAndHandleResult]);

    const signOut = async () => {
        if (!auth) {
            throw new Error('Firebase Auth is not initialized.');
        }
        await firebaseSignOut(auth);
    };

    const signInAndMigrate = async (credential: FirebaseAuthCredential) => {
        const firebaseAuth = auth;
        if (!firebaseAuth) {
            throw new Error("Auth not ready.");
        }

        const isUpgrading = firebaseAuth.currentUser?.isAnonymous;
        const anonymousUid = isUpgrading ? firebaseAuth.currentUser?.uid ?? null : null;

        try {
            const result = await signInWithCredential(firebaseAuth, credential);
            const permanentUid = result.user.uid;

            if (isUpgrading && anonymousUid && anonymousUid !== permanentUid) {
                toast({ title: '登录成功', description: '正在合并您的匿名创作历史...' });
                const migrationSucceeded = await migrateAndHandleResult(anonymousUid, permanentUid);
                if (migrationSucceeded) {
                    toast({ title: `欢迎回来, ${result.user.displayName || result.user.email}!`, description: '所有历史创作都已保留。' });
                }
            } else {
                 toast({ title: `登录成功, ${result.user.displayName || result.user.email}!` });
            }
        } catch (error) {
            console.error("Sign-in or migration error:", error);
            if (error instanceof FirebaseError) {
                if (error.code === 'auth/network-request-failed') {
                    throw new Error("网络请求失败。请检查您的网络连接，并确保您的应用域已在Firebase认证设置中列入白名单。");
                }
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    throw new Error("邮箱或密码不正确。");
                }
                throw error;
            }
            throw new Error('登录过程中发生未知错误。');
        }
    };
    
    const emailSignUp = async (email: string, password: string) => {
        const firebaseAuth = auth;
        if (!firebaseAuth) throw new Error("Auth not initialized");

        const isUpgrading = firebaseAuth.currentUser?.isAnonymous;
        const anonymousUid = isUpgrading ? firebaseAuth.currentUser?.uid ?? null : null;

        try {
            if (!isUpgrading) {
                await createUserWithEmailAndPassword(firebaseAuth, email, password);
                toast({ title: "注册成功", description: "欢迎！" });
                return;
            }

            if (anonymousUid) {
                await firebaseSignOut(firebaseAuth);
                const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
                const permanentUid = userCredential.user.uid;
                const migrationSucceeded = permanentUid ? await migrateAndHandleResult(anonymousUid, permanentUid) : false;
                toast({ title: "注册成功", description: migrationSucceeded ? "欢迎！您的匿名创作历史已保留。" : "欢迎！" });
            }

        } catch (error) {
            if (error instanceof FirebaseError) {
                if (error.code === 'auth/email-already-in-use') {
                    throw new Error("该邮箱已被注册。请尝试登录。");
                }
                if (error.code === 'auth/network-request-failed') {
                    throw new Error("网络请求失败。请检查您的网络并确认域名已在Firebase授权。");
                }
                throw error;
            }
            throw new Error('注册过程中发生未知错误。');
        }
    };

    const emailSignIn = async (email: string, password: string) => {
        const credential = EmailAuthProvider.credential(email, password);
        await signInAndMigrate(credential);
    };

    const value = {
        user,
        authLoading,
        isAnonymous: user?.isAnonymous ?? true,
        signOut,
        emailSignUp,
        emailSignIn,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
