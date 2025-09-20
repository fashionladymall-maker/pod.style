"use client";

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ShippingInfo } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface ShippingScreenProps {
  shippingInfo: ShippingInfo;
  setShippingInfo: React.Dispatch<React.SetStateAction<ShippingInfo>>;
  onNext: () => void;
  onBack: () => void;
}

const ShippingScreen = ({ shippingInfo, setShippingInfo, onNext, onBack }: ShippingScreenProps) => {
  const { toast } = useToast();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };
  
  const handleNext = () => {
    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
      toast({
        variant: "destructive",
        title: "信息不完整",
        description: "请填写所有收货信息字段。",
      });
      return;
    }
    onNext();
  };

  return (
    <div className="flex flex-col h-full p-6 animate-fade-in bg-background">
      <div className="flex items-center mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <Button onClick={onBack} variant="ghost" size="icon" className="rounded-full hover:bg-secondary transition-colors transform hover:scale-110"><ArrowLeft size={20} /></Button>
        <h2 className="text-xl font-bold mx-auto">收货信息</h2>
        <div className="w-9 h-9"></div>
      </div>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4 flex-grow flex flex-col">
        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <Label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">收货人姓名</Label>
          <Input id="name" type="text" name="name" value={shippingInfo.name} onChange={handleChange} className="w-full bg-secondary p-3 rounded-lg focus:ring-2 focus:ring-primary" placeholder="请输入姓名" />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <Label htmlFor="phone" className="block text-sm font-medium text-muted-foreground mb-1">联系电话</Label>
          <Input id="phone" type="tel" name="phone" value={shippingInfo.phone} onChange={handleChange} className="w-full bg-secondary p-3 rounded-lg focus:ring-2 focus:ring-primary" placeholder="请输入手机号" />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <Label htmlFor="address" className="block text-sm font-medium text-muted-foreground mb-1">详细地址</Label>
          <Textarea id="address" name="address" value={shippingInfo.address} onChange={handleChange} rows={3} className="w-full bg-secondary p-3 rounded-lg resize-none focus:ring-2 focus:ring-primary" placeholder="请输入省、市、区、街道等详细信息" />
        </div>
        <div className="mt-auto animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <Button type="button" onClick={handleNext} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-bold py-3 px-4 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-100">
            <span>下一步：支付</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ShippingScreen;
