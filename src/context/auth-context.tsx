
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
    signInWithCredential
} from "firebase/auth";
import type { FirebaseUser } from '@/lib/types';
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

    const linkAndMigrate = async (credential: any) => {
        if (!auth || !auth.currentUser || !auth.currentUser.isAnonymous) {
            // Not an anonymous user, just sign in
            await signInWithCredential(auth, credential);
            return;
        }

        const anonymousUid = auth.currentUser.uid;
        
        try {
            const result = await linkWithCredential(auth.currentUser, credential);
            const permanentUid = result.user.uid;
            
            toast({ title: '账户已关联', description: '正在合并您的匿名创作历史...' });
            
            await migrateAndHandleResult(anonymousUid, permanentUid);
            
            toast({ title: `登录成功，${result.user.displayName || result.user.email}!`, description: '所有历史创作都已保留。' });

        } catch (error: any) {
            if (error.code === 'auth/credential-already-in-use' || error.code === 'auth/email-already-in-use') {
                toast({ title: "账户已存在", description: "此凭证已关联其他账户，正在为您登录并合并数据..." });
                const existingUser = await signInWithCredential(auth, credential);
                const permanentUid = existingUser.user.uid;
                await migrateAndHandleResult(anonymousUid, permanentUid);
            } else {
                console.error("Link error:", error);
                throw error;
            }
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
        await linkAndMigrate(provider);
    };

    const emailSignUp = async (email: string, password: string) => {
        if (!auth) throw new Error("Auth not initialized");
        // Firebase automatically handles linking on createUserWithEmailAndPassword if a user is already signed in.
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: "注册成功", description: "欢迎！您的匿名创作历史已保留。" });
    };

    const emailSignIn = async (email: string, password: string) => {
        const credential = EmailAuthProvider.credential(email, password);
        await linkAndMigrate(credential);
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
