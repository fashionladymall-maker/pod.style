import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmationScreenProps {
  onReset: () => void;
}

const ConfirmationScreen = ({ onReset }: ConfirmationScreenProps) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in bg-background">
    <div className="animate-pop-in">
      <CheckCircle className="text-green-400" size={80} />
    </div>
    <h2 className="text-3xl font-bold mt-6 mb-2 animate-fade-in-up" style={{ animationDelay: '200ms' }}>支付成功!</h2>
    <p className="text-muted-foreground mb-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>您的创意T恤正在制作中，请耐心等待发货。</p>
    <Button onClick={onReset} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-bold py-3 px-4 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-100 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
      再创作一件
    </Button>
  </div>
);

export default ConfirmationScreen;
