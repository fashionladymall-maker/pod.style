'use client';

import { useMemo } from 'react';
import { CardElement, type CardElementProps } from '@stripe/react-stripe-js';
import type { StripeCardElementChangeEvent } from '@stripe/stripe-js';

interface PaymentFormProps {
  onChange?: (event: StripeCardElementChangeEvent) => void;
  disabled?: boolean;
  error?: string | null;
}

export function PaymentForm({ onChange, disabled = false, error }: PaymentFormProps) {
  const options = useMemo<CardElementProps['options']>(
    () => ({
      hidePostalCode: true,
      style: {
        base: {
          color: '#f4f4f5',
          fontSize: '16px',
          '::placeholder': {
            color: '#71717a',
          },
        },
        invalid: {
          color: '#f87171',
        },
      },
      disableLink: true,
      disabled,
    }),
    [disabled],
  );

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3">
        <CardElement options={options} onChange={onChange} />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <p className="text-xs text-neutral-500">
        使用 Stripe 测试卡号 4242 4242 4242 4242，任意有效期与 CVC 均可完成支付测试。
      </p>
    </div>
  );
}
