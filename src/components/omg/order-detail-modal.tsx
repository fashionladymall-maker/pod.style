"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, MapPin, CreditCard, Clock, CheckCircle, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FirebaseImage } from '@/components/ui/firebase-image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Order } from '@/lib/types';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'pending':
      return {
        icon: <Clock className="w-5 h-5" />,
        label: '待处理',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/20',
      };
    case 'processing':
      return {
        icon: <Package className="w-5 h-5" />,
        label: '处理中',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/20',
      };
    case 'shipped':
      return {
        icon: <Truck className="w-5 h-5" />,
        label: '已发货',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/20',
      };
    case 'completed':
      return {
        icon: <CheckCircle className="w-5 h-5" />,
        label: '已完成',
        color: 'text-green-500',
        bgColor: 'bg-green-500/20',
      };
    default:
      return {
        icon: <Package className="w-5 h-5" />,
        label: status,
        color: 'text-gray-500',
        bgColor: 'bg-gray-500/20',
      };
  }
};

export function OrderDetailModal({ isOpen, onClose, order }: OrderDetailModalProps) {
  if (!isOpen || !order) return null;

  const statusInfo = getStatusInfo(order.status);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50"
          />

          {/* 弹窗内容 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-full max-w-2xl bg-gradient-to-b from-gray-900 to-black rounded-2xl shadow-2xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* 头部 */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">订单详情</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {/* 订单状态 */}
                  <div className="text-center">
                    <div
                      className={cn(
                        'w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center',
                        statusInfo.bgColor
                      )}
                    >
                      <div className={statusInfo.color}>{statusInfo.icon}</div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {statusInfo.label}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      订单号: #{order.id.slice(0, 16)}
                    </p>
                  </div>

                  {/* 商品信息 */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      商品信息
                    </h3>
                    <div className="flex gap-4">
                      {order.modelUri && (
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-black flex-shrink-0">
                          <FirebaseImage
                            src={order.modelUri}
                            alt="商品图片"
                            width={96}
                            height={96}
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-white font-medium">{order.category || '商品'}</p>
                        {order.size && (
                          <p className="text-gray-400 text-sm mt-1">尺码: {order.size}</p>
                        )}
                        <p className="text-pink-500 font-bold mt-2">$29.99</p>
                      </div>
                    </div>
                  </div>

                  {/* 收货信息 */}
                  {order.shippingInfo && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        收货信息
                      </h3>
                      <div className="space-y-1 text-sm">
                        <p className="text-white">{order.shippingInfo.fullName || order.shippingInfo.name}</p>
                        <p className="text-gray-400">{order.shippingInfo.phone}</p>
                        <p className="text-gray-400">
                          {order.shippingInfo.address}
                          {order.shippingInfo.city && `, ${order.shippingInfo.city}`}
                          {order.shippingInfo.state && `, ${order.shippingInfo.state}`}
                          {order.shippingInfo.zipCode && ` ${order.shippingInfo.zipCode}`}
                        </p>
                        {order.shippingInfo.country && (
                          <p className="text-gray-400">{order.shippingInfo.country}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 支付信息 */}
                  {order.paymentInfo && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        支付信息
                      </h3>
                      <p className="text-gray-400 text-sm">
                        **** **** **** {order.paymentInfo.cardNumber?.slice(-4) || '****'}
                      </p>
                    </div>
                  )}

                  {/* 订单时间线 */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-white font-semibold mb-3">订单时间线</h3>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                        <div className="flex-1">
                          <p className="text-white text-sm">订单创建</p>
                          <p className="text-gray-400 text-xs">
                            {new Date(order.createdAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                      {order.status !== 'pending' && (
                        <div className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                          <div className="flex-1">
                            <p className="text-white text-sm">开始处理</p>
                            <p className="text-gray-400 text-xs">预计1-2天</p>
                          </div>
                        </div>
                      )}
                      {(order.status === 'shipped' || order.status === 'completed') && (
                        <div className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
                          <div className="flex-1">
                            <p className="text-white text-sm">已发货</p>
                            <p className="text-gray-400 text-xs">预计7-14天送达</p>
                          </div>
                        </div>
                      )}
                      {order.status === 'completed' && (
                        <div className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                          <div className="flex-1">
                            <p className="text-white text-sm">已完成</p>
                            <p className="text-gray-400 text-xs">感谢您的购买</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 提示信息 */}
                  <div className="bg-gradient-to-r from-pink-500/10 to-cyan-500/10 rounded-xl p-4 border border-pink-500/20">
                    <p className="text-sm text-gray-300">
                      💡 所有商品均为按需定制，预计7-14天发货。如有问题请联系客服。
                    </p>
                  </div>
                </div>
              </ScrollArea>

              {/* 底部按钮 */}
              <div className="p-4 border-t border-white/10">
                <Button
                  onClick={onClose}
                  className="w-full h-12 bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600"
                >
                  关闭
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

