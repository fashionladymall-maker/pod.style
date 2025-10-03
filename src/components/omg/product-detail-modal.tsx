"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Heart, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FirebaseImage } from '@/components/ui/firebase-image';
import { cn } from '@/lib/utils';
import type { Creation } from '@/lib/types';

const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  creation: Creation | null;
  modelIndex: number;
  onPurchase: (size: string) => void;
  onLike: () => void;
  onShare: () => void;
  isLiked: boolean;
}

export function ProductDetailModal({
  isOpen,
  onClose,
  creation,
  modelIndex,
  onPurchase,
  onLike,
  onShare,
  isLiked,
}: ProductDetailModalProps) {
  const [selectedSize, setSelectedSize] = useState('M');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen || !creation) return null;

  const model = creation.models?.[modelIndex];
  if (!model) return null;

  // 图片列表：商品图 + 图案图
  const images = [
    model.modelUri || model.uri,
    creation.previewPatternUri || creation.patternUri,
  ].filter(Boolean);

  const isApparel =
    model.category.includes('T-shirts') ||
    model.category.includes('Hoodies') ||
    model.category.includes('Sweatshirts') ||
    model.category.includes('T恤') ||
    model.category.includes('连帽衫') ||
    model.category.includes('运动卫衣');

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

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
                <h2 className="text-lg font-bold text-white">商品详情</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* 内容区域 */}
              <div className="flex-1 overflow-y-auto">
                {/* 图片轮播 */}
                <div className="relative aspect-square bg-black">
                  <FirebaseImage
                    src={images[currentImageIndex]}
                    alt="商品图片"
                    fill
                    className="object-contain"
                  />

                  {/* 左右切换按钮 */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* 图片指示器 */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={cn(
                            'w-2 h-2 rounded-full transition-all',
                            currentImageIndex === index
                              ? 'bg-white w-6'
                              : 'bg-white/50'
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* 商品信息 */}
                <div className="p-6 space-y-4">
                  {/* 品类和价格 */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {model.category}
                    </h3>
                    <p className="text-2xl font-bold text-pink-500">$29.99</p>
                  </div>

                  {/* 创意描述 */}
                  {creation.summary && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">创意描述</p>
                      <p className="text-white">{creation.summary}</p>
                    </div>
                  )}

                  {/* 尺码选择（仅服装类） */}
                  {isApparel && (
                    <div>
                      <p className="text-sm font-medium text-gray-300 mb-2">
                        选择尺码
                      </p>
                      <div className="flex gap-2">
                        {sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={cn(
                              'w-12 h-12 rounded-lg font-semibold transition-all',
                              selectedSize === size
                                ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white scale-110'
                                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 商品特点 */}
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">
                      商品特点
                    </p>
                    <ul className="space-y-1 text-sm text-gray-400">
                      <li>✓ 高品质材料</li>
                      <li>✓ 独特AI设计</li>
                      <li>✓ 按需定制生产</li>
                      <li>✓ 全球配送</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 底部操作栏 */}
              <div className="p-4 border-t border-white/10 bg-black/50">
                <div className="flex gap-2 mb-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onLike}
                    className={cn(
                      'border-white/10',
                      isLiked
                        ? 'bg-pink-500 text-white hover:bg-pink-600'
                        : 'bg-white/5 text-white hover:bg-white/10'
                    )}
                  >
                    <Heart
                      className={cn('w-5 h-5', isLiked && 'fill-current')}
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onShare}
                    className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={() => onPurchase(selectedSize)}
                    className="flex-1 h-12 bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white font-semibold"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    立即购买
                  </Button>
                </div>
                <p className="text-xs text-center text-gray-500">
                  💡 按需定制，预计7-14天发货
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

