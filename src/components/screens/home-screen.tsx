
"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Plus, Mic, Palette, ArrowUp, TrendingUp, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FirebaseUser, Creation } from '@/lib/types';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { HomeTab } from '@/app/page';

interface HomeScreenProps {
  prompt: string;
  setPrompt: (value: string) => void;
  user: FirebaseUser | null;
  uploadedImage: string | null;
  setUploadedImage: (value: string | null) => void;
  onGenerate: () => void;
  creations: Creation[];
  publicCreations: Creation[];
  trendingCreations: Creation[];
  onGoToHistory: (index: number) => void;
  onSelectPublicCreation: (creation: Creation) => void;
  isLoading: boolean;
  isRecording: boolean;
  setIsRecording: (value: boolean) => void;
  artStyles: string[];
  selectedStyle: string;
  setSelectedStyle: (style: string) => void;
}

const creativePrompts = [
  "一只戴着VR眼镜的太空猫",
  "赛博朋克风格的上海夜景",
  "水墨画风格的巨龙",
  "一个宇航员在月球上冲浪",
  "像素艺术风格的日落",
  "一只正在打碟的柴犬DJ",
  "梵高星空下的长城",
  "一只章鱼在指挥交响乐",
  "一个机器人正在种花",
  "蒸汽朋克风格的飞行器"
];

const CreationGrid = ({ creations, onSelectCreation }: { creations: Creation[], onSelectCreation: (creation: Creation) => void }) => {
    if (creations.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <p>还没有作品</p>
                <p className="text-sm">快去创作你的第一个设计吧！</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-4">
            {creations.map((creation) => (
                <button 
                    key={creation.id} 
                    onClick={() => onSelectCreation(creation)} 
                    className="aspect-square bg-secondary rounded-lg overflow-hidden transform hover:scale-105 transition-transform focus:outline-none focus:ring-2 ring-offset-2 ring-offset-background ring-primary relative border hover:border-blue-500"
                >
                    <Image src={creation.patternUri} alt={`公共创意 ${creation.id}`} layout="fill" className="object-cover" />
                </button>
            ))}
        </div>
    );
};


const HomeScreen: React.FC<HomeScreenProps> = ({
  prompt, setPrompt, user, uploadedImage, setUploadedImage, onGenerate,
  creations, publicCreations, trendingCreations, onGoToHistory, onSelectPublicCreation,
  isLoading, isRecording, setIsRecording, artStyles, selectedStyle, setSelectedStyle
}) => {
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const [stylePopoverOpen, setStylePopoverOpen] = useState(false);
  const [placeholder, setPlaceholder] = useState(creativePrompts[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * creativePrompts.length);
      setPlaceholder(creativePrompts[randomIndex]);
    }, 3000); // Change placeholder every 3 seconds

    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';

      recognition.onresult = (event: any) => {
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

      recognition.onerror = (event: any) => {
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
        console.error("Microphone permission denied:", error);
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


  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow">
        <div className="p-6 space-y-4">
             <Tabs defaultValue="popular" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="popular"><Sparkles className="mr-2 h-4 w-4" />流行创意</TabsTrigger>
                    <TabsTrigger value="trending"><TrendingUp className="mr-2 h-4 w-4" />定制排行</TabsTrigger>
                </TabsList>
                <TabsContent value="popular" className="mt-4">
                    {isLoading ? (
                        <div className="text-center p-12 text-muted-foreground"><Loader2 className="animate-spin inline-block mr-2" />正在加载...</div>
                    ) : (
                        <CreationGrid creations={publicCreations.filter(pc => !creations.some(c => c.id === pc.id))} onSelectCreation={onSelectPublicCreation} />
                    )}
                </TabsContent>
                <TabsContent value="trending" className="mt-4">
                    {isLoading ? (
                        <div className="text-center p-12 text-muted-foreground"><Loader2 className="animate-spin inline-block mr-2" />正在加载...</div>
                    ) : (
                        <CreationGrid creations={trendingCreations.filter(pc => !creations.some(c => c.id === pc.id))} onSelectCreation={onSelectPublicCreation} />
                    )}
                </TabsContent>
            </Tabs>
        </div>
      </ScrollArea>

      <div className="mt-auto p-4 bg-background border-t">
        <div className="relative mb-3">
            <Input
              className="w-full bg-secondary text-foreground p-3 pr-12 rounded-full h-12 border-none focus-visible:ring-1 transition-all duration-300"
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
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                {prompt || uploadedImage ? (
                    <Button onClick={onGenerate} variant="ghost" size="icon" className="rounded-full bg-blue-500 text-white hover:bg-blue-600">
                        <ArrowUp size={20} />
                    </Button>
                ) : (
                    <div className="w-10 h-10" /> 
                )}
            </div>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <Input type="file" id="imageUpload" className="hidden" accept="image/*" onChange={handleImageUpload} />
          <Button variant="ghost" size="icon" className="rounded-full bg-secondary" asChild>
            <Label htmlFor="imageUpload" className="cursor-pointer"><Plus size={24} /></Label>
          </Button>

          <Popover open={stylePopoverOpen} onOpenChange={setStylePopoverOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={stylePopoverOpen}
                    className="rounded-full bg-secondary hover:bg-muted"
                >
                    <Palette className="mr-2 h-4 w-4" />
                    风格: {selectedStyle.split(' ')[0]}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0 mb-2">
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

          <Button onClick={handleMicClick} variant="ghost" size="icon" className={`rounded-full bg-secondary ${isRecording ? 'text-red-500' : 'text-muted-foreground'}`}>
            <Mic size={20} />
          </Button>

          {uploadedImage && (
            <div className="relative w-10 h-10 border rounded-md ml-auto">
              <Image src={uploadedImage} alt="Uploaded preview" layout="fill" className="rounded-sm object-cover" />
              <Button onClick={() => setUploadedImage(null)} variant="destructive" size="sm" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0">X</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;

  
