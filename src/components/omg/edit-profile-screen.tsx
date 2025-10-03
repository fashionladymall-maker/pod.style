"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { FirebaseImage } from '@/components/ui/firebase-image';
import { IMAGE_PLACEHOLDER } from '@/lib/image-placeholders';

interface EditProfileScreenProps {
  userId: string;
  userName: string;
  bio?: string;
  avatar?: string;
  onBack: () => void;
  onSave: (data: { userName: string; bio: string; avatar?: string }) => Promise<void>;
}

export function EditProfileScreen({
  userId,
  userName: initialUserName,
  bio: initialBio = '',
  avatar: initialAvatar,
  onBack,
  onSave,
}: EditProfileScreenProps) {
  const { toast } = useToast();
  const [userName, setUserName] = useState(initialUserName);
  const [bio, setBio] = useState(initialBio);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: '文件类型错误',
        description: '请选择图片文件',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: '文件太大',
        description: '图片大小不能超过5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);

      toast({
        title: '图片已选择',
        description: '保存后将上传新头像',
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to load image:', error);
      toast({
        title: '加载失败',
        description: '无法加载图片，请重试',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    // Validate
    if (!userName.trim()) {
      toast({
        title: '昵称不能为空',
        description: '请输入昵称',
        variant: 'destructive',
      });
      return;
    }

    if (userName.length > 30) {
      toast({
        title: '昵称太长',
        description: '昵称不能超过30个字符',
        variant: 'destructive',
      });
      return;
    }

    if (bio.length > 200) {
      toast({
        title: '简介太长',
        description: '简介不能超过200个字符',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        userName: userName.trim(),
        bio: bio.trim(),
        avatar,
      });

      toast({
        title: '保存成功',
        description: '你的资料已更新',
        duration: 2000,
      });

      onBack();
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    userName !== initialUserName ||
    bio !== initialBio ||
    avatar !== initialAvatar;

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">编辑资料</h1>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={cn(
            'px-6',
            hasChanges
              ? 'bg-pink-500 hover:bg-pink-600 text-white'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            '保存'
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-8">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 p-1">
                <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center overflow-hidden relative">
                  {avatar ? (
                    <FirebaseImage
                      src={avatar}
                      alt="Avatar"
                      fill
                      className="object-cover"
                      placeholder="blur"
                      blurDataURL={IMAGE_PLACEHOLDER}
                    />
                  ) : (
                    <span className="text-3xl font-bold">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Upload Button */}
              <label
                htmlFor="avatar-upload"
                className={cn(
                  'absolute bottom-0 right-0 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-600 transition-colors',
                  isUploading && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={isUploading}
                className="hidden"
              />
            </div>
            <p className="text-sm text-gray-400">点击相机图标更换头像</p>
          </div>

          {/* User Name */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">昵称</label>
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="输入昵称"
              maxLength={30}
              className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-500 text-right">
              {userName.length}/30
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">个人简介</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="介绍一下自己..."
              maxLength={200}
              rows={4}
              className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 resize-none"
            />
            <p className="text-xs text-gray-500 text-right">
              {bio.length}/200
            </p>
          </div>

          {/* User ID (Read-only) */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">用户ID</label>
            <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-md text-gray-500">
              @{userId.slice(0, 12)}...
            </div>
            <p className="text-xs text-gray-500">用户ID不可修改</p>
          </div>

          {/* Tips */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-sm">提示</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• 昵称最多30个字符</li>
              <li>• 简介最多200个字符</li>
              <li>• 头像图片不超过5MB</li>
              <li>• 支持JPG、PNG、GIF格式</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
