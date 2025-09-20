
"use client";

import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmationScreenProps {
  onReset: () => void;
}

const ConfirmationScreen = ({ onReset }: ConfirmationScreenProps) => {

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in bg-background">
      <div className="animate-pop-in">
        <CheckCircle className="text-blue-500" size={80} />
      </div>
      <h2 className="text-2xl font-medium mt-6 mb-2 animate-fade-in-up">支付成功!</h2>
      <p className="text-muted-foreground mb-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>您的创意T恤正在制作中，请耐心等待发货。</p>
      <Button onClick={onReset} className="w-full animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        再创作一件
      </Button>
    </div>
  );
};

export default ConfirmationScreen;
