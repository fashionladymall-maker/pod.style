"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Creation } from "@/lib/types";
import type { HomeTab } from "@/app/app-client";
import VerticalCreationFeed from "../feeds/vertical-creation-feed";
import {
  Bell,
  Bookmark,
  Flame,
  Heart,
  Mic,
  Palette,
  Plus,
  Search,
  Share2,
  Sparkles,
  Upload,
  UserRound,
  Wand2,
} from "lucide-react";

interface HomeScreenProps {
  prompt: string;
  setPrompt: (value: string) => void;
  uploadedImage: string | null;
  setUploadedImage: (value: string | null) => void;
  onGenerate: () => void;
  publicCreations: Creation[];
  trendingCreations: Creation[];
  userCreations: Creation[];
  popularVisibleCount: number;
  trendingVisibleCount: number;
  immersiveVisibleCount: number;
  onLoadMorePopular: () => void;
  onLoadMoreTrending: () => void;
  onLoadMoreImmersive: () => void;
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

type FeedMode = "forYou" | "trending" | "studio";

interface FeedDefinition {
  key: FeedMode;
  label: string;
  description: string;
  creations: Creation[];
  visibleCount: number;
  onLoadMore: () => void;
  source: HomeTab;
}

const getSpeechRecognitionConstructor = (): SpeechRecognitionConstructor | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const speechWindow = window as SpeechRecognitionWindow;
  return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
};

const creativePrompts = [
  "宇航员与锦鲤在云海中共舞",
  "霓虹灯下的赛博朋克北京胡同",
  "星空里漂浮的水墨松林",
  "在月球咖啡馆里写代码的机器人",
  "绽放的像素化樱花树",
  "身披龙纹的未来武士",
  "波普风格的中国戏曲脸谱",
  "鲸鱼在城市天际线上空翱翔",
  "复古海报里的街头滑板少年",
  "巨型蘑菇构成的梦境花园",
];

const actionCounts = (creation: Creation | null) => ({
  likes: creation?.likeCount ?? 0,
  favorites: creation?.favoriteCount ?? 0,
  shares: creation?.shareCount ?? 0,
});

const resolveVisibleCount = (count: number, length: number, fallback: number) => {
  if (length === 0) return 0;
  if (count > 0) {
    return Math.min(count, length);
  }
  return Math.min(fallback, length);
};

const HomeScreen: React.FC<HomeScreenProps> = ({
  prompt,
  setPrompt,
  uploadedImage,
  setUploadedImage,
  onGenerate,
  publicCreations,
  trendingCreations,
  userCreations,
  popularVisibleCount,
  trendingVisibleCount,
  immersiveVisibleCount,
  onLoadMorePopular,
  onLoadMoreTrending,
  onLoadMoreImmersive,
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
  const finalTranscriptRef = useRef("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [placeholder, setPlaceholder] = useState(() => creativePrompts[0]);
  const [feedMode, setFeedMode] = useState<FeedMode>("forYou");
  const [activeHighlight, setActiveHighlight] = useState<{ creation: Creation; modelIndex: number } | null>(null);
  const [stylePopoverOpen, setStylePopoverOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = creativePrompts[Math.floor(Math.random() * creativePrompts.length)];
      setPlaceholder(next);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionCtor) {
      console.warn("SpeechRecognition API is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "zh-CN";

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let interimTranscript = "";
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
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech" && event.error !== "aborted") {
        toast({ variant: "destructive", title: "语音识别错误", description: event.error });
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      if (isRecording) {
        recognition.start();
      }
    };

    return () => {
      recognition.stop();
    };
  }, [isRecording, setIsRecording, setPrompt, toast]);

  const feedDefinitions = useMemo<Record<FeedMode, FeedDefinition>>(() => ({
    forYou: {
      key: "forYou",
      label: "为你",
      description: "智能精选灵感",
      creations: trendingCreations,
      visibleCount: resolveVisibleCount(
        Math.max(immersiveVisibleCount, trendingVisibleCount),
        trendingCreations.length,
        6
      ),
      onLoadMore: () => {
        onLoadMoreImmersive();
        onLoadMoreTrending();
      },
      source: "immersive",
    },
    trending: {
      key: "trending",
      label: "热榜",
      description: "全站实时热度",
      creations: publicCreations,
      visibleCount: resolveVisibleCount(popularVisibleCount, publicCreations.length, 9),
      onLoadMore: onLoadMorePopular,
      source: "popular",
    },
    studio: {
      key: "studio",
      label: "工作台",
      description: hasUserSession ? "我的创作合集" : "登录后开启创作之旅",
      creations: hasUserSession ? userCreations : [],
      visibleCount: hasUserSession ? userCreations.length : 0,
      onLoadMore: () => undefined,
      source: "mine",
    },
  }), [
    hasUserSession,
    immersiveVisibleCount,
    onLoadMoreImmersive,
    onLoadMorePopular,
    onLoadMoreTrending,
    popularVisibleCount,
    publicCreations,
    trendingCreations,
    trendingVisibleCount,
    userCreations,
  ]);

  const activeFeed = feedDefinitions[feedMode];
  const feedVisibleCount = activeFeed.visibleCount;
  const hasMore = activeFeed.creations.length > feedVisibleCount;

  useEffect(() => {
    if (activeFeed.creations.length === 0) {
      setActiveHighlight(null);
    }
  }, [activeFeed.creations.length, feedMode]);

  const handleFeedChange = (mode: FeedMode) => {
    if (mode === "studio" && !hasUserSession) {
      onLoginRequest();
      return;
    }
    setFeedMode(mode);
    setActiveHighlight(null);
  };

  const handleMicClick = async () => {
    if (!recognitionRef.current) {
      toast({ variant: "destructive", title: "语音识别不可用", description: "您的浏览器不支持语音输入。" });
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
      console.error("Microphone permission denied:", error);
      toast({ variant: "destructive", title: "麦克风权限被拒绝", description: "请在浏览器设置中允许使用麦克风。" });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => setUploadedImage(e.target?.result as string);
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  const handleComposerFocus = () => {
    textareaRef.current?.focus();
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onGenerate();
  };

  const currentCounts = actionCounts(activeHighlight?.creation ?? null);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#0b1120] to-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_60%),_radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),_transparent_55%)]" />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-4 pb-32 pt-24 sm:px-8 lg:px-12">
        <div className="flex w-full max-w-6xl flex-1 items-stretch justify-center">
          <VerticalCreationFeed
            creations={activeFeed.creations}
            visibleCount={feedVisibleCount}
            onSelect={(creation, modelIndex) => onSelectPublicCreation(creation, activeFeed.source, modelIndex)}
            onLoadMore={() => {
              if (hasMore) {
                activeFeed.onLoadMore();
              }
            }}
            hasMore={hasMore}
            isLoading={isFeedLoading}
            className="backdrop-blur-xl"
            onActiveItemChange={({ creation, modelIndex }) => setActiveHighlight({ creation, modelIndex })}
          />
        </div>
      </div>

      <header className="pointer-events-none absolute left-0 right-0 top-0 z-30 px-4 pt-6 sm:px-8">
        <div className="pointer-events-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-sky-400" />
              <div>
                <p className="text-lg font-semibold tracking-wide">POD.STYLE LIVE</p>
                <p className="text-xs text-white/60">灵感即刻生成，滑动探索无限可能</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full bg-white/10 text-white hover:bg-white/20">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full bg-white/10 text-white hover:bg-white/20">
                <Bell className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={isAuthenticated ? onViewProfile : onLoginRequest}
              >
                <UserRound className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 text-sm">
            {Object.values(feedDefinitions).map((feed) => {
              const isActive = feed.key === feedMode;
              return (
                <button
                  key={feed.key}
                  onClick={() => handleFeedChange(feed.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 transition",
                    isActive
                      ? "bg-white text-slate-900 font-semibold shadow-[0_8px_24px_rgba(15,118,246,0.35)]"
                      : "text-white/70 hover:text-white"
                  )}
                >
                  {feed.key === "forYou" && <Sparkles className="h-4 w-4" />}
                  {feed.key === "trending" && <Flame className="h-4 w-4" />}
                  {feed.key === "studio" && <UserRound className="h-4 w-4" />}
                  <span>{feed.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <aside className="pointer-events-none absolute right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-5 lg:flex">
        <div className="pointer-events-auto flex flex-col items-center gap-4 rounded-3xl bg-white/5 px-4 py-5 text-white/80 backdrop-blur">
          <button className="flex flex-col items-center gap-1 text-sm">
            <Heart className="h-6 w-6" />
            <span>{currentCounts.likes.toLocaleString()}</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-sm">
            <Bookmark className="h-6 w-6" />
            <span>{currentCounts.favorites.toLocaleString()}</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-sm">
            <Share2 className="h-6 w-6" />
            <span>{currentCounts.shares.toLocaleString()}</span>
          </button>
          <Button
            size="icon"
            className="h-12 w-12 rounded-full bg-sky-500 text-white shadow-lg shadow-sky-500/50"
            onClick={handleComposerFocus}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </aside>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-6 sm:px-8">
        <div
          ref={composerRef}
          className="pointer-events-auto w-full max-w-3xl rounded-[32px] border border-white/10 bg-white/8 p-6 backdrop-blur-xl shadow-[0_-20px_60px_rgba(15,23,42,0.45)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/60">
              <Sparkles className="h-4 w-4" />
              <span>即时创作工作台</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={hasUserSession ? onViewProfile : onLoginRequest}
            >
              {hasUserSession ? "我的订单" : "登录同步"}
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={placeholder}
                rows={3}
                className="flex-1 resize-none rounded-2xl border-white/10 bg-black/40 text-sm leading-relaxed text-white placeholder:text-white/40"
              />
              <div className="flex w-full flex-col gap-3 lg:w-48">
                <Button
                  type="submit"
                  className="h-12 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 text-base font-semibold text-white shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? "生成中..." : "生成灵感"}
                </Button>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className={cn(
                      "h-11 rounded-2xl bg-white/10 text-white hover:bg-white/20",
                      isRecording && "border border-sky-400 bg-sky-500/20 text-sky-100"
                    )}
                    onClick={handleMicClick}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11 rounded-2xl bg-white/10 text-white hover:bg-white/20"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Popover open={stylePopoverOpen} onOpenChange={setStylePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-11 rounded-2xl bg-white/10 text-white hover:bg-white/20"
                      >
                        <Palette className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 rounded-2xl border border-white/10 bg-slate-900/95 text-white">
                      <div className="flex items-center gap-2 pb-2 text-xs uppercase tracking-[0.25em] text-white/50">
                        <Wand2 className="h-3.5 w-3.5" />
                        <span>选择风格</span>
                      </div>
                      <ScrollArea className="max-h-60 pr-1">
                        <div className="grid grid-cols-1 gap-1">
                          {artStyles.map((style) => (
                            <button
                              key={style}
                              type="button"
                              onClick={() => {
                                setSelectedStyle(style);
                                setStylePopoverOpen(false);
                              }}
                              className={cn(
                                "w-full rounded-xl px-3 py-2 text-left text-sm transition",
                                selectedStyle === style
                                  ? "bg-sky-500/20 text-sky-100"
                                  : "hover:bg-white/10 hover:text-white"
                              )}
                            >
                              {style}
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

            <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
              <span className="rounded-full bg-white/10 px-3 py-1 text-white/70">当前风格：{selectedStyle}</span>
              {creativePrompts.slice(0, 4).map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => setPrompt(idea)}
                  className="rounded-full bg-white/5 px-3 py-1 hover:bg-white/15 hover:text-white"
                >
                  {idea}
                </button>
              ))}
            </div>

            {uploadedImage && (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/20">
                  <Image src={uploadedImage} alt="参考灵感图" fill className="object-cover" />
                </div>
                <div className="flex-1 truncate">已附加参考图</div>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full bg-white/10 text-white hover:bg-white/20"
                  onClick={() => setUploadedImage(null)}
                >
                  移除
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
