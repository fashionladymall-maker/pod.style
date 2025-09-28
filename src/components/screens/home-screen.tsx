"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowUp,
  Bookmark,
  Compass,
  Heart,
  Home,
  MessageCircle,
  Mic,
  Palette,
  Plus,
  Repeat2,
  Search,
  Send,
  Share2,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Creation } from '@/lib/types';
import { IMAGE_PLACEHOLDER } from '@/lib/image-placeholders';
import type { HomeTab } from '@/app/app-client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
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

interface FeedEntry {
  creation: Creation;
  modelIndex: number;
  imageUrl: string;
  altText: string;
}

const formatCount = (count: number) => {
  if (count < 1000) return `${count}`;
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
  return `${(count / 1000000).toFixed(1)}m`;
};

const buildFeedEntry = (creation: Creation, source: HomeTab): FeedEntry => {
  if (source === 'trending') {
    const visibleModels = creation.models
      .map((model, index) => ({ model, index }))
      .filter(({ model }) => model?.isPublic !== false);

    const latestEntry = visibleModels.length > 0 ? visibleModels[visibleModels.length - 1] : null;
    const imageUrl = latestEntry
      ? latestEntry.model.previewUri || latestEntry.model.uri
      : creation.previewPatternUri || creation.patternUri;

    return {
      creation,
      modelIndex: latestEntry ? latestEntry.index : -1,
      imageUrl,
      altText: latestEntry ? `商品: ${latestEntry.model.category}` : `创意: ${creation.prompt}`,
    };
  }

  return {
    creation,
    modelIndex: -1,
    imageUrl: creation.previewPatternUri || creation.patternUri,
    altText: `创意: ${creation.prompt}`,
  };
};

const FeedItem: React.FC<{
  entry: FeedEntry;
  onSelect: (creation: Creation, modelIndex: number) => void;
}> = ({ entry, onSelect }) => {
  const { creation, modelIndex, imageUrl, altText } = entry;
  const actions = [
    { icon: Heart, label: formatCount(creation.likeCount || 0) },
    { icon: MessageCircle, label: formatCount(creation.commentCount || 0) },
    { icon: Bookmark, label: formatCount(creation.favoriteCount || 0) },
    { icon: Share2, label: formatCount(creation.shareCount || 0) },
    { icon: Repeat2, label: formatCount(creation.remakeCount || 0) },
  ];

  const handleSelect = () => onSelect(creation, modelIndex);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect();
    }
  };

  return (
    <div className="relative flex h-full w-full snap-start items-center justify-center px-4 pb-28">
      <div
        role="button"
        tabIndex={0}
        onClick={handleSelect}
        onKeyDown={handleKeyDown}
        className="group relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-[32px] bg-zinc-900 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.7)]"
      >
        <Image
          src={imageUrl}
          alt={altText}
          fill
          className="object-cover"
          placeholder="blur"
          blurDataURL={IMAGE_PLACEHOLDER}
          sizes="(max-width: 768px) 90vw, 420px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/20" />

        <div className="absolute bottom-24 left-5 right-24 space-y-3 text-left text-white">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-widest text-white/80">for you</span>
            {creation.style && (
              <span className="text-xs text-white/70">#{creation.style}</span>
            )}
          </div>
          <p className="text-lg font-semibold leading-snug drop-shadow-sm line-clamp-3">{creation.prompt}</p>
          {creation.summary && (
            <p className="text-xs text-white/70 line-clamp-2">{creation.summary}</p>
          )}
        </div>

        <div className="absolute bottom-24 right-4 flex flex-col items-center gap-6 text-white">
          {actions.map(({ icon: Icon, label }, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm transition-transform duration-200 group-hover:scale-105">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-white/80">{label}</span>
            </div>
          ))}
        </div>

        <div className="absolute bottom-8 left-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <button
            onClick={(event) => {
              event.stopPropagation();
              handleSelect();
            }}
            className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-white/90"
          >
            立即复刻
          </button>
        </div>
      </div>
    </div>
  );
};

const CreationFeedSkeleton = () => (
  <div className="flex h-full flex-col justify-center gap-6 px-6 pb-32">
    {[...Array(2)].map((_, index) => (
      <div key={index} className="mx-auto w-full max-w-sm">
        <Skeleton className="h-[520px] w-full rounded-[32px] bg-white/10" />
      </div>
    ))}
  </div>
);

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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [stylePopoverOpen, setStylePopoverOpen] = useState(false);
  const [placeholder, setPlaceholder] = useState(creativePrompts[0]);
  const [activeTab, setActiveTab] = useState<HomeTab>('popular');
  const [isComposerOpen, setIsComposerOpen] = useState(false);

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

  useEffect(() => {
    if (!isComposerOpen) {
      return;
    }
    const focusTimeout = setTimeout(() => inputRef.current?.focus(), 160);
    return () => clearTimeout(focusTimeout);
  }, [isComposerOpen]);

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

  const feedEntries = useMemo(() => {
    if (activeTab === 'trending') {
      return trendingCreations
        .slice(0, trendingVisibleCount)
        .map((creation) => buildFeedEntry(creation, 'trending'));
    }

    return publicCreations
      .slice(0, popularVisibleCount)
      .map((creation) => buildFeedEntry(creation, 'popular'));
  }, [activeTab, trendingCreations, publicCreations, trendingVisibleCount, popularVisibleCount]);

  const hasMore = activeTab === 'trending'
    ? trendingVisibleCount < trendingCreations.length
    : popularVisibleCount < publicCreations.length;

  const handleLoadMore = () => {
    if (activeTab === 'trending') {
      onLoadMoreTrending();
    } else {
      onLoadMorePopular();
    }
  };

  const handleSelectCreation = (creation: Creation, modelIndex: number) => {
    onSelectPublicCreation(creation, activeTab, modelIndex);
  };

  const handleComposerVisibility = (open: boolean) => {
    if (!open && isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
    setIsComposerOpen(open);
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <header className="flex items-center justify-between px-6 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-black text-black">
            <span>◎</span>
          </div>
          <div className="leading-tight">
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">pod.style</p>
            <p className="text-lg font-semibold">灵感抖刷台</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-semibold">
          {[
            { key: 'popular' as HomeTab, label: '推荐' },
            { key: 'trending' as HomeTab, label: '关注' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={cn(
                'relative pb-1 text-base transition-colors',
                activeTab === item.key ? 'text-white' : 'text-white/40'
              )}
            >
              {item.label}
              {activeTab === item.key && (
                <span className="absolute -bottom-1 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-white" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white/80 hover:bg-white/10">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white/80 hover:bg-white/10">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden">
        <div className="h-full snap-y snap-mandatory overflow-y-auto">
          {isFeedLoading ? (
            <CreationFeedSkeleton />
          ) : feedEntries.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-white/60">
              <Sparkles className="h-10 w-10 text-white/70" />
              <p className="text-lg font-semibold">此处还没有内容</p>
              <p className="text-sm">点击下方创作按钮，成为第一个上架的人。</p>
            </div>
          ) : (
            <>
              {feedEntries.map((entry) => (
                <FeedItem key={`${entry.creation.id}-${entry.modelIndex}`} entry={entry} onSelect={handleSelectCreation} />
              ))}
              {hasMore && (
                <div className="flex justify-center pb-36">
                  <Button
                    variant="ghost"
                    onClick={handleLoadMore}
                    className="rounded-full border border-white/20 px-6 py-2 text-white hover:bg-white/10"
                  >
                    加载更多内容
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black via-black/80 to-transparent" />

      <Sheet open={isComposerOpen} onOpenChange={handleComposerVisibility}>
        <footer className="relative z-10 border-t border-white/10 bg-black/80 pb-4 pt-2">
          <nav className="mx-auto grid max-w-md grid-cols-5 items-center px-6 text-xs font-medium uppercase tracking-widest text-white/70">
            <button className="flex flex-col items-center gap-1 text-white">
              <Home className="h-6 w-6" />
              首页
            </button>
            <button className="flex flex-col items-center gap-1">
              <Compass className="h-6 w-6" />
              发现
            </button>
            <SheetTrigger asChild>
              <button className="pointer-events-auto -mt-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500 via-fuchsia-500 to-blue-500 text-white shadow-lg">
                <Plus className="h-8 w-8" />
              </button>
            </SheetTrigger>
            <button
              onClick={hasUserSession ? onViewProfile : onLoginRequest}
              className="pointer-events-auto flex flex-col items-center gap-1"
            >
              <MessageCircle className="h-6 w-6" />
              消息
            </button>
            <button
              onClick={hasUserSession ? onViewProfile : onLoginRequest}
              className="pointer-events-auto flex flex-col items-center gap-1"
            >
              <UserRound className="h-6 w-6" />
              我的
            </button>
          </nav>
        </footer>

        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-hidden border-t border-white/10 bg-zinc-950 text-white"
        >
          <SheetHeader>
            <SheetTitle className="text-left text-2xl font-semibold text-white">灵感创作台</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/60">
                {hasUserSession ? (
                  <span>{isAuthenticated ? '欢迎回来，马上开刷新灵感。' : '匿名体验中，登录即可保存成果。'}</span>
                ) : (
                  <button className="text-white underline-offset-4" onClick={onLoginRequest}>
                    登录以同步作品
                  </button>
                )}
              </div>
              <Popover open={stylePopoverOpen} onOpenChange={setStylePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={stylePopoverOpen}
                    className="h-11 rounded-full border-white/20 bg-white/10 px-4 text-white hover:bg-white/20"
                  >
                    <Palette className="mr-2 h-4 w-4" />
                    <span className="text-xs">{selectedStyle.split(' ')[0]}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] border-white/10 bg-zinc-900 p-0 text-white">
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
                          className="w-full justify-start px-3 py-2 text-sm text-white hover:bg-white/10"
                        >
                          {style}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Input
                  ref={inputRef}
                  className="h-16 w-full rounded-3xl border border-white/10 bg-white/10 pl-14 pr-28 text-base text-white placeholder:text-white/40"
                  placeholder={placeholder}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (prompt || uploadedImage) {
                        onGenerate();
                      }
                    }
                  }}
                />
                <div className="absolute left-5 top-1/2 flex -translate-y-1/2 items-center gap-2">
                  <Input
                    type="file"
                    id="imageUpload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white/10 text-white" asChild>
                    <Label htmlFor="imageUpload" className="flex h-full w-full cursor-pointer items-center justify-center">
                      {uploadedImage ? (
                        <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-white/20">
                          <Image src={uploadedImage} alt="Uploaded preview" fill className="object-cover" />
                        </div>
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                    </Label>
                  </Button>
                </div>
                <div className="absolute right-5 top-1/2 flex -translate-y-1/2 items-center gap-3">
                  <Button
                    onClick={handleMicClick}
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-12 w-12 rounded-2xl bg-white/10 text-white transition',
                      isRecording && 'border border-rose-500/60 text-rose-400'
                    )}
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                  {(prompt || uploadedImage) && (
                    <Button
                      onClick={onGenerate}
                      size="icon"
                      className="h-12 w-12 rounded-2xl bg-white text-zinc-900 hover:bg-white/80"
                      disabled={isLoading}
                    >
                      <ArrowUp className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-white/50">
                支持中文语音口述或上传灵感草图，AI 将生成可上架的爆款图案。
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                className="h-14 rounded-full bg-white text-lg font-semibold text-zinc-900 hover:bg-white/90"
                onClick={onGenerate}
                disabled={isLoading || (!prompt && !uploadedImage)}
              >
                {isLoading ? '创作中…' : '生成专属灵感' }
              </Button>
              <p className="text-center text-xs text-white/50">
                生成后的作品会自动加入推荐流，越多人互动权重越高。
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default HomeScreen;
