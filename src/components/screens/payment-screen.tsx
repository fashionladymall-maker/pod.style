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
}

const PaymentScreen = ({ orderDetails, paymentInfo, setPaymentInfo, onPay, onBack, isLoading }: PaymentScreenProps) => {
  const { toast } = useToast();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentInfo({ ...paymentInfo, [e.target.name]: e.target.value });
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
    onPay(e);
  };


  return (
    <div className="flex flex-col h-full p-6 animate-fade-in bg-background">
      <div className="flex items-center mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <Button onClick={onBack} variant="ghost" size="icon" className="rounded-full hover:bg-secondary transition-colors transform hover:scale-110"><ArrowLeft size={20} /></Button>
        <h2 className="text-xl font-bold mx-auto">确认支付</h2>
        <div className="w-9 h-9"></div>
      </div>
      <form onSubmit={handlePay} className="space-y-4 flex-grow flex flex-col">
        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <Label htmlFor="cardNumber" className="block text-sm font-medium text-muted-foreground mb-1">卡号</Label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input id="cardNumber" type="text" name="cardNumber" value={paymentInfo.cardNumber} onChange={handleChange} className="w-full bg-secondary p-3 rounded-lg pl-10 focus:ring-2 focus:ring-primary" placeholder="0000 0000 0000 0000" />
          </div>
        </div>
        <div className="flex space-x-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="w-1/2">
            <Label htmlFor="expiry" className="block text-sm font-medium text-muted-foreground mb-1">有效期</Label>
            <Input id="expiry" type="text" name="expiry" value={paymentInfo.expiry} onChange={handleChange} className="w-full bg-secondary p-3 rounded-lg focus:ring-2 focus:ring-primary" placeholder="MM/YY" />
          </div>
          <div className="w-1/2">
            <Label htmlFor="cvv" className="block text-sm font-medium text-muted-foreground mb-1">CVV</Label>
            <Input id="cvv" type="text" name="cvv" value={paymentInfo.cvv} onChange={handleChange} className="w-full bg-secondary p-3 rounded-lg focus:ring-2 focus:ring-primary" placeholder="123" />
          </div>
        </div>
        <div className="mt-auto animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-bold py-3 px-4 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-100 disabled:opacity-50">
            {isLoading ? <Loader2 className="animate-spin" /> : <span>确认支付 ¥{129 * (orderDetails?.quantity || 1)}</span>}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PaymentScreen;
