import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  text: string;
}

const LoadingScreen = ({ text }: LoadingScreenProps) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in">
    <Loader2 className="animate-spin text-primary" size={64} />
    <p className="mt-4 text-lg text-muted-foreground animate-fade-in-up" style={{ animationDelay: '200ms' }}>{text}</p>
  </div>
);

export default LoadingScreen;
