
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, LogOut, User, Trash2, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FirebaseUser, Creation, Order } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getCreationsAction, getOrdersAction } from '@/app/actions'; 
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
  creations: initialCreations,
  onBack,
  onGoToHistory,
  onSignOut,
  onDeleteCreation,
}) => {
  const [creations, setCreations] = useState(initialCreations);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingCreations, setIsLoadingCreations] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    const fetchCreations = async () => {
      if (user) {
        setIsLoadingCreations(true);
        try {
          const userCreations = await getCreationsAction(user.uid);
          setCreations(userCreations);
        } catch (error) {
          console.error("Failed to fetch creations:", error);
        } finally {
          setIsLoadingCreations(false);
        }
      }
    };
    const fetchOrders = async () => {
        if(user) {
            setIsLoadingOrders(true);
            try {
                const userOrders = await getOrdersAction(user.uid);
                setOrders(userOrders);
            } catch (error) {
                console.error("Failed to fetch orders:", error);
            } finally {
                setIsLoadingOrders(false);
            }
        }
    }

    if (!initialCreations.length && user) {
      fetchCreations();
    }
    if (user) {
        fetchOrders();
    }
  }, [user, initialCreations.length]);


  const handleDeleteAll = () => {
    creations.forEach(c => onDeleteCreation(c.id));
    setCreations([]);
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  return (
    <div className="flex flex-col h-full bg-background animate-fade-in">
      
      <ScrollArea className="flex-grow">
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

        {/* Orders Section */}
        <div className="p-4">
            <div className="flex items-center gap-2 mb-4 px-2">
                <ShoppingBag className="text-muted-foreground" />
                <h3 className="text-lg font-semibold">我的订单</h3>
            </div>
             {isLoadingOrders ? (
                <div className="text-center p-8 text-muted-foreground"><Loader2 className="animate-spin inline-block mr-2" />正在加载订单...</div>
            ) : orders.length > 0 ? (
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
                 <div className="text-center p-8 text-muted-foreground">暂无订单记录</div>
            )}
        </div>
        
        <Separator className="my-6" />

        {/* Creations Section */}
        <div className="p-4">
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="text-lg font-semibold">我的创作 ({creations.length})</h3>
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
                    <AlertDialogAction onClick={handleDeleteAll}>全部删除</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            {isLoadingCreations ? (
                <div className="text-center p-12 text-muted-foreground"><Loader2 className="animate-spin inline-block mr-2" />正在加载作品...</div>
            ) : creations.length > 0 ? (
                <div className="space-y-6">
                {creations.map((creation, index) => (
                    <div key={creation.id} className="relative group/creation break-inside-avoid border-b pb-6">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm text-muted-foreground line-clamp-2 pr-10">"{creation.prompt || '无标题'}"</p>
                      </div>

                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-8 w-8 rounded-full opacity-0 group-hover/creation:opacity-100 transition-opacity z-10 bg-black/20 hover:bg-black/40 text-white">
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

                      <div className="grid grid-cols-3 gap-2">
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
                         {creation.models.map((model, modelIndex) => (
                           <button
                              key={model.uri}
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
                         ))}
                      </div>
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
