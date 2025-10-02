'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type FirestoreError,
} from 'firebase/firestore';
import { AuthContext } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { cartItemDocSchema, computeSubtotal, toCartItem } from '../model';
import type { AddCartItemInput, CartItem, CartState, SubtotalBreakdown } from '../types';

interface CartContextValue {
  state: CartState;
  items: CartItem[];
  totals: SubtotalBreakdown | null;
  addItem: (item: AddCartItemInput) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const initialState: CartState = {
  items: [],
  loading: true,
};

const deriveTotals = (items: CartItem[]): SubtotalBreakdown | null => {
  if (items.length === 0) {
    return null;
  }

  const currency = items[0]?.currency ?? 'USD';
  const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingTotal = items.reduce((sum, item) => sum + (item.shippingPrice ?? 0), 0);

  return {
    itemsTotal,
    shippingTotal,
    currency,
  };
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const { user, authLoading } = useContext(AuthContext);
  const { toast } = useToast();
  const [state, setState] = useState<CartState>(initialState);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || !db) {
      setState({ items: [], loading: false });
      return;
    }

    const cartRef = collection(db, 'carts', user.uid, 'items');
    const cartQuery = query(cartRef, orderBy('addedAt', 'desc'));

    const unsubscribe = onSnapshot(
      cartQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnapshot) => {
          const parsed = cartItemDocSchema.safeParse(docSnapshot.data());
          if (!parsed.success) {
            console.warn('Invalid cart item detected', parsed.error.flatten());
            return null;
          }
          return toCartItem(docSnapshot.id, parsed.data);
        });

        setState({
          items: items.filter((item): item is CartItem => item !== null),
          loading: false,
        });
      },
      (error: FirestoreError) => {
        console.error('Failed to listen for cart updates', error);
        setState({ items: [], loading: false, error: error.message });
      },
    );

    return () => unsubscribe();
  }, [authLoading, user]);

  const cartPath = useCallback(() => {
    if (!db) {
      throw new Error('Firestore is not configured.');
    }
    if (!user) {
      throw new Error('User is not authenticated.');
    }
    return collection(db, 'carts', user.uid, 'items');
  }, [user]);

  const addItem = useCallback(
    async (item: AddCartItemInput) => {
      try {
        const collectionRef = cartPath();
        const docId = item.id ?? crypto.randomUUID();
        const docRef = doc(collectionRef, docId);
        await setDoc(docRef, {
          sku: item.sku,
          name: item.name,
          image: item.image ?? undefined,
          designId: item.designId ?? undefined,
          variants: item.variants,
          quantity: item.quantity,
          price: item.price,
          currency: item.currency,
          shippingPrice: item.shippingPrice ?? undefined,
          shippingMethod: item.shippingMethod ?? undefined,
          subtotal: item.price * item.quantity + (item.shippingPrice ?? 0),
          metadata: item.metadata ?? undefined,
          addedAt: serverTimestamp(),
        });
        toast({
          title: '已加入购物车',
          description: `${item.name} x${item.quantity}`,
        });
      } catch (error) {
        console.error('Failed to add item to cart', error);
        toast({
          variant: 'destructive',
          title: '无法加入购物车',
          description: '请稍后再试。',
        });
        throw error;
      }
    },
    [cartPath, toast],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      try {
        const collectionRef = cartPath();
        const docRef = doc(collectionRef, itemId);
        await deleteDoc(docRef);
      } catch (error) {
        console.error('Failed to remove cart item', error);
        toast({
          variant: 'destructive',
          title: '删除失败',
          description: '请稍后再试。',
        });
        throw error;
      }
    },
    [cartPath, toast],
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeItem(itemId);
        return;
      }

      const current = state.items.find((item) => item.id === itemId);
      if (!current) {
        throw new Error('Cart item not found');
      }

      try {
        const collectionRef = cartPath();
        const docRef = doc(collectionRef, itemId);
        await updateDoc(docRef, {
          quantity,
          subtotal: quantity * current.price + (current.shippingPrice ?? 0),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Failed to update cart quantity', error);
        toast({
          variant: 'destructive',
          title: '更新数量失败',
          description: '请稍后再试。',
        });
        throw error;
      }
    },
    [cartPath, state.items, toast, removeItem],
  );

  const clearCart = useCallback(async () => {
    if (state.items.length === 0) {
      return;
    }
    try {
      const collectionRef = cartPath();
      const batch = writeBatch(collectionRef.firestore);
      state.items.forEach((item) => {
        const docRef = doc(collectionRef, item.id);
        batch.delete(docRef);
      });
      await batch.commit();
    } catch (error) {
      console.error('Failed to clear cart', error);
      toast({
        variant: 'destructive',
        title: '无法清空购物车',
        description: '请稍后再试。',
      });
      throw error;
    }
  }, [cartPath, state.items, toast]);

  const enrichedItems = useMemo(
    () =>
      state.items.map((item) => ({
        ...item,
        subtotal: computeSubtotal(item),
      })),
    [state.items],
  );

  const totals = useMemo(() => deriveTotals(enrichedItems), [enrichedItems]);

  const value = useMemo<CartContextValue>(
    () => ({
      state: { ...state, items: enrichedItems },
      items: enrichedItems,
      totals,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [state, enrichedItems, totals, addItem, updateQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
};
