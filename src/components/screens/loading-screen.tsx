
import { Loader2 } from 'lucide-react';
import React from 'react';

interface LoadingScreenProps {
  text?: string;
  children?: React.ReactNode;
}

const LoadingScreen = ({ text, children }: LoadingScreenProps) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in bg-background">
    <Loader2 className="animate-spin text-blue-500" size={48} />
    <div className="mt-4 text-md text-muted-foreground animate-fade-in-up" style={{ animationDelay: '200ms' }}>
      {children || <p>{text}</p>}
    </div>
  </div>
);

export default LoadingScreen;
