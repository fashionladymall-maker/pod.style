import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  text: string;
}

const LoadingScreen = ({ text }: LoadingScreenProps) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in bg-background">
    <Loader2 className="animate-spin text-blue-500" size={48} />
    <p className="mt-4 text-md text-muted-foreground animate-fade-in-up" style={{ animationDelay: '200ms' }}>{text}</p>
  </div>
);

export default LoadingScreen;
