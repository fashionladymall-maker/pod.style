"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, CreditCard, MapPin, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface CheckoutFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (shippingInfo: ShippingInfo, paymentInfo: PaymentInfo) => Promise<void>;
  productName: string;
  productPrice: number;
  size?: string;
}

interface ShippingInfo {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

interface PaymentInfo {
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
}

type Step = 'shipping' | 'payment' | 'review' | 'success';

export function CheckoutFlow({
  isOpen,
  onClose,
  onComplete,
  productName,
  productPrice,
  size,
}: CheckoutFlowProps) {
  const [step, setStep] = useState<Step>('shipping');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'China',
    phone: '',
  });

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  const handleBack = () => {
    if (step === 'payment') setStep('shipping');
    else if (step === 'review') setStep('payment');
    else onClose();
  };

  const handleShippingNext = () => {
    // 验证收货信息
    if (!shippingInfo.fullName || !shippingInfo.address || !shippingInfo.city || !shippingInfo.phone) {
      alert('请填写完整的收货信息');
      return;
    }
    setStep('payment');
  };

  const handlePaymentNext = () => {
    // 验证支付信息
    if (!paymentInfo.cardNumber || !paymentInfo.cardName || !paymentInfo.expiryDate || !paymentInfo.cvv) {
      alert('请填写完整的支付信息');
      return;
    }
    setStep('review');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(shippingInfo, paymentInfo);
      setStep('success');
    } catch (error) {
      console.error('Order submission failed:', error);
      alert('订单提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50"
      >
        <div className="h-full flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl bg-gradient-to-b from-gray-900 to-black rounded-2xl shadow-2xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                {step !== 'success' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                )}
                <h2 className="text-lg font-bold text-white">
                  {step === 'shipping' && '收货信息'}
                  {step === 'payment' && '支付信息'}
                  {step === 'review' && '确认订单'}
                  {step === 'success' && '订单成功'}
                </h2>
              </div>
              {step !== 'success' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>

            {/* 进度指示器 */}
            {step !== 'success' && (
              <div className="flex items-center justify-center gap-2 p-4 bg-white/5">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
                  step === 'shipping' ? 'bg-pink-500 text-white' : 'bg-white/10 text-gray-400'
                )}>
                  1
                </div>
                <div className="w-12 h-0.5 bg-white/10" />
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
                  step === 'payment' || step === 'review' ? 'bg-pink-500 text-white' : 'bg-white/10 text-gray-400'
                )}>
                  2
                </div>
                <div className="w-12 h-0.5 bg-white/10" />
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
                  step === 'review' ? 'bg-pink-500 text-white' : 'bg-white/10 text-gray-400'
                )}>
                  3
                </div>
              </div>
            )}

            {/* 内容区域 */}
            <ScrollArea className="flex-1">
              <div className="p-6">
                {/* 收货信息 */}
                {step === 'shipping' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300">收货人姓名</Label>
                      <Input
                        value={shippingInfo.fullName}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, fullName: e.target.value })}
                        placeholder="请输入姓名"
                        className="mt-1 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">手机号码</Label>
                      <Input
                        value={shippingInfo.phone}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                        placeholder="请输入手机号"
                        className="mt-1 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">详细地址</Label>
                      <Input
                        value={shippingInfo.address}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                        placeholder="街道、门牌号等"
                        className="mt-1 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">城市</Label>
                        <Input
                          value={shippingInfo.city}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                          placeholder="城市"
                          className="mt-1 bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">省份</Label>
                        <Input
                          value={shippingInfo.state}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                          placeholder="省份"
                          className="mt-1 bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-300">邮政编码</Label>
                      <Input
                        value={shippingInfo.zipCode}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, zipCode: e.target.value })}
                        placeholder="邮编"
                        className="mt-1 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                )}

                {/* 支付信息 */}
                {step === 'payment' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300">持卡人姓名</Label>
                      <Input
                        value={paymentInfo.cardName}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, cardName: e.target.value })}
                        placeholder="卡上的姓名"
                        className="mt-1 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">卡号</Label>
                      <Input
                        value={paymentInfo.cardNumber}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })}
                        placeholder="1234 5678 9012 3456"
                        className="mt-1 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">有效期</Label>
                        <Input
                          value={paymentInfo.expiryDate}
                          onChange={(e) => setPaymentInfo({ ...paymentInfo, expiryDate: e.target.value })}
                          placeholder="MM/YY"
                          className="mt-1 bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">CVV</Label>
                        <Input
                          value={paymentInfo.cvv}
                          onChange={(e) => setPaymentInfo({ ...paymentInfo, cvv: e.target.value })}
                          placeholder="123"
                          type="password"
                          maxLength={3}
                          className="mt-1 bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 订单确认 */}
                {step === 'review' && (
                  <div className="space-y-6">
                    <div className="bg-white/5 rounded-lg p-4 space-y-2">
                      <h3 className="font-semibold text-white">商品信息</h3>
                      <p className="text-gray-300">{productName}</p>
                      {size && <p className="text-gray-400 text-sm">尺码: {size}</p>}
                      <p className="text-pink-500 font-bold text-lg">${productPrice.toFixed(2)}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 space-y-2">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        收货信息
                      </h3>
                      <p className="text-gray-300">{shippingInfo.fullName}</p>
                      <p className="text-gray-400 text-sm">{shippingInfo.phone}</p>
                      <p className="text-gray-400 text-sm">
                        {shippingInfo.address}, {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 space-y-2">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        支付方式
                      </h3>
                      <p className="text-gray-300">**** **** **** {paymentInfo.cardNumber.slice(-4)}</p>
                    </div>
                  </div>
                )}

                {/* 成功页面 */}
                {step === 'success' && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 flex items-center justify-center">
                      <Check className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">订单提交成功！</h3>
                    <p className="text-gray-400 mb-6">我们将尽快为你制作商品</p>
                    <Button
                      onClick={onClose}
                      className="bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600"
                    >
                      完成
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* 底部按钮 */}
            {step !== 'success' && (
              <div className="p-4 border-t border-white/10">
                {step === 'shipping' && (
                  <Button
                    onClick={handleShippingNext}
                    className="w-full h-12 bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600"
                  >
                    下一步
                  </Button>
                )}
                {step === 'payment' && (
                  <Button
                    onClick={handlePaymentNext}
                    className="w-full h-12 bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600"
                  >
                    下一步
                  </Button>
                )}
                {step === 'review' && (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full h-12 bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600"
                  >
                    {isSubmitting ? '提交中...' : '确认下单'}
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
