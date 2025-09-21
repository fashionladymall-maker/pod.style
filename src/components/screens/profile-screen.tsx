
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { LogOut, User, Trash2, ShoppingBag, Loader2, Edit, AlertCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FirebaseUser, Creation, Order } from '@/lib/types';
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
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from '@/hooks/use-toast';
import { toggleCreationPublicStatusAction } from '@/app/actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';


interface ProfileScreenProps {
  user: FirebaseUser | null;
  creations: Creation[];
  orders: Order[];
  onBack: () => void;
  onGoToHistory: (creationIndex: number, modelIndex?: number) => void;
  onSignOut: () => void;
  onDeleteCreation: (creationId: string) => void;
  onLoginRequest: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  creations: initialCreations,
  orders: initialOrders,
  onBack,
  onGoToHistory,
  onSignOut,
  onDeleteCreation,
  onLoginRequest
}) => {
  const [creations, setCreations] = useState(initialCreations);
  const [orders, setOrders] = useState(initialOrders);
  const { toast } = useToast();
  
  useEffect(() => {
    setCreations(initialCreations);
  }, [initialCreations]);
  
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);


  const handleDeleteAllCreations = () => {
    creations.forEach(c => onDeleteCreation(c.id));
    setCreations([]);
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  }

  const handleTogglePublic = async (creationId: string, currentStatus: boolean) => {
    // Optimistic UI update
    const updatedCreations = creations.map(c => 
      c.id === creationId ? { ...c, isPublic: !currentStatus } : c
    );
    setCreations(updatedCreations);

    try {
      await toggleCreationPublicStatusAction(creationId, !currentStatus);
      toast({
        title: "更新成功",
        description: `您的作品已${!currentStatus ? '公开' : '设为私密'}。`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "更新失败",
        description: "无法更新作品状态，请重试。",
      });
      // Revert UI on failure
      setCreations(creations);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background animate-fade-in">
      
      <div className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {user?.isAnonymous ? <User/> : (user?.displayName?.[0] || user?.email?.[0])?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{user?.isAnonymous ? "匿名用户" : user?.displayName || user?.email}</h3>
              <p className="text-sm text-muted-foreground">{user?.isAnonymous ? '您当前为匿名访问状态' : user?.email}</p>
            </div>
          </div>
          <Button onClick={onSignOut} variant="ghost" size="icon" className="rounded-full">
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </Button>
      </div>

       {user?.isAnonymous && (
        <div className="px-6 mb-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>提醒</AlertTitle>
            <AlertDescription>
              您的创作历史和订单仅保存在当前设备。
              <Button variant="link" className="p-0 h-auto ml-1" onClick={onLoginRequest}>注册或登录</Button>
              以永久保存。
            </AlertDescription>
          </Alert>
        </div>
      )}


      <Tabs defaultValue="creations" className="w-full px-4 flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="creations">我的创作 ({creations.length})</TabsTrigger>
            <TabsTrigger value="orders">我的订单 ({orders.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="creations" className="flex-grow mt-4">
            <TooltipProvider>
            <ScrollArea className="h-full">
                <div className="px-1 pb-4">
                    <div className="flex justify-end items-center mb-4">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" disabled={creations.length === 0}>
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
                            <AlertDialogAction onClick={handleDeleteAllCreations}>全部删除</AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    </div>
                    {initialCreations.length === 0 && !user?.isAnonymous && <div className="text-center p-12 text-muted-foreground"><Loader2 className="animate-spin inline-block mr-2" />正在加载作品...</div>}
                    {creations.length > 0 ? (
                        <div className="space-y-6">
                        {creations.map((creation, index) => (
                            <div key={creation.id} className="break-inside-avoid border-b pb-6">
                              <div className="flex justify-between items-start mb-2">
                                  <p className="text-sm text-muted-foreground line-clamp-2 pr-10">"{creation.prompt || '无标题'}"</p>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                  <div className="relative group">
                                    <button
                                        onClick={() => onGoToHistory(index, -1)}
                                        className="aspect-square w-full overflow-hidden rounded-lg transform transition-transform focus:outline-none focus:ring-2 ring-offset-2 ring-offset-background ring-primary"
                                    >
                                        <Image
                                            src={creation.patternUri}
                                            alt={`创意图案 ${creation.id}`}
                                            width={150}
                                            height={150}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                     <div className="absolute top-1 right-1 h-8 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white" onClick={() => handleTogglePublic(creation.id, creation.isPublic)}>
                                                    <Globe size={16} className={creation.isPublic ? 'text-blue-400' : ''}/>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{creation.isPublic ? '设为私密' : '设为公开'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white">
                                                <Trash2 size={16} />
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
                                  </div>
                                  {creation.models.map((model, modelIndex) => (
                                    <div key={model.uri} className="relative group">
                                      <button
                                          onClick={() => onGoToHistory(index, modelIndex)}
                                          className="aspect-square w-full overflow-hidden rounded-lg transform transition-transform focus:outline-none focus:ring-2 ring-offset-2 ring-offset-background ring-primary"
                                      >
                                          <Image
                                              src={model.uri}
                                              alt={`商品效果图 ${model.category}`}
                                              width={150}
                                              height={150}
                                              className="w-full h-full object-cover"
                                          />
                                      </button>
                                      {/* Add buttons for model here if needed in the future */}
                                    </div>
                                  ))}
                              </div>
                            </div>
                        ))}
                        </div>
                    ) : (
                        (initialCreations.length > 0 || user?.isAnonymous) && <div className="flex flex-col items-center justify-center text-center text-muted-foreground pt-12">
                            <p className="text-lg">暂无创作历史</p>
                            <p className="text-sm mt-2">快去创作你的第一个设计吧！</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
            </TooltipProvider>
        </TabsContent>
        <TabsContent value="orders" className="flex-grow mt-4">
            <ScrollArea className="h-full">
                <div className="px-1 pb-4">
                    {initialOrders.length === 0 && !user?.isAnonymous && <div className="text-center p-8 text-muted-foreground"><Loader2 className="animate-spin inline-block mr-2" />正在加载订单...</div>}
                    {orders.length > 0 ? (
                        <div className="space-y-4">
                            {orders.map(order => (
                                <div key={order.id} className="border rounded-lg p-3 flex gap-4 text-sm">
                                    <Image src={order.modelUri} alt={order.category} width={80} height={80} className="rounded-md aspect-square object-cover bg-secondary" />
                                    <div className="flex flex-col flex-grow">
                                        <span className="font-semibold">{order.category.split(" ")[0]}</span>
                                        <span className="text-muted-foreground">x{order.quantity}</span>
                                        <div className="flex items-center justify-between mt-auto">
                                            <Badge variant={order.status === 'Processing' ? 'default' : 'secondary'}>{order.status}</Badge>
                                            <span className="font-bold">¥{order.price.toFixed(2)}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground mt-1">{formatDate(order.createdAt)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        (initialOrders.length > 0 || user?.isAnonymous) && <div className="text-center p-8 text-muted-foreground">暂无订单记录</div>
                    )}
                </div>
            </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileScreen;
