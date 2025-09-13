import { useState, useCallback } from 'react';
import { CartItem, BarcodeProduct } from '../types';
import { toast } from 'sonner';

export function usePOSCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: BarcodeProduct, quantity: number = 1) => {
    if (product.stock === 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(item => item.item_id === product.id);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const existingItem = prev[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;
        
        if (newQuantity > product.stock) {
          toast.warning(`Only ${product.stock} units available for ${product.name}`);
          return prev;
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
        const cartItem: CartItem = {
          id: generateCartItemId(),
          item_id: product.id,
          name: product.name,
          barcode: product.barcode,
          unit_price: product.price,
          quantity: Math.min(quantity, product.stock),
          line_total: product.price * Math.min(quantity, product.stock),
          available_stock: product.stock,
          category: product.category
        };
        
        return [...prev, cartItem];
      }
    });
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCartItems(prev => prev.map(item => {
      if (item.id === cartItemId) {
        if (quantity > item.available_stock) {
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
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartSummary
  };
}

function generateCartItemId(): string {
  return Math.random().toString(36).substr(2, 9);
}