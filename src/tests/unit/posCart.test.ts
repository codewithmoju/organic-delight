import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePOSCart } from '../../lib/hooks/usePOSCart';
import { BarcodeProduct } from '../../lib/types';

const mockProduct: BarcodeProduct = {
  id: 'prod-1',
  name: 'Test Widget',
  barcode: '1234567890',
  price: 100,
  stock: 50,
};

const mockProduct2: BarcodeProduct = {
  id: 'prod-2',
  name: 'Another Item',
  barcode: '0987654321',
  price: 250,
  stock: 10,
};

describe('usePOSCart', () => {
  it('starts with empty cart', () => {
    const { result } = renderHook(() => usePOSCart());
    expect(result.current.cartItems).toHaveLength(0);
  });

  it('adds a product to cart', () => {
    const { result } = renderHook(() => usePOSCart());
    act(() => result.current.addToCart(mockProduct, 1));
    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].name).toBe('Test Widget');
    expect(result.current.cartItems[0].quantity).toBe(1);
    expect(result.current.cartItems[0].line_total).toBe(100);
  });

  it('increments quantity when same product added again', () => {
    const { result } = renderHook(() => usePOSCart());
    act(() => {
      result.current.addToCart(mockProduct, 1);
      result.current.addToCart(mockProduct, 1);
    });
    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].quantity).toBe(2);
    expect(result.current.cartItems[0].line_total).toBe(200);
  });

  it('adds multiple different products', () => {
    const { result } = renderHook(() => usePOSCart());
    act(() => {
      result.current.addToCart(mockProduct, 1);
      result.current.addToCart(mockProduct2, 2);
    });
    expect(result.current.cartItems).toHaveLength(2);
  });

  it('does not add out-of-stock product', () => {
    const { result } = renderHook(() => usePOSCart());
    const outOfStock = { ...mockProduct, stock: 0 };
    act(() => result.current.addToCart(outOfStock, 1));
    expect(result.current.cartItems).toHaveLength(0);
  });

  it('updates quantity', () => {
    const { result } = renderHook(() => usePOSCart());
    act(() => result.current.addToCart(mockProduct, 1));
    const id = result.current.cartItems[0].id;
    act(() => result.current.updateQuantity(id, 5));
    expect(result.current.cartItems[0].quantity).toBe(5);
    expect(result.current.cartItems[0].line_total).toBe(500);
  });

  it('removes item when quantity set to 0', () => {
    const { result } = renderHook(() => usePOSCart());
    act(() => result.current.addToCart(mockProduct, 1));
    const id = result.current.cartItems[0].id;
    act(() => result.current.updateQuantity(id, 0));
    expect(result.current.cartItems).toHaveLength(0);
  });

  it('removes a specific item', () => {
    const { result } = renderHook(() => usePOSCart());
    act(() => {
      result.current.addToCart(mockProduct, 1);
      result.current.addToCart(mockProduct2, 1);
    });
    const id = result.current.cartItems[0].id;
    act(() => result.current.removeFromCart(id));
    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].name).toBe('Another Item');
  });

  it('clears the cart', () => {
    const { result } = renderHook(() => usePOSCart());
    act(() => {
      result.current.addToCart(mockProduct, 3);
      result.current.addToCart(mockProduct2, 2);
    });
    act(() => result.current.clearCart());
    expect(result.current.cartItems).toHaveLength(0);
  });

  it('holds and restores a cart', () => {
    const { result } = renderHook(() => usePOSCart());
    act(() => result.current.addToCart(mockProduct, 2));
    act(() => result.current.holdCurrentCart(null, 'Table 5'));

    // Cart should be empty after hold
    expect(result.current.cartItems).toHaveLength(0);
    expect(result.current.heldCarts).toHaveLength(1);

    // Restore
    const heldId = result.current.heldCarts[0].id;
    act(() => result.current.restoreHeldCart(heldId));
    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.heldCarts).toHaveLength(0);
  });

  it('discards a held cart', () => {
    const { result } = renderHook(() => usePOSCart());
    act(() => result.current.addToCart(mockProduct, 1));
    act(() => result.current.holdCurrentCart());
    const heldId = result.current.heldCarts[0].id;
    act(() => result.current.discardHeldCart(heldId));
    expect(result.current.heldCarts).toHaveLength(0);
  });

  it('getCartSummary returns correct totals', () => {
    const { result } = renderHook(() => usePOSCart());
    act(() => {
      result.current.addToCart(mockProduct, 2);   // 200
      result.current.addToCart(mockProduct2, 1);  // 250
    });
    const summary = result.current.getCartSummary();
    expect(summary.subtotal).toBe(450);
    expect(summary.totalItems).toBe(3);
    expect(summary.itemCount).toBe(2);
  });

  it('updates unit price only for current cart line', () => {
    const { result } = renderHook(() => usePOSCart());
    act(() => {
      result.current.addToCart(mockProduct, 2); // 200
      result.current.addToCart(mockProduct2, 1); // 250
    });
    const firstId = result.current.cartItems[0].id;

    act(() => result.current.updateUnitPrice(firstId, 80));

    expect(result.current.cartItems[0].unit_price).toBe(80);
    expect(result.current.cartItems[0].line_total).toBe(160);
    expect(result.current.cartItems[1].unit_price).toBe(250);
    expect(result.current.getCartSummary().subtotal).toBe(410);
  });

  it('marks item as overridden when price differs', () => {
    const { result } = renderHook(() => usePOSCart());
    act(() => result.current.addToCart(mockProduct, 1));
    const itemId = result.current.cartItems[0].id;

    act(() => result.current.updateUnitPrice(itemId, 90));
    expect(result.current.cartItems[0].is_price_overridden).toBe(true);
  });
});
