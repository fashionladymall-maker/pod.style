import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmationScreenProps {
  onReset: () => void;
}

const ConfirmationScreen = ({ onReset }: ConfirmationScreenProps) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in bg-background">
    <div className="animate-pop-in">
      <CheckCircle className="text-green-400" size={80} style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary)))' }}/>
    </div>
    <h2 className="text-3xl font-bold mt-6 mb-2 animate-fade-in-up text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent" style={{ animationDelay: '200ms' }}>支付成功!</h2>
    <p className="text-muted-foreground mb-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>您的创意T恤正在制作中，请耐心等待发货。</p>
    <Button onClick={onReset} className="cyber-button cyber-button-accent w-full animate-fade-in-up" style={{ animationDelay: '400ms' }}>
      再创作一件
    </Button>
  </div>
);

export default ConfirmationScreen;
