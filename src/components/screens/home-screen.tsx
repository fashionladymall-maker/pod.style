"use client";

import React from 'react';
import Image from 'next/image';
import { Upload, Sparkles, Wand2, Palette, History, Plus, Image as ImageIcon, Mic } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { OrderDetails } from '@/lib/types';

interface HomeScreenProps {
  prompt: string;
  setPrompt: (value: string) => void;
  uploadedImage: string | null;
  setUploadedImage: (value: string | null) => void;
  onGenerate: () => void;
  orderDetails: OrderDetails;
  setOrderDetails: React.Dispatch<React.SetStateAction<OrderDetails>>;
  patternHistory: string[];
  modelHistory: (string | null)[];
  onGoToHistory: (index: number) => void;
  selectedStyle: string;
  setSelectedStyle: (style: string) => void;
}

const colors = [
    { name: '白色', value: 'bg-white', colorName: 'white' }, 
    { name: '黑色', value: 'bg-gray-800', colorName: 'black' }, 
    { name: '灰色', value: 'bg-gray-400', colorName: 'gray' },
    { name: '海军蓝', value: 'bg-blue-900', colorName: 'navy' }
];

const styles = [
    { name: '默认', value: 'none' }, { name: '写实', value: 'photorealistic' }, { name: '漫画', value: 'comic book art' },
    { name: '油画', value: 'oil painting' }, { name: '水彩', value: 'watercolor painting' }, { name: '海报', value: 'poster art' },
    { name: '梵高', value: 'in the style of Van Gogh' }, { name: '达芬奇', value: 'in the style of Leonardo da Vinci' }, { name: '涂鸦', value: 'graffiti art style' }
];

const HomeScreen: React.FC<HomeScreenProps> = ({
  prompt, setPrompt, uploadedImage, setUploadedImage, onGenerate,
  orderDetails, setOrderDetails, patternHistory, modelHistory, onGoToHistory, selectedStyle, setSelectedStyle
}) => {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => setUploadedImage(event.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow p-6 text-center flex flex-col justify-center">
        <h2 className="text-4xl text-blue-500 font-medium">你好,</h2>
        <h1 className="text-4xl text-muted-foreground font-medium">我能为你做些什么？</h1>
      </div>
      
      {patternHistory.length > 0 && (
          <div className="px-6 mb-4">
            <h3 className="font-medium mb-3 text-muted-foreground text-sm">最近</h3>
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
                <div className="flex space-x-3 pb-4">
                {[...patternHistory].reverse().map((_, revIndex) => {
                    const index = patternHistory.length - 1 - revIndex;
                    return (
                        <button key={index} onClick={() => onGoToHistory(index)} className="flex-shrink-0 w-24 h-24 bg-secondary rounded-lg overflow-hidden transform hover:scale-105 transition-transform focus:outline-none focus:ring-2 ring-offset-2 ring-offset-background ring-primary relative border hover:border-blue-500">
                            <Image src={modelHistory[index] || patternHistory[index]} alt={`历史记录 ${index + 1}`} layout="fill" className="object-cover" />
                        </button>
                    )
                })}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
      )}

      <div className="mt-auto p-4 bg-background border-t">
        <div className="relative">
            <Textarea
              className="w-full bg-secondary text-foreground p-3 pr-20 rounded-full resize-none focus:ring-2 focus:ring-primary focus:outline-none transition-all duration-300 min-h-[50px] border-none"
              placeholder="问问AI..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onGenerate();
                }
              }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Mic size={20} />
              </Button>
              <Button onClick={onGenerate} size="icon" className="rounded-full bg-blue-500 hover:bg-blue-600 text-white">
                <Sparkles size={20} />
              </Button>
            </div>
        </div>

        <div className="flex items-center space-x-2 mt-3">
          <Input type="file" id="imageUpload" className="hidden" accept="image/*" onChange={handleImageUpload} />
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Label htmlFor="imageUpload" className="cursor-pointer"><Plus size={24} /></Label>
          </Button>

          <Button variant="secondary" className="rounded-full">
            <ImageIcon size={16} className="mr-2"/>
            图片
          </Button>

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
