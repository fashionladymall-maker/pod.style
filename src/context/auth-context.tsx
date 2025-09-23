
"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { 
    onAuthStateChanged, 
    signOut as firebaseSignOut, 
    signInAnonymously,
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    linkWithCredential,
    EmailAuthProvider,
    signInWithCredential,
    AuthCredential as FirebaseAuthCredential
} from "firebase/auth";
import type { FirebaseUser, AuthCredential } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { migrateAnonymousDataAction } from '@/app/actions';

interface AuthContextType {
    user: FirebaseUser | null;
    authLoading: boolean;
    isAnonymous: boolean;
    signOut: () => Promise<void>;
    googleSignIn: () => Promise<void>;
    emailSignUp: (email: string, password: string) => Promise<void>;
    emailSignIn: (email: string, password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    authLoading: true,
    isAnonymous: true,
    signOut: async () => {},
    googleSignIn: async () => {},
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

    useEffect(() => {
        if (!auth) {
            console.warn("Firebase Auth is not initialized.");
            setAuthLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
            } else {
                setUser(null);
                signInAnonymously(auth).catch(error => {
                    console.error("Anonymous sign-in failed", {
                        code: error?.code, message: error?.message,
                    });
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
    }, [toast]);

    const signOut = async () => {
        if (!auth) return;
        await firebaseSignOut(auth);
    };

    const signInAndMigrate = async (credential: FirebaseAuthCredential) => {
        if (!auth || !auth.currentUser) {
            throw new Error("Auth not ready.");
        }

        const isUpgrading = auth.currentUser.isAnonymous;
        const anonymousUid = isUpgrading ? auth.currentUser.uid : null;

        try {
            const result = await signInWithCredential(auth, credential);
            const permanentUid = result.user.uid;

            if (isUpgrading && anonymousUid && anonymousUid !== permanentUid) {
                toast({ title: '登录成功', description: '正在合并您的匿名创作历史...' });
                await migrateAndHandleResult(anonymousUid, permanentUid);
                toast({ title: `欢迎回来, ${result.user.displayName || result.user.email}!`, description: '所有历史创作都已保留。' });
            } else {
                 toast({ title: `登录成功, ${result.user.displayName || result.user.email}!` });
            }
        } catch (error: any) {
            console.error("Sign-in or migration error:", error);
            if (error.code === 'auth/network-request-failed') {
                throw new Error("网络请求失败。请检查您的网络连接，并确保您的应用域已在Firebase认证设置中列入白名单。");
            }
            throw error; // Re-throw other errors to be handled by the UI
        }
    };
    
    const migrateAndHandleResult = async (anonymousUid: string, permanentUid: string) => {
        if (anonymousUid === permanentUid) return;
        const migrationResult = await migrateAnonymousDataAction(anonymousUid, permanentUid);
        if (!migrationResult.success) {
            toast({ variant: 'destructive', title: '数据合并失败', description: '无法迁移您的匿名创作历史，但您已成功登录。' });
        }
    };
    
    const googleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        // With signInWithPopup, Firebase handles linking automatically if a user is already signed in (even anonymously).
        // But our custom flow gives us more control over data migration toasts.
        const result = await signInWithPopup(auth, provider);
        const permanentUid = result.user.uid;

        // Since we can't get the anonymous UID after this finishes, we rely on a slightly different flow.
        // The onAuthStateChanged listener will handle the user update. We might need a different approach
        // if we need to show a "migrating" toast. A simple "Logged in" is fine for now.
        toast({ title: `登录成功, ${result.user.displayName || result.user.email}!` });
    };

    const emailSignUp = async (email: string, password: string) => {
        if (!auth) throw new Error("Auth not initialized");
        if (!auth.currentUser || !auth.currentUser.isAnonymous) {
            // If there's no user or a signed-in user, just create a new account
            await createUserWithEmailAndPassword(auth, email, password);
            toast({ title: "注册成功", description: "欢迎！" });
            return;
        }

        // Upgrade anonymous user
        const anonymousUid = auth.currentUser.uid;
        const credential = EmailAuthProvider.credential(email, password);

        try {
            const result = await linkWithCredential(auth.currentUser, credential);
            const permanentUid = result.user.uid;
            
            if (anonymousUid !== permanentUid) {
                await migrateAndHandleResult(anonymousUid, permanentUid);
            }
            toast({ title: "注册成功", description: "欢迎！您的匿名创作历史已保留。" });

        } catch (error: any) {
             if (error.code === 'auth/credential-already-in-use') {
                // This case means the email is taken. We should ask them to sign in.
                throw new Error("该邮箱已被注册。请尝试登录。");
             }
             throw error;
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
        googleSignIn,
        emailSignUp,
        emailSignIn,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
