"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Upload,
  X,
  Wand2,
  Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HashtagInput } from './hashtag-input';
import { FirebaseImage } from '@/components/ui/firebase-image';
import { IMAGE_PLACEHOLDER } from '@/lib/image-placeholders';

// 艺术风格列表
const artStyles = [
  "无 (None)",
  "赛博朋克 (Cyberpunk)",
  "蒸汽朋克 (Steampunk)",
  "日系动漫 (Anime)",
  "美式漫画 (American Comic)",
  "汉服古风 (Hanfu/Ancient Chinese)",
  "水墨画 (Ink Wash Painting)",
  "油画 (Oil Painting)",
  "水彩 (Watercolor)",
  "素描 (Sketch)",
  "波普艺术 (Pop Art)",
  "超现实主义 (Surrealism)",
  "立体主义 (Cubism)",
  "印象派 (Impressionism)",
  "表现主义 (Expressionism)",
  "极简主义 (Minimalism)",
  "孟菲斯 (Memphis)",
  "Low Poly",
  "像素艺术 (Pixel Art)",
  "卡通 (Cartoon)",
];

interface CreateScreenProps {
  onBack: () => void;
  onGenerate: (prompt: string, style: string, referenceImage: string | null, hashtags?: string) => Promise<void>;
  isGenerating: boolean;
}

export function CreateScreen({ onBack, onGenerate, isGenerating }: CreateScreenProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(artStyles[0]);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [hashtags, setHashtags] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    await onGenerate(prompt, selectedStyle, referenceImage, hashtags);
  };

  const parseStyle = (style: string) => {
    const match = style.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      return { chinese: match[1], english: match[2] };
    }
    return { chinese: style, english: '' };
  };

  const selectedStyleParsed = parseStyle(selectedStyle);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-semibold text-white">创作</h1>
        <div className="w-10" /> {/* 占位 */}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 pb-24">
          {/* 创意描述 */}
          <div className="space-y-3">
            <label className="text-white font-medium flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500" />
              描述你的创意
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：一只可爱的猫咪在星空下..."
              className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none focus:border-pink-500 focus:ring-pink-500"
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-400">
              💡 提示：描述越详细，生成的图案越符合你的想象
            </p>
          </div>

          {/* 艺术风格选择 */}
          <div className="space-y-3">
            <label className="text-white font-medium flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-cyan-500" />
              艺术风格 <span className="text-gray-400 text-sm">(可选)</span>
            </label>
            
            <Button
              variant="outline"
              onClick={() => setShowStylePicker(!showStylePicker)}
              className="w-full justify-between bg-white/5 border-white/10 text-white hover:bg-white/10"
              disabled={isGenerating}
            >
              <span>
                {selectedStyleParsed.chinese}
                {selectedStyleParsed.english && (
                  <span className="text-gray-400 ml-2 text-sm">
                    {selectedStyleParsed.english}
                  </span>
                )}
              </span>
              <motion.div
                animate={{ rotate: showStylePicker ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▼
              </motion.div>
            </Button>

            <AnimatePresence>
              {showStylePicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <ScrollArea className="h-[300px] rounded-lg border border-white/10 bg-white/5 p-2">
                    <div className="space-y-1">
                      {artStyles.map((style) => {
                        const { chinese, english } = parseStyle(style);
                        return (
                          <button
                            key={style}
                            onClick={() => {
                              setSelectedStyle(style);
                              setShowStylePicker(false);
                            }}
                            className={cn(
                              "w-full text-left px-4 py-3 rounded-lg transition-colors",
                              selectedStyle === style
                                ? "bg-gradient-to-r from-pink-500/20 to-cyan-500/20 text-white"
                                : "text-gray-300 hover:bg-white/5"
                            )}
                          >
                            <div className="font-medium">{chinese}</div>
                            {english && (
                              <div className="text-xs text-gray-400 mt-0.5">
                                {english}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 参考图上传 */}
          <div className="space-y-3">
            <label className="text-white font-medium flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-500" />
              参考图 <span className="text-gray-400 text-sm">(可选)</span>
            </label>

            {referenceImage ? (
              <div className="relative rounded-lg overflow-hidden border border-white/10 h-48">
                <FirebaseImage
                  src={referenceImage}
                  alt="参考图"
                  fill
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL={IMAGE_PLACEHOLDER}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setReferenceImage(null)}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                  disabled={isGenerating}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
                className="w-full h-48 rounded-lg border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-10 h-10" />
                <div className="text-center">
                  <p className="font-medium">点击上传参考图</p>
                  <p className="text-xs mt-1">支持 JPG、PNG 格式</p>
                </div>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* 话题标签 */}
          <div className="space-y-3">
            <label className="text-white font-medium flex items-center gap-2">
              <Hash className="w-5 h-5 text-pink-500" />
              话题标签 <span className="text-gray-400 text-sm">(可选)</span>
            </label>
            <HashtagInput
              value={hashtags}
              onChange={setHashtags}
              placeholder="添加话题标签..."
            />
          </div>

          {/* 生成按钮 */}
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                AI 正在创作中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                生成图案
              </>
            )}
          </Button>

          {/* 提示信息 */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-pink-500/10 to-cyan-500/10 border border-pink-500/20 rounded-lg p-4"
            >
              <p className="text-white text-sm text-center">
                ✨ AI 正在为你创作独一无二的图案
              </p>
              <p className="text-gray-400 text-xs text-center mt-1">
                通常需要 60-90 秒，请耐心等待...
              </p>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
