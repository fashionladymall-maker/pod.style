
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FirebaseImage } from '@/components/ui/firebase-image';
import { IMAGE_PLACEHOLDER } from '@/lib/image-placeholders';
import { LogOut, User, Trash2, Loader2, AlertCircle, Globe, Trash } from 'lucide-react';
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
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';


interface ProfileScreenProps {
  user: FirebaseUser | null;
  creations: Creation[];
  orders: Order[];
  onGoToHistory: (creation: Creation, modelIndex?: number) => void;
  onSignOut: () => void;
  onDeleteCreation: (creationId: string) => void;
  onDeleteModel: (creationId: string, modelUri: string) => void;
  onToggleModelVisibility: (creationId: string, modelUri: string, isPublic: boolean) => void;
  onLoginRequest: () => void;
  onTogglePublic: (creationId: string, currentStatus: boolean) => void;
}

const CREATIONS_PAGE_SIZE = 12;
const CREATIONS_BATCH_SIZE = 9;

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  creations: initialCreations,
  orders: initialOrders,
  onGoToHistory,
  onSignOut,
  onDeleteCreation,
  onDeleteModel,
  onToggleModelVisibility,
  onLoginRequest,
  onTogglePublic,
}) => {
  const [creations, setCreations] = useState(initialCreations);
  const [orders, setOrders] = useState(initialOrders);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [creationsVisibleCount, setCreationsVisibleCount] = useState(Math.min(CREATIONS_PAGE_SIZE, initialCreations.length));
  const creationsSentinelRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    setCreations(initialCreations);
    setCreationsVisibleCount(Math.min(CREATIONS_PAGE_SIZE, initialCreations.length));
  }, [initialCreations]);
  
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const creationKey = (creationId: string) => `creation:${creationId}`;
  const modelKey = (creationId: string, modelUri: string) => `model:${creationId}:${modelUri}`;

  const clearSelection = () => setSelectedItems(new Set());

  const isSelected = (key: string) => selectedItems.has(key);

  const handleToggleCreationSelection = (creationId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      const key = creationKey(creationId);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        Array.from(next)
          .filter(item => item.startsWith(`model:${creationId}:`))
          .forEach(item => next.delete(item));
      }
      return next;
    });
  };

  const handleToggleModelSelection = (creationId: string, modelUri: string) => {
    if (selectedItems.has(creationKey(creationId))) {
      return;
    }
    const key = modelKey(creationId, modelUri);
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectedSummary = useMemo(() => {
    const creationsToDelete = new Set<string>();
    const modelsToDelete: { creationId: string; modelUri: string }[] = [];

    selectedItems.forEach(item => {
      if (item.startsWith('creation:')) {
        creationsToDelete.add(item.split(':')[1]);
      } else if (item.startsWith('model:')) {
        const [, creationId, ...rest] = item.split(':');
        if (!creationsToDelete.has(creationId)) {
          modelsToDelete.push({ creationId, modelUri: rest.join(':') });
        }
      }
    });

    return {
      creations: Array.from(creationsToDelete),
      models: modelsToDelete,
      count: creationsToDelete.size + modelsToDelete.length,
      creationsCount: creationsToDelete.size,
      modelsCount: modelsToDelete.length,
    };
  }, [selectedItems]);

  useEffect(() => {
    if (!creationsSentinelRef.current) return;
    const sentinel = creationsSentinelRef.current;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && creationsVisibleCount < creations.length) {
          setCreationsVisibleCount(prev => Math.min(prev + CREATIONS_BATCH_SIZE, creations.length));
        }
      });
    }, {
      root: null,
      rootMargin: '200px',
      threshold: 0.1,
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [creationsVisibleCount, creations.length]);

  const handleBulkDelete = async () => {
    if (selectedSummary.count === 0) return;

    for (const creationId of selectedSummary.creations) {
      await onDeleteCreation(creationId);
    }

    for (const { creationId, modelUri } of selectedSummary.models) {
      await onDeleteModel(creationId, modelUri);
    }

    clearSelection();
    setIsEditing(false);
  };

  const handleBulkTogglePublic = async (isPublic: boolean) => {
    if (selectedSummary.count === 0) return;

    for (const creationId of selectedSummary.creations) {
      const targetCreation = creations.find(c => c.id === creationId);
      if (!targetCreation) continue;
      if (targetCreation.isPublic === isPublic) continue;
      await onTogglePublic(creationId, targetCreation.isPublic);
    }

    for (const { creationId, modelUri } of selectedSummary.models) {
      const targetCreation = creations.find(c => c.id === creationId);
      const targetModel = targetCreation?.models?.find(model => model.uri === modelUri);
      if (targetModel && targetModel.isPublic === isPublic) continue;
      await onToggleModelVisibility(creationId, modelUri, isPublic);
    }

    clearSelection();
    setIsEditing(false);
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  }

  return (
    <div className="flex flex-col h-full bg-background animate-fade-in">
      
      <div className="p-6 flex justify-between items-center flex-shrink-0">
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
        <div className="px-6 mb-4 flex-shrink-0">
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

      <Tabs defaultValue="creations" className="w-full flex-grow flex flex-col min-h-0">
        <div className="px-4 flex-shrink-0">
          <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="creations">我的创作 ({creations.length})</TabsTrigger>
              <TabsTrigger value="orders">我的订单 ({orders.length})</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-grow min-h-0">
            <TabsContent value="creations" className="flex-grow mt-4">
                <div className="px-4 pb-4">
                    {initialCreations.length === 0 && !user?.isAnonymous && <div className="text-center p-12 text-muted-foreground"><Loader2 className="animate-spin inline-block mr-2" />正在加载作品...</div>}
                    {creations.length > 0 ? (
                        <>
                        <div className="flex justify-end mb-3">
                          <Button
                            size="sm"
                            className={`rounded-full px-4 ${isEditing ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                            onClick={() => {
                              if (isEditing) {
                                clearSelection();
                              }
                              setIsEditing(prev => !prev);
                            }}
                          >
                            {isEditing ? '完成' : '管理'}
                          </Button>
                        </div>
                        <div className="space-y-6">
                        {creations.slice(0, creationsVisibleCount).map((creation) => (
                            <div key={creation.id} className="break-inside-avoid border-b pb-6">
                              <div className="flex justify-between items-start mb-2">
                                  <p className="text-sm text-muted-foreground line-clamp-2 pr-10">{`"${creation.prompt || '无标题'}"`}</p>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                  <div className="relative group">
                                    <button
                                        onClick={() => {
                                          if (isEditing) {
                                            handleToggleCreationSelection(creation.id);
                                            return;
                                          }
                                          onGoToHistory(creation, -1);
                                        }}
                                        className={`aspect-square w-full overflow-hidden rounded-lg transform transition-transform focus:outline-none focus:ring-2 ring-offset-2 ring-offset-background ring-primary bg-secondary ${isSelected(creationKey(creation.id)) ? 'ring-2 ring-primary' : ''}`}
                                    >
                                       <FirebaseImage
                                            src={creation.previewPatternUri || creation.patternUri}
                                           alt={`创意图案 ${creation.id}`}
                                           width={150}
                                           height={150}
                                            className="w-full h-full object-contain bg-black/5"
                                            placeholder="blur"
                                            blurDataURL={IMAGE_PLACEHOLDER}
                                       />
                                    </button>
                                     {!isEditing && (
                                     <div className="absolute top-1 right-1 h-8 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <TooltipProvider>
                                          <Tooltip>
                                              <TooltipTrigger asChild>
                                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white" onClick={() => onTogglePublic(creation.id, creation.isPublic)}>
                                                      <Globe size={16} className={creation.isPublic ? 'text-blue-400' : ''}/>
                                                  </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                  <p>{creation.isPublic ? '设为私密' : '设为公开'}</p>
                                              </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
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
                                      )}
                                      {isEditing && (
                                       <div className="absolute top-2 left-2 z-20 bg-black/40 rounded-full p-1">
                                         <Checkbox
                                            checked={isSelected(creationKey(creation.id))}
                                            onCheckedChange={() => handleToggleCreationSelection(creation.id)}
                                            className="h-5 w-5 border-white text-white"
                                          />
                                        </div>
                                      )}
                                      {!isEditing && creation.isPublic === false && (
                                        <span className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full">私密</span>
                                      )}
                                  </div>
                                  {creation.models.map((model, modelIndex) => (
                                    <div key={model.uri} className="relative group">
                                      <button
                                          onClick={() => {
                                            if (isEditing) {
                                              handleToggleModelSelection(creation.id, model.uri);
                                              return;
                                            }
                                            onGoToHistory(creation, modelIndex);
                                          }}
                                          className={`aspect-square w-full overflow-hidden rounded-lg transform transition-transform focus:outline-none focus:ring-2 ring-offset-2 ring-offset-background ring-primary bg-secondary ${isSelected(modelKey(creation.id, model.uri)) ? 'ring-2 ring-primary' : ''}`}
                                      >
                                        <FirebaseImage
                                             src={model.previewUri || model.uri}
                                            alt={`商品效果图 ${model.category}`}
                                            width={150}
                                            height={150}
                                             className="w-full h-full object-contain bg-black/5"
                                             placeholder="blur"
                                             blurDataURL={IMAGE_PLACEHOLDER}
                                        />
                                      </button>
                                      {isEditing && (
                                        <div className="absolute top-2 left-2 z-20 bg-black/40 rounded-full p-1">
                                         <Checkbox
                                            checked={isSelected(modelKey(creation.id, model.uri))}
                                            onCheckedChange={() => handleToggleModelSelection(creation.id, model.uri)}
                                            className="h-5 w-5 border-white text-white"
                                          />
                                        </div>
                                      )}
                                      {!isEditing && model.isPublic === false && (
                                        <span className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full">私密</span>
                                      )}
                                      {/* Add buttons for model here if needed in the future */}
                                    </div>
                                  ))}
                              </div>
                            </div>
                        ))}
                        <div ref={creationsSentinelRef} />
                        {creationsVisibleCount < creations.length && (
                          <div className="flex justify-center py-4 text-xs text-muted-foreground">继续向下滚动以加载更多作品...</div>
                        )}
                        </div>
                        </>
                    ) : (
                        (initialCreations.length > 0 || user?.isAnonymous) && <div className="flex flex-col items-center justify-center text-center text-muted-foreground pt-12">
                            <p className="text-lg">暂无创作历史</p>
                            <p className="text-sm mt-2">快去创作你的第一个设计吧！</p>
                        </div>
                    )}
                </div>
            </TabsContent>
            <TabsContent value="orders" className="flex-grow mt-4">
                <div className="px-4 pb-4">
                    {initialOrders.length === 0 && !user?.isAnonymous && <div className="text-center p-8 text-muted-foreground"><Loader2 className="animate-spin inline-block mr-2" />正在加载订单...</div>}
                    {orders.length > 0 ? (
                        <div className="space-y-4">
                            {orders.map(order => (
                                <div key={order.id} className="border rounded-lg p-3 flex gap-4 text-sm">
                                    <FirebaseImage
                                      src={order.modelUri}
                                      alt={order.category}
                                      width={80}
                                      height={80}
                                      className="rounded-md aspect-square object-contain bg-black/5"
                                      placeholder="blur"
                                      blurDataURL={IMAGE_PLACEHOLDER}
                                    />
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
            </TabsContent>
        </ScrollArea>
      </Tabs>

      {isEditing && (
        <div className="sticky bottom-0 left-0 right-0 border-t bg-background p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">已选择 {selectedSummary.count} 项</span>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Button variant="outline" size="sm" onClick={clearSelection} disabled={selectedSummary.count === 0}>取消选择</Button>
              <Button
                size="sm"
                className="bg-amber-500 text-white hover:bg-amber-600"
                onClick={() => handleBulkTogglePublic(true)}
                disabled={selectedSummary.creationsCount + selectedSummary.modelsCount === 0}
              >
                设为公开
              </Button>
              <Button
                size="sm"
                className="bg-purple-500 text-white hover:bg-purple-600"
                onClick={() => handleBulkTogglePublic(false)}
                disabled={selectedSummary.creationsCount + selectedSummary.modelsCount === 0}
              >
                设为私密
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedSummary.count === 0}
                className="flex items-center gap-1"
              >
                <Trash size={16} /> 删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
