import { useState, useCallback, useEffect } from 'react';
import { CartItem, BarcodeProduct } from '../types';
import { toast } from 'sonner';

export function usePOSCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Held Carts State
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>(() => {
    try {
      const saved = localStorage.getItem('pos_held_carts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load held carts', e);
      return [];
    }
  });

  // Persist held carts
  useEffect(() => {
    localStorage.setItem('pos_held_carts', JSON.stringify(heldCarts));
  }, [heldCarts]);

  const addToCart = useCallback((product: BarcodeProduct, quantity: number = 1) => {
    // Only check stock if adding positive quantity
    if (quantity > 0 && product.stock === 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(item => item.item_id === product.id);

      if (existingItemIndex >= 0) {
        // Update existing item
        const existingItem = prev[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;

        // Only check stock limit if resulting quantity is positive
        if (newQuantity > 0 && newQuantity > product.stock) {
          toast.warning(`Only ${product.stock} units available for ${product.name}`);
          return prev;
        }

        // If new quantity is 0, allow it or remove? Usually remove, but here we update. 
        // If it becomes 0, useEffect or render logic might handle it, but let's handle 0 case in updateQuantity mostly.
        // For addToCart, if I add -1 to 1, it becomes 0.
        if (newQuantity === 0) {
          return prev.filter(item => item.id !== existingItem.id);
        }

        const updatedItems = [...prev];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          line_total: existingItem.unit_price * newQuantity
        };

        return updatedItems;
      } else {
        // Add new item
        // Ensure we take min of quantity and stock ONLY if quantity is positive
        const effectiveQuantity = quantity > 0 ? Math.min(quantity, product.stock) : quantity;

        const cartItem: CartItem = {
          id: generateCartItemId(),
          item_id: product.id,
          name: product.name,
          barcode: product.barcode,
          unit_price: product.price,
          quantity: effectiveQuantity,
          line_total: product.price * effectiveQuantity,
          available_stock: product.stock,
          category: product.category
        };

        return [...prev, cartItem];
      }
    });
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCartItems(prev => prev.map(item => {
      if (item.id === cartItemId) {
        // Only check stock if quantity is positive
        if (quantity > 0 && quantity > item.available_stock) {
          toast.warning(`Only ${item.available_stock} units available`);
          return item;
        }

        return {
          ...item,
          quantity,
          line_total: item.unit_price * quantity
        };
      }
      return item;
    }));
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // ─── Hold & Retrieve Logic ───
  const holdCurrentCart = useCallback((customer?: any, note?: string) => {
    if (cartItems.length === 0) return;

    const newHeldCart: HeldCart = {
      id: Math.random().toString(36).substr(2, 9),
      items: cartItems,
      customer,
      note,
      timestamp: Date.now(),
      total: cartItems.reduce((sum, item) => sum + item.line_total, 0)
    };

    setHeldCarts(prev => [newHeldCart, ...prev]);
    setCartItems([]);
    toast.success('Cart put on hold');
  }, [cartItems]);

  const restoreHeldCart = useCallback((heldCartId: string) => {
    const cartToRestore = heldCarts.find(c => c.id === heldCartId);
    if (!cartToRestore) return;

    // Optional: Check if current cart has items and warn/merge? 
    // For now, we'll overwrite or you could implement a check in UI.
    setCartItems(cartToRestore.items);
    setHeldCarts(prev => prev.filter(c => c.id !== heldCartId));
    toast.success('Cart restored');
    return cartToRestore; // Return so UI can set customer/note
  }, [heldCarts]);

  const discardHeldCart = useCallback((heldCartId: string) => {
    setHeldCarts(prev => prev.filter(c => c.id !== heldCartId));
    toast.info('Held cart discarded');
  }, []);

  const getCartSummary = useCallback(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.line_total, 0);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      subtotal,
      totalItems,
      itemCount: cartItems.length
    };
  }, [cartItems]);

  return {
    cartItems,
    heldCarts,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    holdCurrentCart,
    restoreHeldCart,
    discardHeldCart,
    getCartSummary
  };
}

export interface HeldCart {
  id: string;
  items: CartItem[];
  customer?: any;
  note?: string;
  timestamp: number;
  total: number;
}

function generateCartItemId(): string {
  return Math.random().toString(36).substr(2, 9);
}