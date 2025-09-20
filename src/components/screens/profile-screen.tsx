import React from 'react';
import Image from 'next/image';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FirebaseUser } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfileScreenProps {
  user: FirebaseUser | null;
  patternHistory: string[];
  modelHistory: (string | null)[];
  onBack: () => void;
  onGoToHistory: (index: number) => void;
  onSignOut: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  patternHistory,
  modelHistory,
  onBack,
  onGoToHistory,
  onSignOut,
}) => {
  const allCreations = patternHistory
    .map((pattern, index) => ({
      type: 'pattern' as const,
      url: pattern,
      index,
    }))
    .concat(
      modelHistory
        .map((model, index) =>
          model ? { type: 'model' as const, url: model, index } : null
        )
        .filter((item): item is { type: 'model'; url: string; index: number } => item !== null)
    )
    .sort((a, b) => b.index - a.index);

  return (
    <div className="flex flex-col h-full bg-background animate-fade-in">
      <Button onClick={onBack} variant="ghost" size="icon" className="rounded-full absolute top-4 left-4 z-20 bg-background/50 hover:bg-background">
          <ArrowLeft size={20} />
      </Button>
      
      <ScrollArea className="flex-grow">
        <div className="pt-6 pb-2 px-6 flex items-center justify-between border-b">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                  {user?.displayName?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{user?.displayName}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button onClick={onSignOut} variant="ghost" size="icon" className="rounded-full">
                <LogOut className="h-5 w-5 text-muted-foreground" />
            </Button>
        </div>

        <div className="p-4">
            <h3 className="text-lg font-semibold mb-4 px-2">我的创作</h3>
            {allCreations.length > 0 ? (
                <div className="columns-2 gap-4 space-y-4">
                {allCreations.map((creation, i) => (
                    <button
                        key={`${creation.type}-${creation.index}-${i}`}
                        onClick={() => onGoToHistory(creation.index)}
                        className="block w-full overflow-hidden rounded-lg transform hover:scale-105 transition-transform focus:outline-none focus:ring-2 ring-offset-2 ring-offset-background ring-primary"
                    >
                    <Image
                        src={creation.url}
                        alt={`${creation.type === 'pattern' ? '创意图案' : '模特图'} ${creation.index + 1}`}
                        width={200}
                        height={creation.type === 'model' ? 300 : 200}
                        className="w-full h-auto object-cover"
                    />
                    </button>
                ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground pt-12">
                    <p className="text-lg">暂无创作历史</p>
                    <p className="text-sm mt-2">快去创作你的第一个设计吧！</p>
                </div>
            )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ProfileScreen;
