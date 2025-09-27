"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Plus,
  Mic,
  Palette,
  ArrowUp,
  TrendingUp,
  Sparkles,
  Workflow,
  ShoppingBag,
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

const featureCards = [
  {
    icon: Sparkles,
    title: '智能灵感引擎',
    description: '一句话描述即可生成高品质图案，灵感不再枯竭。',
  },
  {
    icon: Workflow,
    title: '一键完成上新',
    description: '从创意到商品展示只需数秒，自动生成模特效果图。',
  },
  {
    icon: ShoppingBag,
    title: '覆盖全品类',
    description: 'T恤、帆布包、家居装饰……多种类商品任你选择。',
  },
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
            className="group relative aspect-[9/16] overflow-hidden rounded-2xl border border-white/10 bg-secondary/60 transition-all duration-500 hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_20px_45px_rgba(93,46,189,0.4)] focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background"
          >
            <Image
              src={imageUrl}
              alt={altText}
              fill
              className="object-cover"
              placeholder="blur"
              blurDataURL={IMAGE_PLACEHOLDER}
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 text-white text-xs transition-opacity duration-500 group-hover:opacity-100 opacity-90">
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
          className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-secondary/60 transition-all duration-500 hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_20px_45px_rgba(93,46,189,0.4)] focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background"
        >
          <Image
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
    <div className="relative flex flex-col h-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_12%_18%,rgba(114,91,255,0.18),transparent_55%),radial-gradient(circle_at_82%_12%,rgba(52,211,235,0.12),transparent_60%),radial-gradient(circle_at_10%_78%,rgba(63,114,255,0.14),transparent_55%)]" />
        <div className="absolute left-1/4 top-[-8%] h-72 w-72 rounded-full bg-primary/40 blur-3xl animate-pulse-glow" />
        <div className="absolute right-[-6%] top-1/3 h-[420px] w-[420px] rounded-full bg-accent/40 blur-3xl animate-gradient-xy" />
        <div className="absolute bottom-[-10%] left-[-15%] h-96 w-96 rounded-full bg-primary/30 blur-3xl animate-float-slow" />
      </div>
      <ScrollArea className="relative z-10 flex-grow">
        <div className="px-4 md:px-8 py-10 space-y-10 max-w-5xl mx-auto">
          <section className="relative overflow-hidden rounded-[28px] border border-white/15 bg-gradient-to-br from-[rgba(94,86,255,0.78)] via-[rgba(133,76,204,0.72)] to-[rgba(46,196,255,0.7)] text-white shadow-[0_25px_80px_rgba(65,43,130,0.45)]">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)]" />
            <div className="absolute right-[-10%] top-[10%] h-64 w-64 rounded-full bg-white/25 blur-3xl animate-gradient-xy" />
            <div className="relative z-10 p-6 md:p-10 space-y-6">
              <div className="inline-flex items-center gap-2 text-sm font-medium bg-white/15 backdrop-blur px-4 py-1.5 rounded-full">
                <Sparkles size={16} />
                <span>全新创意工作台</span>
              </div>
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
                  灵感、设计、上架，一站式完成你的 POD 生意
                </h1>
                <p className="text-sm md:text-base text-white/80 leading-relaxed">
                  在一个屏幕上完成灵感输入、图案生成与商品预览。POD.STYLE 为创作者、品牌方和个人卖家打造高效的工作流。
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Button
                  size="lg"
                  className="rounded-full h-12 px-6 bg-white text-slate-900 shadow-[0_10px_30px_rgba(15,15,35,0.25)] transition-all duration-300 hover:shadow-[0_18px_40px_rgba(148,163,255,0.55)] hover:-translate-y-0.5"
                  onClick={handleStartCreating}
                >
                  <Sparkles className="mr-2" size={18} />
                  立即生成创意
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full h-12 px-6 border-white/60 text-white transition-all duration-300 hover:bg-white/15 hover:shadow-[0_14px_35px_rgba(114,91,255,0.45)]"
                  onClick={hasUserSession ? onViewProfile : onLoginRequest}
                >
                  <UserPlus className="mr-2" size={18} />
                  {hasUserSession ? '进入我的工作台' : '登录 / 注册'}
                </Button>
              </div>
            </div>
            <div className="absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-purple-400/30 blur-3xl animate-float-slow" />
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {featureCards.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-card/70 p-5 shadow-[0_18px_50px_rgba(24,24,54,0.45)] backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_28px_65px_rgba(102,76,255,0.45)]"
              >
                <div className="absolute inset-x-4 -top-12 h-24 rounded-full bg-gradient-to-r from-primary/25 via-accent/20 to-primary/25 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/15 text-primary shadow-[0_0_25px_rgba(102,76,255,0.35)]">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </section>

          <section ref={composerRef} className="rounded-3xl border border-white/10 bg-card/80 shadow-[0_22px_60px_rgba(18,20,50,0.55)] backdrop-blur p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">创意工作台</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  输入灵感或上传参考图，AI 将为你生成可用于商品的高质量图案。
                </p>
              </div>
              <Popover open={stylePopoverOpen} onOpenChange={setStylePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={stylePopoverOpen}
                    className="rounded-full h-11 px-4 border-white/15 bg-secondary/70 text-white/90 hover:bg-secondary/60"
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
                    className="w-full bg-secondary/70 text-foreground p-4 pl-12 pr-24 rounded-2xl h-14 border border-white/10 focus-visible:ring-2 focus-visible:ring-primary/70 transition focus-visible:border-primary/60"
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
                    <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 text-muted-foreground hover:text-white hover:bg-white/10 transition" asChild>
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
                      className={`rounded-full w-10 h-10 transition-colors ${isRecording ? 'text-red-500' : 'text-muted-foreground hover:text-white'}`}
                    >
                      <Mic size={18} />
                    </Button>
                    {(prompt || uploadedImage) && (
                      <Button
                        onClick={onGenerate}
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground hover:opacity-90 w-10 h-10 shadow-[0_10px_25px_rgba(93,46,189,0.45)]"
                      >
                        <ArrowUp size={18} />
                      </Button>
                    )}
                  </div>
                </div>
                <Button
                  className="lg:w-48 h-14 rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-accent text-white shadow-[0_18px_40px_rgba(93,46,189,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(46,196,255,0.55)]"
                  onClick={onGenerate}
                  disabled={isLoading}
                >
                  <Sparkles className="mr-2" size={18} />
                  {isLoading ? '正在创作...' : '生成图案'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                小提示：可以输入“赛博朋克风格的重庆洪崖洞夜景”或上传手绘草图，我们会自动为你优化。
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-card/80 shadow-[0_22px_60px_rgba(18,20,50,0.55)] backdrop-blur p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="text-primary" size={18} /> 灵感市场
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  浏览全球创作者的优秀作品，点击即可复刻并生成属于你的商品。
                </p>
              </div>
            </div>

            <Tabs defaultValue="popular" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-11 p-1 rounded-full bg-secondary/80 backdrop-blur">
                <TabsTrigger
                  value="popular"
                  className="py-1 rounded-full transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/70 data-[state=active]:to-accent/60 data-[state=active]:text-white data-[state=active]:shadow-[0_12px_30px_rgba(93,46,189,0.4)]"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  流行创意
                </TabsTrigger>
                <TabsTrigger
                  value="trending"
                  className="py-1 rounded-full transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/70 data-[state=active]:to-accent/60 data-[state=active]:text-white data-[state=active]:shadow-[0_12px_30px_rgba(93,46,189,0.4)]"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  定制排行
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
                  <Button
                    variant="outline"
                    className="w-full rounded-full border-white/15 text-white/90 hover:bg-white/10 hover:text-white"
                    onClick={onLoadMorePopular}
                  >
                    查看更多热门创意
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
                  <Button
                    variant="outline"
                    className="w-full rounded-full border-white/15 text-white/90 hover:bg-white/10 hover:text-white"
                    onClick={onLoadMoreTrending}
                  >
                    查看更多热销商品
                  </Button>
                )}
              </TabsContent>
            </Tabs>
          </section>

          <section className="mb-8">
            <div className="rounded-3xl border border-white/10 bg-secondary/70 text-secondary-foreground p-6 md:p-8 shadow-[0_22px_60px_rgba(18,20,50,0.55)] backdrop-blur">
              <h3 className="text-lg font-semibold">还在犹豫要不要开始？</h3>
              <p className="text-sm md:text-base text-secondary-foreground/80 mt-2 leading-relaxed">
                立即登录即可同步创作历史，并解锁商品生成、订单管理等完整功能。灵感永远不等人。
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Button
                  className="rounded-full h-11 px-6 bg-gradient-to-r from-primary via-purple-500 to-accent text-white shadow-[0_14px_40px_rgba(93,46,189,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(46,196,255,0.5)]"
                  onClick={hasUserSession ? onViewProfile : onLoginRequest}
                >
                  {hasUserSession ? '查看我的订单' : '登录体验完整流程'}
                </Button>
                {!hasUserSession && (
                  <Button
                    variant="ghost"
                    className="rounded-full h-11 px-6 text-white/80 hover:text-white hover:bg-white/10"
                    onClick={handleStartCreating}
                  >
                    先试试看生成效果
                  </Button>
                )}
                {hasUserSession && !isAuthenticated && (
                  <p className="text-xs text-secondary-foreground/80 flex items-center">
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
