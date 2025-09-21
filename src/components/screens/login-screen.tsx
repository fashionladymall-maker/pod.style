
"use client";

import React, { useState } from 'react';
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
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

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            // Auth state change will handle navigation
        } catch (error: any) {
            console.error("Google sign-in error:", error);
            toast({
                variant: "destructive",
                title: "Google 登录失败",
                description: error.code === 'auth/popup-closed-by-user' ? '您关闭了登录窗口' : '登录过程中发生错误，请稍后再试。',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
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
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "登录失败",
                description: "邮箱或密码错误，请重试。",
            });
        } finally {
            setIsLoading(false);
        }
    }

    const renderOptions = () => (
        <>
            <h1 className="text-3xl font-bold mb-2 text-center">欢迎来到 AIPOD</h1>
            <p className="text-muted-foreground mb-8 text-center">
              放飞思想，随心定制
              <br />
              <span className="text-sm">Free Your Mind, Customize Your Way.</span>
            </p>
            <div className="space-y-4">
                <Button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full rounded-full h-12 text-lg">
                    <Chrome className="mr-3" /> 使用 Google 登录
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
        </div>
    );
};

export default LoginScreen;
