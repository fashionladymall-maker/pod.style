"use client";

import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OrderDetails, PaymentInfo } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface PaymentScreenProps {
  orderDetails: OrderDetails;
  paymentInfo: PaymentInfo;
  setPaymentInfo: React.Dispatch<React.SetStateAction<PaymentInfo>>;
  onPay: (e: React.FormEvent) => void;
  onBack: () => void;
  isLoading: boolean;
  price: number;
}

const PaymentScreen = ({ orderDetails, paymentInfo, setPaymentInfo, onPay, onBack, isLoading, price }: PaymentScreenProps) => {
  const { toast } = useToast();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) {
          formattedValue = formattedValue.substring(0, 19);
      }
    } else if (name === 'expiry') {
      formattedValue = value.replace(/\D/g, '').replace(/(.{2})/, '$1/').trim();
       if (formattedValue.length > 5) {
          formattedValue = formattedValue.substring(0, 5);
      }
    } else if (name === 'cvv') {
        formattedValue = value.replace(/\D/g, '');
        if (formattedValue.length > 4) {
            formattedValue = formattedValue.substring(0, 4);
        }
    }

    setPaymentInfo({ ...paymentInfo, [name]: formattedValue });
  };
  
  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInfo.cardNumber || !paymentInfo.expiry || !paymentInfo.cvv) {
        toast({
            variant: "destructive",
            title: "支付信息不完整",
            description: "请填写所有信用卡信息字段。",
        });
        return;
    }
    if (paymentInfo.cardNumber.length < 19 || paymentInfo.expiry.length < 5 || paymentInfo.cvv.length < 3) {
      toast({
        variant: 'destructive',
        title: '支付信息无效',
        description: '请检查您的信用卡信息是否正确。',
      });
      return;
    }
    onPay(e);
  };


  return (
    <div className="flex flex-col h-full p-6 animate-fade-in bg-background">
      <div className="flex items-center mb-6 animate-fade-in-up">
        <Button onClick={onBack} variant="ghost" size="icon" className="rounded-full"><ArrowLeft size={20} /></Button>
        <h2 className="text-xl font-medium mx-auto">确认支付</h2>
        <div className="w-9 h-9"></div>
      </div>
      <form onSubmit={handlePay} className="space-y-4 flex-grow flex flex-col">
        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <Label htmlFor="cardNumber" className="block text-sm font-medium text-muted-foreground mb-1">卡号</Label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input id="cardNumber" type="text" name="cardNumber" value={paymentInfo.cardNumber} onChange={handleChange} className="w-full bg-secondary p-3 rounded-lg pl-10 border-none" placeholder="0000 0000 0000 0000" inputMode="numeric" />
          </div>
        </div>
        <div className="flex space-x-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="w-1/2">
            <Label htmlFor="expiry" className="block text-sm font-medium text-muted-foreground mb-1">有效期</Label>
            <Input id="expiry" type="text" name="expiry" value={paymentInfo.expiry} onChange={handleChange} className="w-full bg-secondary p-3 rounded-lg border-none" placeholder="MM/YY" inputMode="numeric" />
          </div>
          <div className="w-1/2">
            <Label htmlFor="cvv" className="block text-sm font-medium text-muted-foreground mb-1">CVV</Label>
            <Input id="cvv" type="text" name="cvv" value={paymentInfo.cvv} onChange={handleChange} className="w-full bg-secondary p-3 rounded-lg border-none" placeholder="123" inputMode="numeric" />
          </div>
        </div>
        <div className="mt-auto animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <Button type="submit" disabled={isLoading} className="w-full rounded-full h-12 disabled:opacity-50">
            {isLoading ? <Loader2 className="animate-spin" /> : <span>确认支付 ¥{price * (orderDetails?.quantity || 1)}</span>}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PaymentScreen;
