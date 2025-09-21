"use client";

import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { FirebaseUser, ShippingInfo } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface ShippingScreenProps {
  user: FirebaseUser | null;
  shippingInfo: ShippingInfo;
  setShippingInfo: React.Dispatch<React.SetStateAction<ShippingInfo>>;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const ShippingScreen = ({ user, shippingInfo, setShippingInfo, onNext, onBack, isLoading }: ShippingScreenProps) => {
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
    if (user?.isAnonymous && !shippingInfo.email) {
      toast({
        variant: "destructive",
        title: "需要邮箱",
        description: "请输入您的联系邮箱以便追踪订单。",
      });
      return;
    }
    onNext();
  };

  return (
    <div className="flex flex-col h-full animate-fade-in bg-background">
      <div className="flex items-center mb-6 animate-fade-in-up p-6 pb-0">
        <Button onClick={onBack} variant="ghost" size="icon" className="rounded-full"><ArrowLeft size={20} /></Button>
        <h2 className="text-xl font-medium mx-auto">收货信息</h2>
        <div className="w-9 h-9"></div>
      </div>
      <ScrollArea className="flex-grow">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 p-6">
          <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <Label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">收货人姓名</Label>
            <Input id="name" type="text" name="name" value={shippingInfo.name} onChange={handleChange} className="w-full bg-secondary p-3 rounded-lg border-none" placeholder="请输入姓名" />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <Label htmlFor="phone" className="block text-sm font-medium text-muted-foreground mb-1">联系电话</Label>
            <Input id="phone" type="tel" name="phone" value={shippingInfo.phone} onChange={handleChange} className="w-full bg-secondary p-3 rounded-lg border-none" placeholder="请输入手机号" />
          </div>
          {user?.isAnonymous && (
              <div className="animate-fade-in-up" style={{ animationDelay: '350ms' }}>
                  <Label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">联系邮箱 (用于订单追踪)</Label>
                  <Input id="email" type="email" name="email" value={shippingInfo.email || ''} onChange={handleChange} className="w-full bg-secondary p-3 rounded-lg border-none" placeholder="请输入邮箱地址" />
              </div>
          )}
          <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <Label htmlFor="address" className="block text-sm font-medium text-muted-foreground mb-1">详细地址</Label>
            <Textarea id="address" name="address" value={shippingInfo.address} onChange={handleChange} rows={3} className="w-full bg-secondary p-3 rounded-lg resize-none border-none" placeholder="请输入省、市、区、街道等详细信息" />
          </div>
        </form>
      </ScrollArea>
      <div className="mt-auto p-6 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
        <Button type="button" onClick={handleNext} disabled={isLoading} className="w-full rounded-full h-12">
           {isLoading ? <Loader2 className="animate-spin" /> : <span>确认下单</span>}
        </Button>
      </div>
    </div>
  );
};

export default ShippingScreen;
