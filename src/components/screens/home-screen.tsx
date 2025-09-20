"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Plus, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface HomeScreenProps {
  prompt: string;
  setPrompt: (value: string) => void;
  uploadedImage: string | null;
  setUploadedImage: (value: string | null) => void;
  onGenerate: () => void;
  patternHistory: string[];
  onGoToHistory: (index: number) => void;
  isRecording: boolean;
  setIsRecording: (value: boolean) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  prompt, setPrompt, uploadedImage, setUploadedImage, onGenerate,
  patternHistory, onGoToHistory, isRecording, setIsRecording
}) => {
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

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
        }
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        if (isRecording) {
           recognition.start();
        } else {
           recognition.stop();
           finalTranscriptRef.current = ''; 
        }
      };

    } else {
      console.warn('SpeechRecognition API is not supported in this browser.');
    }
  }, [setPrompt, toast, setIsRecording, isRecording]);

  const handleMicClick = async () => {
    if (!recognitionRef.current) {
        toast({ variant: 'destructive', title: '语音识别不可用', description: '您的浏览器不支持语音识别功能。' });
        return;
    }

    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            finalTranscriptRef.current = prompt;
            recognitionRef.current.start();
            setIsRecording(true);
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

  const SuggestionButton = ({ children }: { children: React.ReactNode }) => (
    <Button variant="outline" className="rounded-full bg-secondary hover:bg-muted">
      {children}
    </Button>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow p-6 flex flex-col justify-center items-center">
        {patternHistory.length === 0 ? (
          <div className="text-center">
            <h1 className="text-4xl font-medium text-blue-600">FLORENCIO, <span className="text-muted-foreground">你好</span></h1>
          </div>
        ) : (
          <div className="w-full">
            <h3 className="font-medium mb-3 text-muted-foreground text-sm">最近</h3>
            <div className="grid grid-cols-2 gap-4">
              {[...patternHistory].reverse().map((_, revIndex) => {
                  const index = patternHistory.length - 1 - revIndex;
                  return (
                      <button key={index} onClick={() => onGoToHistory(index)} className="aspect-square bg-secondary rounded-lg overflow-hidden transform hover:scale-105 transition-transform focus:outline-none focus:ring-2 ring-offset-2 ring-offset-background ring-primary relative border hover:border-blue-500">
                          <Image src={patternHistory[index]} alt={`历史记录 ${index + 1}`} layout="fill" className="object-cover" />
                      </button>
                  )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto p-4 bg-background">
        <div className="relative mb-3">
            <Input
              className="w-full bg-secondary text-foreground p-3 pr-12 rounded-full h-12 border-none focus-visible:ring-1"
              placeholder="说出你喜欢的创意"
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
              <Button onClick={handleMicClick} size="icon" className={`rounded-full text-white ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                <Mic size={20} />
              </Button>
            </div>
        </div>

        <div className="flex items-center space-x-2">
          <Input type="file" id="imageUpload" className="hidden" accept="image/*" onChange={handleImageUpload} />
          <Button variant="ghost" size="icon" className="rounded-full bg-secondary" asChild>
            <Label htmlFor="imageUpload" className="cursor-pointer"><Plus size={24} /></Label>
          </Button>

          <SuggestionButton>图片</SuggestionButton>
          <SuggestionButton>视频</SuggestionButton>
          <SuggestionButton>研究</SuggestionButton>

          {uploadedImage && (
            <div className="relative w-10 h-10 border rounded-md">
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
