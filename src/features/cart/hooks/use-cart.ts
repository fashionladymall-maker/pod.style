import { useMemo } from 'react';
import type { AddCartItemInput } from '../types';
import { useCartContext } from '../context/cart-context';

export const useCart = () => {
  const { items, totals, state, addItem, updateQuantity, removeItem, clearCart } = useCartContext();

  const isEmpty = items.length === 0;
  const lineItemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const totalCost = useMemo(() => {
    if (!totals) {
      return 0;
    }
    return totals.itemsTotal + totals.shippingTotal;
  }, [totals]);

  return {
    items,
    totals,
    state,
    isEmpty,
    lineItemCount,
    totalCost,
    addItem: (item: AddCartItemInput) => addItem(item),
    updateQuantity,
    removeItem,
    clearCart,
  };
};

export default useCart;
