"use client";

import React from 'react';
import Image from 'next/image';
import { Upload, Sparkles, Wand2, Palette, History } from 'lucide-react';
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
    { name: '灰色', value: 'bg-gray-500', colorName: 'gray' },
    { name: '紫色', value: 'bg-purple-500', colorName: 'purple' }
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
    <div className="flex flex-col h-full text-center p-6 animate-fade-in overflow-y-auto">
      <ScrollArea className="flex-grow">
        <div className="pr-4">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>AI一件T</h1>
            <p className="text-muted-foreground mb-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>输入您的奇思妙想</p>

            <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <Textarea
                className="w-full bg-secondary text-foreground p-4 rounded-xl resize-none focus:ring-2 focus:ring-primary focus:outline-none transition-all duration-300 min-h-[100px]"
                rows={4}
                placeholder="例如：一只宇航员猫在月球弹吉他"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              {uploadedImage && (
                <div className="mt-2 relative w-24 h-24 mx-auto">
                  <Image src={uploadedImage} alt="Uploaded preview" layout="fill" className="rounded-lg object-cover" />
                  <Button onClick={() => setUploadedImage(null)} variant="destructive" size="sm" className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0">X</Button>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2 flex items-center justify-center text-foreground"><Palette size={18} className="mr-2 text-primary" />选择颜色</h3>
                <div className="flex space-x-4 justify-center">
                  {colors.map((c) => (
                    <button key={c.value} onClick={() => setOrderDetails(prev => ({ ...prev, color: c.value, colorName: c.colorName }))}
                      className={cn(`w-10 h-10 rounded-full border-2 ${c.value} transition-all duration-300 hover:scale-110 active:scale-100`, orderDetails.color === c.value ? 'border-primary scale-110' : 'border-border')}
                      aria-label={`Select ${c.name} color`}
                    ></button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center justify-center text-foreground"><Wand2 size={18} className="mr-2 text-primary" />选择风格</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {styles.map((style) => (
                    <Button key={style.value} onClick={() => setSelectedStyle(style.value)}
                      variant={selectedStyle === style.value ? 'default' : 'secondary'}
                      size="sm"
                      className="rounded-full"
                    >
                      {style.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
        </div>
      </ScrollArea>
      
      <div className="mt-auto pt-6 space-y-4">
        {patternHistory.length > 0 && (
          <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <h3 className="font-semibold mb-3 flex items-center justify-center text-foreground"><History size={18} className="mr-2 text-primary" />创作历史</h3>
            <ScrollArea className="w-full whitespace-nowrap rounded-lg">
                <div className="flex space-x-3 p-2">
                {[...patternHistory].reverse().map((_, revIndex) => {
                    const index = patternHistory.length - 1 - revIndex;
                    return (
                        <button key={index} onClick={() => onGoToHistory(index)} className="flex-shrink-0 w-20 h-20 bg-secondary rounded-lg overflow-hidden transform hover:scale-105 transition-transform focus:outline-none focus:ring-2 ring-offset-2 ring-offset-background focus:ring-primary relative">
                            <Image src={modelHistory[index] || patternHistory[index]} alt={`历史记录 ${index + 1}`} layout="fill" className="object-cover" />
                        </button>
                    )
                })}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        <Input type="file" id="imageUpload" className="hidden" accept="image/*" onChange={handleImageUpload} />
        <Label htmlFor="imageUpload" className="w-full bg-secondary hover:bg-muted text-primary font-bold py-3 px-4 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-100 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <Upload className="mr-2" size={20} />
          <span>{uploadedImage ? '更换灵感图' : '上传灵感图'}</span>
        </Label>
        <Button onClick={onGenerate} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-bold py-3 px-4 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-100 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <Sparkles className="mr-2" size={20} />
          <span>开始创作</span>
        </Button>
      </div>
    </div>
  );
};

export default HomeScreen;
