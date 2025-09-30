"use client";

// @ts-nocheck

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { FirebaseImage } from '@/components/ui/firebase-image';
import {
  Plus,
  Mic,
  Palette,
  ArrowUp,
  TrendingUp,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Creation } from '@/lib/types';
import { IMAGE_PLACEHOLDER } from '@/lib/image-placeholders';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { HomeTab } from '@/app/app-client';
import { Skeleton } from '../ui/skeleton';

interface HomeScreenProps {
  prompt: string;
  setPrompt: (value: string) => void;
  uploadedImage: string | null;
  setUploadedImage: (value: string | null) => void;
  onGenerate: () => void;
  publicCreations: Creation[];
  trendingCreations: Creation[];
  popularVisibleCount: number;
  trendingVisibleCount: number;
  onLoadMorePopular: () => void;
  onLoadMoreTrending: () => void;
  onSelectPublicCreation: (creation: Creation, source: HomeTab, modelIndex?: number) => void;
  isLoading: boolean;
  isFeedLoading: boolean;
  isRecording: boolean;
  setIsRecording: (value: boolean) => void;
  artStyles: string[];
  selectedStyle: string;
  setSelectedStyle: (style: string) => void;
  onLoginRequest: () => void;
  onViewProfile: () => void;
  hasUserSession: boolean;
  isAuthenticated: boolean;
} 

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface SpeechRecognitionWindow extends Window {
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
  SpeechRecognition?: SpeechRecognitionConstructor;
}

const getSpeechRecognitionConstructor = (): SpeechRecognitionConstructor | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const speechWindow = window as SpeechRecognitionWindow;
  return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
};

const creativePrompts = [
  '一只戴着VR眼镜的太空猫',
  '赛博朋克风格的上海夜景',
  '水墨画风格的巨龙',
  '一个宇航员在月球上冲浪',
  '像素艺术风格的日落',
  '一只正在打碟的柴犬DJ',
  '梵高星空下的长城',
  '一只章鱼在指挥交响乐',
  '一个机器人正在种花',
  '蒸汽朋克风格的飞行器',
];

const CreationGridSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
      <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
    ))}
  </div>
);

const CreationGrid = ({
  creations,
  onSelect,
  displayMode = 'pattern',
  isLoading,
}: {
  creations: Creation[];
  onSelect: (creation: Creation, modelIndex?: number) => void;
  displayMode?: 'pattern' | 'model';
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <CreationGridSkeleton />;
  }

  if (creations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="font-medium">还没有公开作品</p>
        <p className="text-sm mt-1">成为第一个发布惊艳创意的人吧！</p>
      </div>
    );
  }

  if (displayMode === 'model') {
    const itemsToDisplay = creations.map((creation) => {
      const visibleModels = creation.models
        .map((model, index) => ({ model, index }))
        .filter(({ model }) => model?.isPublic !== false);
      const latestEntry = visibleModels.length > 0 ? visibleModels[visibleModels.length - 1] : null;
      const imageUrl = latestEntry
        ? latestEntry.model.previewUri || latestEntry.model.uri
        : creation.previewPatternUri || creation.patternUri;
      const altText = latestEntry ? `商品: ${latestEntry.model.category}` : `创意: ${creation.prompt}`;
      const modelIndex = latestEntry ? latestEntry.index : -1;

      return {
        creation,
        modelIndex,
        imageUrl,
        altText,
      };
    });

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {itemsToDisplay.map(({ creation, modelIndex, imageUrl, altText }) => (
          <button
            key={`${creation.id}-${modelIndex}`}
            onClick={() => onSelect(creation, modelIndex)}
            className="aspect-[9/16] bg-secondary rounded-2xl overflow-hidden transform hover:scale-[1.02] transition duration-300 focus:outline-none focus:ring-2 ring-offset-2 ring-offset-background ring-primary relative border border-transparent hover:border-blue-500"
          >
            <FirebaseImage
              src={imageUrl}
              alt={altText}
              fill
              className="object-cover"
              placeholder="blur"
              blurDataURL={IMAGE_PLACEHOLDER}
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 text-white text-xs">
              <p className="truncate">{creation.prompt}</p>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {creations.map((creation) => (
        <button
          key={creation.id + '-pattern'}
          onClick={() => onSelect(creation)}
          className="aspect-square bg-secondary rounded-2xl overflow-hidden transform hover:scale-[1.02] transition duration-300 focus:outline-none focus:ring-2 ring-offset-2 ring-offset-background ring-primary relative border border-transparent hover:border-blue-500"
        >
          <FirebaseImage
            src={creation.previewPatternUri || creation.patternUri}
            alt={`公共创意 ${creation.id}`}
            fill
            className="object-cover"
            placeholder="blur"
            blurDataURL={IMAGE_PLACEHOLDER}
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </button>
      ))}
    </div>
  );
};

const HomeScreen: React.FC<HomeScreenProps> = ({
  prompt,
  setPrompt,
  uploadedImage,
  setUploadedImage,
  onGenerate,
  publicCreations,
  trendingCreations,
  popularVisibleCount,
  trendingVisibleCount,
  onLoadMorePopular,
  onLoadMoreTrending,
  onSelectPublicCreation,
  isLoading,
  isFeedLoading,
  isRecording,
  setIsRecording,
  artStyles,
  selectedStyle,
  setSelectedStyle,
  onLoginRequest,
  onViewProfile,
  hasUserSession,
  isAuthenticated,
}) => {
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef('');
  const composerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [stylePopoverOpen, setStylePopoverOpen] = useState(false);
  const [placeholder, setPlaceholder] = useState(creativePrompts[0]);
  const highlightCreations = (trendingCreations.length ? trendingCreations : publicCreations).slice(0, 3);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * creativePrompts.length);
      setPlaceholder(creativePrompts[randomIndex]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
    if (SpeechRecognitionCtor) {
      const recognition = new SpeechRecognitionCtor();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setPrompt(finalTranscriptRef.current + interimTranscript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          toast({ variant: 'destructive', title: '语音识别错误', description: event.error });
          setIsRecording(false);
        }
      };

      recognition.onend = () => {
        if (isRecording) {
          recognition.start();
        }
      };
    } else {
      console.warn('SpeechRecognition API is not supported in this browser.');
    }
  }, [setPrompt, toast, isRecording, setIsRecording]);

  const handleMicClick = async () => {
    if (!recognitionRef.current) {
      toast({ variant: 'destructive', title: '语音识别不可用', description: '您的浏览器不支持语音识别功能。' });
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      if (isRecording) {
        setIsRecording(false);
        recognitionRef.current.stop();
        finalTranscriptRef.current = prompt;
      } else {
        finalTranscriptRef.current = prompt;
        setIsRecording(true);
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Microphone permission denied:', error);
      toast({ variant: 'destructive', title: '麦克风权限被拒绝', description: '请在浏览器设置中允许使用麦克风。' });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => setUploadedImage(event.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleStartCreating = () => {
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-white">
      <ScrollArea className="flex-grow">
        <div className="px-4 md:px-8 py-6 space-y-10 max-w-5xl mx-auto">
          <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 shadow-[0_30px_120px_-50px_rgba(59,130,246,0.6)]">
            <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.55),_transparent_60%)]" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12 p-6 md:p-12">
              <div className="space-y-6 w-full md:max-w-xl">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/60">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  live pod studio
                </div>
                <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
                  一刷就爆款
                </h1>
                <p className="text-sm md:text-base text-white/70 max-w-sm">
                  打开即见热卖灵感，生成按钮永远在手边。
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <Button
                    size="lg"
                    className="rounded-full h-12 px-6 bg-white text-zinc-900 hover:bg-white/90"
                    onClick={handleStartCreating}
                  >
                    <Sparkles className="mr-2" size={18} />
                    秒生成
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full h-12 px-6 border-white/40 text-white hover:bg-white/10"
                    onClick={hasUserSession ? onViewProfile : onLoginRequest}
                  >
                    <UserPlus className="mr-2" size={18} />
                    {hasUserSession ? '我的空间' : '立即登录'}
                  </Button>
                </div>
              </div>
              <div className="w-full md:w-[320px]">
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {highlightCreations.length > 0 ? (
                    highlightCreations.map((creation) => {
                      const preview = creation.models?.find((model) => model?.isPublic !== false)?.previewUri || creation.previewPatternUri || creation.patternUri;
                      return (
                        <div
                          key={creation.id}
                          className="relative aspect-[9/16] rounded-3xl overflow-hidden border border-white/10 bg-white/5"
                        >
                          <FirebaseImage
                            src={preview}
                            alt={creation.prompt}
                            fill
                            className="object-cover"
                            placeholder="blur"
                            blurDataURL={IMAGE_PLACEHOLDER}
                            sizes="(max-width: 768px) 30vw, 15vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/60" />
                        </div>
                      );
                    })
                  ) : (
                    [...Array(3)].map((_, index) => (
                      <div
                        key={index}
                        className="aspect-[9/16] rounded-3xl bg-white/5 animate-pulse"
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <section ref={composerRef} className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-sm p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1 text-white/80">
                <h2 className="text-xl font-semibold text-white">灵感输入区</h2>
                <p className="text-xs">一句话或一张图，让 AI 帮你完成剩下的。</p>
              </div>
              <Popover open={stylePopoverOpen} onOpenChange={setStylePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={stylePopoverOpen}
                    className="rounded-full bg-white/5 hover:bg-white/10 h-11 px-4 text-white border-white/20"
                  >
                    <Palette className="mr-2 h-4 w-4" />
                    <span className="text-xs">{selectedStyle.split(' ')[0]}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-0">
                  <ScrollArea className="h-72">
                    <div className="p-1">
                      {artStyles.map((style) => (
                        <Button
                          variant="ghost"
                          key={style}
                          onClick={() => {
                            setSelectedStyle(style);
                            setStylePopoverOpen(false);
                          }}
                          className="w-full justify-start"
                        >
                          {style}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    className="w-full bg-white/10 text-white placeholder:text-white/40 p-4 pl-12 pr-24 rounded-2xl h-14 border border-white/10 focus-visible:ring-2 focus-visible:ring-white/40"
                    placeholder={placeholder}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        onGenerate();
                      }
                    }}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Input
                      type="file"
                      id="imageUpload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 text-white/60 hover:text-white" asChild>
                      <Label htmlFor="imageUpload" className="cursor-pointer flex items-center justify-center">
                        {uploadedImage ? (
                          <div className="relative w-8 h-8 border rounded-md overflow-hidden">
                            <Image src={uploadedImage} alt="Uploaded preview" fill className="object-cover" />
                          </div>
                        ) : (
                          <Plus size={20} />
                        )}
                      </Label>
                    </Button>
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Button
                      onClick={handleMicClick}
                      variant="ghost"
                      size="icon"
                      className={`rounded-full w-10 h-10 ${isRecording ? 'text-red-400' : 'text-white/60 hover:text-white'}`}
                    >
                      <Mic size={18} />
                    </Button>
                    {(prompt || uploadedImage) && (
                      <Button
                        onClick={onGenerate}
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-white text-zinc-900 hover:bg-white/80 w-10 h-10"
                      >
                        <ArrowUp size={18} />
                      </Button>
                    )}
                  </div>
                </div>
                <Button
                  className="lg:w-48 h-14 rounded-2xl bg-white text-zinc-900 hover:bg-white/90"
                  onClick={onGenerate}
                  disabled={isLoading}
                >
                  <Sparkles className="mr-2" size={18} />
                  {isLoading ? '创作中…' : '开始生成'}
                </Button>
              </div>
              <p className="text-[11px] text-white/50">
                灵感随手记，随时点亮商品效果。
              </p>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-sm p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-white">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="text-emerald-400" size={18} /> 热门灵感流
              </h2>
              <p className="text-xs text-white/60">滑动挑选喜欢的，立刻复刻上架。</p>
            </div>

            <Tabs defaultValue="popular" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-10 p-0.5 rounded-full bg-white/10">
                <TabsTrigger value="popular" className="py-1 rounded-full data-[state=active]:bg-white data-[state=active]:text-zinc-900">
                  <Sparkles className="mr-2 h-4 w-4" />
                  流行
                </TabsTrigger>
                <TabsTrigger value="trending" className="py-1 rounded-full data-[state=active]:bg-white data-[state=active]:text-zinc-900">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  热销
                </TabsTrigger>
              </TabsList>
              <TabsContent value="popular" className="mt-4 space-y-4">
                <CreationGrid
                  creations={publicCreations.slice(0, popularVisibleCount)}
                  onSelect={(creation, modelIndex) => onSelectPublicCreation(creation, 'popular', modelIndex)}
                  displayMode="pattern"
                  isLoading={isLoading || isFeedLoading}
                />
                {popularVisibleCount < publicCreations.length && (
                  <Button variant="outline" className="w-full rounded-full border-white/20 text-white hover:bg-white/10" onClick={onLoadMorePopular}>
                    加载更多灵感
                  </Button>
                )}
              </TabsContent>
              <TabsContent value="trending" className="mt-4 space-y-4">
                <CreationGrid
                  creations={trendingCreations.slice(0, trendingVisibleCount)}
                  onSelect={(creation, modelIndex) => onSelectPublicCreation(creation, 'trending', modelIndex)}
                  displayMode="model"
                  isLoading={isLoading || isFeedLoading}
                />
                {trendingVisibleCount < trendingCreations.length && (
                  <Button variant="outline" className="w-full rounded-full border-white/20 text-white hover:bg-white/10" onClick={onLoadMoreTrending}>
                    加载更多热销
                  </Button>
                )}
              </TabsContent>
            </Tabs>
          </section>

          <section className="mb-8">
            <div className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-sm text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold">现在开刷</h3>
                <p className="text-sm text-white/60">收藏、复刻、开卖，一气呵成。</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="rounded-full h-11 px-6 bg-white text-zinc-900 hover:bg-white/90" onClick={hasUserSession ? onViewProfile : onLoginRequest}>
                  {hasUserSession ? '进入我的订单' : '登录上手'}
                </Button>
                {!hasUserSession && (
                  <Button variant="ghost" className="rounded-full h-11 px-6 border border-white/20 text-white hover:bg-white/10" onClick={handleStartCreating}>
                    先试试看
                  </Button>
                )}
                {hasUserSession && !isAuthenticated && (
                  <p className="text-xs text-white/50 flex items-center">
                    当前为匿名体验模式，注册账号即可永久保存成果。
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
};

export default HomeScreen;
