
import React from 'react';
import Image from 'next/image';
import { ArrowLeft, LogOut, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FirebaseUser, Creation } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ProfileScreenProps {
  user: FirebaseUser | null;
  creations: Creation[];
  onBack: () => void;
  onGoToHistory: (creationIndex: number, modelIndex?: number) => void;
  onSignOut: () => void;
  onDeleteCreation: (creationId: string) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  creations,
  onBack,
  onGoToHistory,
  onSignOut,
  onDeleteCreation,
}) => {

  const allItems = creations.flatMap((creation, creationIndex) => {
    const items = [{ 
      type: 'pattern' as const, 
      url: creation.patternUri, 
      creationIndex, 
      modelIndex: -1,
      id: `${creation.id}-pattern`
    }];
    if (creation.models && creation.models.length > 0) {
      creation.models.forEach((model, modelIndex) => {
        items.push({ 
          type: 'model' as const, 
          url: model.uri, 
          creationIndex,
          modelIndex,
          id: `${creation.id}-model-${modelIndex}`
        });
      });
    }
    return items;
  });


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
                  {user?.isAnonymous ? <User/> : (user?.displayName?.[0] || user?.email?.[0])?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{user?.isAnonymous ? "匿名用户" : user?.displayName}</h3>
                <p className="text-sm text-muted-foreground">{user?.isAnonymous ? '您当前为匿名访问状态' : user?.email}</p>
              </div>
            </div>
            <Button onClick={onSignOut} variant="ghost" size="icon" className="rounded-full">
                <LogOut className="h-5 w-5 text-muted-foreground" />
            </Button>
        </div>

        <div className="p-4">
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="text-lg font-semibold">我的创作</h3>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                   <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 size={16} className="mr-2"/>
                      全部删除
                   </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确定要删除全部创作吗?</AlertDialogTitle>
                    <AlertDialogDescription>
                      此操作无法撤销。这将从我们的服务器上永久删除您的所有作品。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={() => creations.forEach(c => onDeleteCreation(c.id))}>全部删除</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            {creations.length > 0 ? (
                <div className="columns-2 gap-4 space-y-4">
                {creations.map((creation, index) => (
                    <div key={creation.id} className="relative group/creation break-inside-avoid">
                      <button
                          onClick={() => onGoToHistory(index)}
                          className="block w-full overflow-hidden rounded-lg transform hover:scale-105 transition-transform focus:outline-none focus:ring-2 ring-offset-2 ring-offset-background ring-primary"
                      >
                      <Image
                          src={creation.models[0]?.uri || creation.patternUri}
                          alt={`创意 ${creation.id}`}
                          width={200}
                          height={200}
                          className="w-full h-auto object-cover"
                      />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover/creation:opacity-100 transition-opacity">
                              <Trash2 size={14} />
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确定要删除吗?</AlertDialogTitle>
                            <AlertDialogDescription>
                              此操作无法撤销。这将从我们的服务器上永久删除您的作品。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteCreation(creation.id)}>删除</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
