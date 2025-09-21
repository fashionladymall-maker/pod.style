
"use client";

import React, { useState } from 'react';
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, linkWithCredential, type AuthCredential, EmailAuthProvider } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Chrome, Mail, ArrowLeft } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type View = 'options' | 'email-signin' | 'email-signup';

const LoginScreen = () => {
    const { toast } = useToast();
    const [view, setView] = useState<View>('options');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const linkAnonymousAccount = async (credential: AuthCredential) => {
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.isAnonymous) {
            try {
                await linkWithCredential(currentUser, credential);
                toast({ title: '账户已关联', description: '您的匿名创作历史已同步到新账户。' });
                return { success: true };
            } catch (error: any) {
                // This is a special case. The credential belongs to another user.
                // We must sign out the anonymous user and sign in with the credential.
                if (error.code === 'auth/credential-already-in-use') {
                     await auth.signOut();
                     await signInWithEmailAndPassword(auth, email, password);
                     toast({ title: "登录成功", description: "已切换到您的现有账户。" });
                     return { success: true, switched: true }; // Switched accounts instead of linking
                } else {
                    // For other errors (like network failure), re-throw to be caught by the caller.
                    console.error("Link error:", error);
                    toast({ variant: 'destructive', title: '账户关联失败', description: `无法关联您的匿名账户: ${error.message}` });
                }
                throw error;
            }
        }
        // If not anonymous, just return indicating no action was taken
        return { success: false, switched: false };
    };


    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            // The signInWithPopup will either sign in a new user or an existing user.
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential) {
                // If the user was anonymous before this, Firebase automatically handles the upgrade.
                // We can add a toast to confirm.
                if (result.user) {
                     toast({ title: '登录成功', description: '您的账户已成功关联。' });
                }
            }
        } catch (error: any) {
             if (error.code === 'auth/account-exists-with-different-credential') {
                toast({
                    variant: "destructive",
                    title: "登录失败",
                    description: "该邮箱已通过其他方式注册，请使用原方式登录。",
                });
             } else if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
                console.error("Google sign-in error:", error);
                toast({
                    variant: "destructive",
                    title: "Google 登录失败",
                    description: '登录过程中发生错误，请稍后再试。',
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // This will sign out the anonymous user and create a new permanent one.
            // Data migration for this path is more complex and can be a future improvement.
            await createUserWithEmailAndPassword(auth, email, password);
            toast({ title: "注册成功", description: "欢迎！您的新账户已创建。" });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "注册失败",
                description: error.code === 'auth/email-already-in-use' ? '该邮箱已被注册' : '注册失败，请检查您的邮箱和密码。',
            });
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const currentUser = auth.currentUser;
            if (currentUser && currentUser.isAnonymous) {
                // If user is anonymous, try to link first.
                const credential = EmailAuthProvider.credential(email, password);
                await linkWithCredential(currentUser, credential);
                toast({ title: '账户已关联', description: '您的匿名创作历史已同步到新账户。' });
            } else {
                // If not anonymous or no user, just sign in.
                await signInWithEmailAndPassword(auth, email, password);
                toast({ title: "登录成功" });
            }
        } catch (error: any) {
            // This case happens if the email is already linked to another account
            // and we tried to link it again. The best UX is to sign out anonymous
            // and sign in with the permanent account.
            if (error.code === 'auth/credential-already-in-use') {
                try {
                    await auth.signOut();
                    await signInWithEmailAndPassword(auth, email, password);
                    toast({ title: "登录成功", description: "已切换到您的现有账户。" });
                } catch (signInError) {
                    // This can happen if password is wrong on the second attempt
                    toast({ variant: "destructive", title: "登录失败", description: "邮箱或密码错误。" });
                }

            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                toast({
                    variant: "destructive",
                    title: "登录失败",
                    description: "邮箱或密码错误，请重试。",
                });
            } else {
                // Handle other errors like network issues from linkWithCredential
                 toast({
                    variant: "destructive",
                    title: "登录时发生错误",
                    description: "无法完成登录，请检查网络或稍后重试。",
                });
                console.error("Sign-in error:", error);
            }
        } finally {
            setIsLoading(false);
        }
    }

    const renderOptions = () => (
        <>
            <h1 className="text-3xl font-bold mb-2 text-center">欢迎来到 POD.STYLE</h1>
            <p className="text-muted-foreground mb-8 text-center">
              放飞思想，随心定制
              <br />
              <span className="text-sm">Free Your Mind, Customize Your Way.</span>
            </p>
            <div className="space-y-4">
                <Button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full rounded-full h-12 text-lg">
                    <Chrome className="mr-3" /> 使用 Google 登录/注册
                </Button>
                <Button onClick={() => setView('email-signin')} variant="secondary" disabled={isLoading} className="w-full rounded-full h-12 text-lg">
                    <Mail className="mr-3" /> 使用邮箱登录或注册
                </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-6 text-center">登录或注册即表示您同意我们的服务条款</p>
        </>
    );
    
    const renderEmailForm = () => {
        const isSigningUp = view === 'email-signup';
        return (
             <div className="animate-fade-in w-full">
                <Button variant="ghost" size="sm" onClick={() => setView('options')} className="absolute top-4 left-4 text-muted-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" /> 返回
                </Button>
                <h2 className="text-2xl font-bold mb-6 text-center">{isSigningUp ? '注册' : '登录'}</h2>
                <form onSubmit={isSigningUp ? handleEmailSignUp : handleEmailSignIn} className="space-y-4">
                    <div>
                        <Label htmlFor="email">邮箱</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="mt-1" />
                    </div>
                     <div>
                        <Label htmlFor="password">密码</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" required className="mt-1" />
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full h-11 text-base">
                        {isLoading ? '请稍候...' : (isSigningUp ? '创建账户' : '登录')}
                    </Button>
                </form>
                <p className="text-center mt-4">
                     <Button variant="link" onClick={() => setView(isSigningUp ? 'email-signin' : 'email-signup')}>
                       {isSigningUp ? '已有账户？点击登录' : '没有账户？点击注册'}
                    </Button>
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-left p-6 animate-fade-in bg-background relative">
           {view === 'options' ? renderOptions() : renderEmailForm()}
           <p className="absolute bottom-4 text-xs text-muted-foreground">© POD.STYLE. All rights reserved.</p>
        </div>
    );
};

export default LoginScreen;
