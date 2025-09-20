"use client";

import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Chrome } from "lucide-react";

const LoginScreen = () => {
    const { toast } = useToast();

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            // Auth state change will handle navigation
        } catch (error: any) {
            console.error("Google sign-in error:", error);
            toast({
                variant: "destructive",
                title: "Google 登录失败",
                description: error.message || "登录过程中发生错误，请稍后再试。",
            });
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in bg-background">
            <h1 className="text-3xl font-bold mb-2">欢迎来到 AIPOD</h1>
            <p className="text-muted-foreground mb-8">用AI释放你的创造力</p>
            <Button onClick={handleGoogleSignIn} className="w-full rounded-full h-12 text-lg">
                <Chrome className="mr-3" /> 使用 Google 登录
            </Button>
             <p className="text-xs text-muted-foreground mt-4">登录或注册即表示您同意我们的服务条款</p>
        </div>
    );
};

export default LoginScreen;
