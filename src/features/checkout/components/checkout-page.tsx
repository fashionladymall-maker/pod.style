'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/features/cart/hooks/use-cart';
import { checkoutFormSchema, type CheckoutFormValues } from '../schema/checkout-schema';
import { calculateItemSubtotal, calculateShippingTotals } from '../utils';

const formatPrice = (value: number, currency: string) =>
  new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);

interface CheckoutPageProps {
  onSubmit?: (values: CheckoutFormValues) => Promise<void> | void;
  paymentSection?: React.ReactNode;
  isProcessing?: boolean;
  error?: string | null;
}

export const CheckoutPage = ({
  onSubmit,
  paymentSection,
  isProcessing = false,
  error,
}: CheckoutPageProps) => {
  const router = useRouter();
  const { items, isEmpty, totals } = useCart();
  const { toast } = useToast();
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      postalCode: '',
      notes: '',
      method: 'standard',
      agreeToTerms: false,
    },
  });

  const method = form.watch('method');
  const currency = totals?.currency ?? 'USD';

  const shippingCosts = useMemo(
    () => ({
      standard: calculateShippingTotals(items, 'standard'),
      express: calculateShippingTotals(items, 'express'),
    }),
    [items],
  );

  const shippingTotal = method === 'express' ? shippingCosts.express : shippingCosts.standard;
  const itemSubtotal = calculateItemSubtotal(items);
  const grandTotal = itemSubtotal + shippingTotal;

  const handleSubmit = async (values: CheckoutFormValues) => {
    if (!onSubmit) {
      toast({
        title: '表单已保存',
        description: '支付功能即将启用，请稍候完成付款。',
      });
      return;
    }
    try {
      setSubmissionError(null);
      await onSubmit(values);
    } catch (err) {
      const message = err instanceof Error ? err.message : '提交失败，请稍后重试。';
      setSubmissionError(message);
    }
  };

  if (isEmpty) {
    return (
      <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-6 px-6 py-24 text-center text-neutral-400">
        <p className="text-2xl font-semibold text-white">购物车为空</p>
        <p className="text-sm">请先挑选商品后再进入结算流程。</p>
        <Button asChild className="rounded-full px-6">
          <Link href="/">返回首页</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row lg:gap-12">
      <section className="flex-1 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-white">结算</h1>
          <p className="text-sm text-neutral-400">填写配送信息并完成支付。</p>
        </header>
        <Card className="border-neutral-800 bg-neutral-900 text-neutral-100">
          <CardContent className="space-y-6 p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>收货人姓名</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入姓名" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>联系电话</FormLabel>
                        <FormControl>
                          <Input placeholder="手机号或座机" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>邮箱（可选）</FormLabel>
                        <FormControl>
                          <Input placeholder="用于接收电子发票" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>城市（可选）</FormLabel>
                        <FormControl>
                          <Input placeholder="所在城市" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>详细地址</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="省市区 + 街道 + 门牌号" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>配送方式</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid gap-3 md:grid-cols-2"
                        >
                          <label
                            htmlFor="standard"
                            className="flex cursor-pointer flex-col gap-1 rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm hover:border-neutral-600"
                          >
                            <RadioGroupItem value="standard" id="standard" className="sr-only" />
                            <span className="text-base font-medium text-white">标准配送</span>
                            <span className="text-neutral-400">{formatPrice(shippingCosts.standard, currency)} · {items.length} 件</span>
                          </label>
                          <label
                            htmlFor="express"
                            className="flex cursor-pointer flex-col gap-1 rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm hover:border-neutral-600"
                          >
                            <RadioGroupItem value="express" id="express" className="sr-only" />
                            <span className="text-base font-medium text-white">快速配送</span>
                            <span className="text-neutral-400">{formatPrice(shippingCosts.express, currency)} · 优先发货</span>
                          </label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>留言（可选）</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="如有特殊需求可备注" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="agreeToTerms"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0 text-sm text-neutral-400">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="font-normal">
                        我已阅读并同意
                        <a href="/docs/terms" className="px-1 text-primary hover:underline">
                          服务条款
                        </a>
                        与
                        <a href="/docs/privacy" className="px-1 text-primary hover:underline">
                          隐私政策
                        </a>
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {paymentSection ? (
                  <div className="space-y-3">{paymentSection}</div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-950 px-4 py-6 text-center text-neutral-500">
                    支付表单即将加载...
                  </div>
                )}
                {(error || submissionError) && (
                  <p className="text-sm text-red-400">{error ?? submissionError}</p>
                )}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 flex-1 rounded-full"
                    disabled={isProcessing}
                  >
                    {isProcessing ? '处理中...' : '确认并支付'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-12 flex-1 rounded-full"
                    onClick={() => router.push('/cart')}
                  >
                    返回购物车
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>
      <aside className="w-full max-w-sm space-y-6">
        <Card className="border-neutral-800 bg-neutral-900 text-neutral-100">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-semibold">订单摘要</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-neutral-800">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">无图片</div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1 text-sm text-neutral-300">
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-neutral-400">
                      {item.variants.size} · {item.variants.color} · {item.variants.material}
                    </p>
                    <p className="text-neutral-400">数量 x{item.quantity}</p>
                  </div>
                  <span className="text-sm text-white">
                    {formatPrice(item.price * item.quantity, item.currency)}
                  </span>
                </div>
              ))}
            </div>
            <Separator className="bg-neutral-800" />
            <div className="space-y-2 text-sm text-neutral-400">
              <div className="flex items-center justify-between text-neutral-300">
                <span>商品合计</span>
                <span>{formatPrice(itemSubtotal, currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>配送费用（{method === 'express' ? '快速' : '标准'}）</span>
                <span>{formatPrice(shippingTotal, currency)}</span>
              </div>
              <Separator className="bg-neutral-800" />
              <div className="flex items-center justify-between text-base font-semibold text-white">
                <span>应付总计</span>
                <span>{formatPrice(grandTotal, currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-800 bg-neutral-900/70 text-neutral-400">
          <CardContent className="space-y-3 p-6 text-sm">
            <p>• 支付由 Stripe 测试环境处理，支持测试卡号 4242 4242 4242 4242。</p>
            <p>• 支付成功后将自动发送订单确认邮件，并可在订单详情页查看物流状态。</p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
};

export default CheckoutPage;
