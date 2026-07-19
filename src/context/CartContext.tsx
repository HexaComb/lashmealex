'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  addCartItemAction,
  clearCartAction,
  getCartAction,
  removeCartItemAction,
  resolveCartConflictAction,
  startCartAction,
  updateCartItemAction,
  type StartCartResult,
} from '@/app/cart/actions';
import { CART_STORAGE_KEY, type PendingCartItem } from '@/lib/cart-constants';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category: string;
}

export interface CartIdentity {
  email: string;
  name: string;
  phone: string;
}

export interface CartConflict {
  existingCartId: string;
  itemCount: number;
  name: string;
  attempted: { email: string; phone: string; name: string };
}

interface CartContextValue {
  items: CartItem[];
  cartId: string | null;
  identity: CartIdentity | null;
  isOpen: boolean;
  isModalOpen: boolean;
  isLoading: boolean;
  cartError: string | null;
  conflict: CartConflict | null;
  openCart: () => void;
  closeCart: () => void;
  openStartModal: () => void;
  closeStartModal: () => void;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  startCart: (details: { email: string; phone: string; name: string }) => Promise<StartCartResult>;
  resolveConflict: (intent: 'resume' | 'replace') => Promise<{ ok: boolean; error?: string }>;
  signOutCart: () => void;
  clearError: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [identity, setIdentity] = useState<CartIdentity | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cartError, setCartError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<CartConflict | null>(null);

  const pendingItemsRef = useRef<Map<string, PendingCartItem & { snapshot: Omit<CartItem, 'quantity'> }>>(new Map());

  const hydrateFromServer = useCallback(async (id: string) => {
    const cart = await getCartAction(id);
    if (!cart || cart.status !== 'active') {
      if (typeof window !== 'undefined') window.localStorage.removeItem(CART_STORAGE_KEY);
      setCartId(null);
      setIdentity(null);
      setItems([]);
      return;
    }
    setCartId(cart.id);
    setIdentity({ email: cart.email, phone: cart.phone, name: cart.name });
    setItems(
      cart.items.map((line) => ({
        id: line.productId,
        name: line.variantName ? `${line.name} ${line.variantName}` : line.name,
        price: line.price,
        quantity: line.quantity,
        image: line.image ?? undefined,
        category: 'Lashes',
      })),
    );
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      return;
    }
    void hydrateFromServer(saved).finally(() => setIsLoading(false));
  }, [hydrateFromServer]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const openStartModal = useCallback(() => setIsModalOpen(true), []);
  const closeStartModal = useCallback(() => setIsModalOpen(false), []);
  const clearError = useCallback(() => setCartError(null), []);

  const addItem: CartContextValue['addItem'] = useCallback(
    async (product, quantity = 1) => {
      setCartError(null);

      if (!cartId) {
        pendingItemsRef.current.set(product.id, {
          productId: product.id,
          quantity: (pendingItemsRef.current.get(product.id)?.quantity ?? 0) + quantity,
          snapshot: product,
        });
        setItems((prev) => {
          const existing = prev.find((i) => i.id === product.id);
          if (existing) {
            return prev.map((i) =>
              i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i,
            );
          }
          return [...prev, { ...product, quantity }];
        });
        setIsModalOpen(true);
        return;
      }

      setItems((prev) => {
        const existing = prev.find((i) => i.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i,
          );
        }
        return [...prev, { ...product, quantity }];
      });

      const fd = new FormData();
      fd.set('cartId', cartId);
      fd.set('productId', product.id);
      fd.set('quantity', String(quantity));
      const result = await addCartItemAction(fd);

      if (!result.ok) {
        setCartError(result.error);
        await hydrateFromServer(cartId);
      } else {
        await hydrateFromServer(cartId);
      }
    },
    [cartId, hydrateFromServer],
  );

  const removeItem: CartContextValue['removeItem'] = useCallback(
    async (id) => {
      setCartError(null);
      if (!cartId) {
        pendingItemsRef.current.delete(id);
        setItems((prev) => prev.filter((i) => i.id !== id));
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
      const fd = new FormData();
      fd.set('cartId', cartId);
      fd.set('productId', id);
      const result = await removeCartItemAction(fd);
      if (!result.ok) setCartError(result.error);
      await hydrateFromServer(cartId);
    },
    [cartId, hydrateFromServer],
  );

  const updateQuantity: CartContextValue['updateQuantity'] = useCallback(
    async (id, quantity) => {
      setCartError(null);
      if (quantity <= 0) {
        return removeItem(id);
      }
      if (!cartId) {
        const pending = pendingItemsRef.current.get(id);
        if (pending) pendingItemsRef.current.set(id, { ...pending, quantity });
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
        return;
      }
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
      const fd = new FormData();
      fd.set('cartId', cartId);
      fd.set('productId', id);
      fd.set('quantity', String(quantity));
      const result = await updateCartItemAction(fd);
      if (!result.ok) setCartError(result.error);
      await hydrateFromServer(cartId);
    },
    [cartId, hydrateFromServer, removeItem],
  );

  const flushPendingToServer = useCallback(
    async (newCartId: string) => {
      const entries = Array.from(pendingItemsRef.current.values());
      for (const entry of entries) {
        const fd = new FormData();
        fd.set('cartId', newCartId);
        fd.set('productId', entry.productId);
        fd.set('quantity', String(entry.quantity));
        await addCartItemAction(fd);
      }
      pendingItemsRef.current.clear();
    },
    [],
  );

  const startCart: CartContextValue['startCart'] = useCallback(
    async ({ email, phone, name }) => {
      setCartError(null);
      const fd = new FormData();
      fd.set('email', email);
      fd.set('phone', phone);
      fd.set('name', name);
      const result = await startCartAction(fd);

      if ('ok' in result && result.ok) {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(CART_STORAGE_KEY, result.cartId);
        }
        await flushPendingToServer(result.cartId);
        await hydrateFromServer(result.cartId);
        setConflict(null);
        setIsModalOpen(false);
        setIsOpen(true);
      } else if ('conflict' in result && result.conflict === 'existing') {
        setConflict({
          existingCartId: result.existingCartId,
          itemCount: result.itemCount,
          name: result.name,
          attempted: { email, phone, name },
        });
      } else if ('error' in result) {
        setCartError(result.error);
      }

      return result;
    },
    [flushPendingToServer, hydrateFromServer],
  );

  const resolveConflict: CartContextValue['resolveConflict'] = useCallback(
    async (intent) => {
      if (!conflict) return { ok: false, error: 'No conflict to resolve.' };
      const pending = Array.from(pendingItemsRef.current.values()).map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
      }));

      const fd = new FormData();
      fd.set('existingCartId', conflict.existingCartId);
      fd.set('intent', intent);
      fd.set('pendingItems', JSON.stringify(pending));
      const result = await resolveCartConflictAction(fd);

      if (result.ok) {
        pendingItemsRef.current.clear();
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(CART_STORAGE_KEY, result.cartId);
        }
        await hydrateFromServer(result.cartId);
        setConflict(null);
        setIsModalOpen(false);
        setIsOpen(true);
        return { ok: true };
      }
      setCartError(result.error);
      return { ok: false, error: result.error };
    },
    [conflict, hydrateFromServer],
  );

  const signOutCart = useCallback(() => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(CART_STORAGE_KEY);
    setCartId(null);
    setIdentity(null);
    setItems([]);
    setConflict(null);
    setIsOpen(false);
    pendingItemsRef.current.clear();
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        cartId,
        identity,
        isOpen,
        isModalOpen,
        isLoading,
        cartError,
        conflict,
        openCart,
        closeCart,
        openStartModal,
        closeStartModal,
        addItem,
        removeItem,
        updateQuantity,
        startCart,
        resolveConflict,
        signOutCart,
        clearError,
        itemCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export async function clearServerCart(cartId: string) {
  const fd = new FormData();
  fd.set('cartId', cartId);
  await clearCartAction(fd);
}
