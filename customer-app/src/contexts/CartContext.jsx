import { createContext, useContext, useState, useEffect } from 'react';
import { getMenuItemSalePrice } from '../utils/menuItemPricing';
import { roundTo3 } from '../utils/formatCurrency';
import { computeTaxBreakdown } from '../utils/tax';

const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);

// Builds a stable key that identifies a unique cart line — same menu item
// with different spice level/add-ons/instructions is tracked separately.
export function buildCartItemId(menuItemId, spiceLevel, addOns, specialInstructions, cookingNote) {
  const addOnsKey = (addOns || [])
    .map((a) => a.name)
    .sort()
    .join(',');
  const noteKey = (specialInstructions || cookingNote || '').trim();
  return [menuItemId, spiceLevel?.name || '', addOnsKey, noteKey].join('::');
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cart');
      const parsed = saved ? JSON.parse(saved) : [];
      // Backfill cartItemId for carts saved before customization support
      return parsed.map((i) => ({
        ...i,
        cartItemId:
          i.cartItemId ||
          buildCartItemId(i.menuItemId, i.spiceLevel, i.addOns, i.specialInstructions),
      }));
    } catch {
      return [];
    }
  });
  const [restaurantId, setRestaurantId] = useState(() => localStorage.getItem('cartRestaurantId') || '');
  const [tableId, setTableId] = useState(() => localStorage.getItem('cartTableId') || '');
  const [orderType, setOrderType] = useState(() => localStorage.getItem('cartOrderType') || 'takeaway');
  const [paymentMethod, setPaymentMethod] = useState(() => {
    const savedMethod = localStorage.getItem('cartPaymentMethod');
    return savedMethod?.toUpperCase() === 'CARD' ? 'CARD' : 'CASH';
  });
  const [isPaymentGatewayAllocated, setIsPaymentGatewayAllocated] = useState(false);
  const [taxEnabled, setTaxEnabled] = useState(() => localStorage.getItem('cartTaxEnabled') === 'true');
  const [taxRate, setTaxRate] = useState(() => Number(localStorage.getItem('cartTaxRate')) || 0);
  const [taxType, setTaxType] = useState(() => localStorage.getItem('cartTaxType') || 'inclusive');
  const [vatEnabled, setVatEnabled] = useState(() => localStorage.getItem('cartVatEnabled') === 'true');
  const [vatRate, setVatRate] = useState(() => Number(localStorage.getItem('cartVatRate')) || 0);
  const [vatType, setVatType] = useState(() => localStorage.getItem('cartVatType') || 'inclusive');
  const [gstNo, setGstNo] = useState(() => localStorage.getItem('cartGstNo') || '');
  const [vatNo, setVatNo] = useState(() => localStorage.getItem('cartVatNo') || '');

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (restaurantId) localStorage.setItem('cartRestaurantId', restaurantId);
    if (tableId) {
      localStorage.setItem('cartTableId', tableId);
    } else {
      localStorage.removeItem('cartTableId');
    }
    localStorage.setItem('cartOrderType', orderType);
    localStorage.setItem('cartPaymentMethod', paymentMethod);
    localStorage.setItem('cartTaxEnabled', String(taxEnabled));
    localStorage.setItem('cartTaxRate', String(taxRate));
    localStorage.setItem('cartTaxType', taxType);
    localStorage.setItem('cartVatEnabled', String(vatEnabled));
    localStorage.setItem('cartVatRate', String(vatRate));
    localStorage.setItem('cartVatType', vatType);
    if (gstNo) localStorage.setItem('cartGstNo', gstNo);
    if (vatNo) localStorage.setItem('cartVatNo', vatNo);
  }, [restaurantId, tableId, orderType, paymentMethod, taxEnabled, taxRate, taxType, vatEnabled, vatRate, vatType, gstNo, vatNo]);

  const addItem = (item, quantity = 1) => {
    const note = (item.cookingNote || item.specialInstructions || '').trim();
    const cartItemId = buildCartItemId(
      item.menuItemId,
      item.spiceLevel,
      item.addOns,
      note,
    );
    const normalizedItem = {
      ...item,
      cookingNote: note || undefined,
      specialInstructions: note || undefined,
    };
    setItems((prev) => {
      const existing = prev.find((i) => i.cartItemId === cartItemId);
      if (existing) {
        return prev.map((i) =>
          i.cartItemId === cartItemId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...normalizedItem, cartItemId, quantity }];
    });
  };

  const updateItemNote = (cartItemId, note) => {
    const trimmed = (note || '').trim();
    setItems((prev) =>
      prev.map((i) =>
        i.cartItemId === cartItemId
          ? {
              ...i,
              cookingNote: trimmed,
              specialInstructions: trimmed,
            }
          : i
      )
    );
  };

  const removeItem = (cartItemId) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId, quantity) => {
    if (quantity <= 0) {
      removeItem(cartItemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.cartItemId === cartItemId ? { ...i, quantity } : i
      )
    );
  };

  const syncMenuPrices = (menuItems) => {
    const menuItemsById = new Map(menuItems.map((item) => [String(item._id), item]));
    setItems((current) => current.map((cartItem) => {
      const menuItem = menuItemsById.get(String(cartItem.menuItemId));
      if (!menuItem) return cartItem;
      const optionsPrice = (cartItem.addOns || []).reduce(
        (sum, addOn) => sum + (Number(addOn.priceDelta) || 0),
        0,
      ) + (Number(cartItem.spiceLevel?.priceDelta) || 0);
      return {
        ...cartItem,
        name: menuItem.name,
        itemType: menuItem.itemType || 'food',
        gstRate: Number(menuItem.gstRate) || 0,
        vatRate: Number(menuItem.vatRate) || 0,
        price: roundTo3(getMenuItemSalePrice(menuItem) + optionsPrice),
        originalPrice: roundTo3(Number(menuItem.price) + optionsPrice),
        discountType: menuItem.discountType || '',
        discountValue: Number(menuItem.discountValue) || 0,
      };
    }));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const getQuantityForMenuItem = (menuItemId) =>
    items
      .filter((i) => i.menuItemId === menuItemId)
      .reduce((sum, i) => sum + i.quantity, 0);

  const breakdown = computeTaxBreakdown(
    { taxEnabled, taxRate, taxType, vatEnabled, vatRate, vatType },
    items,
  );
  const itemTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const { cgstRate, sgstRate, cgstAmount, sgstAmount, vatAmount, taxAmount, subtotalAmount } = breakdown;
  const totalAmount = itemTotal;
  const grandTotal = breakdown.totalAmount;

  const setTableInfo = (rId, tId, nextOrderType) => {
    setRestaurantId(rId);
    setTableId(tId);
    if (tId) {
      setOrderType('dine_in');
      return;
    }
    setOrderType(nextOrderType || 'takeaway');
  };

  const setCartOrderType = (nextOrderType) => {
    setOrderType(nextOrderType === 'dine_in' ? 'dine_in' : 'takeaway');
  };

  const setTaxInfo = (enabled, rate, type, vEnabled, vRate, vType, gNo, vNo) => {
    setTaxEnabled(Boolean(enabled));
    setTaxRate(Number(rate) || 0);
    setTaxType(type || 'inclusive');
    setVatEnabled(Boolean(vEnabled));
    setVatRate(Number(vRate) || 0);
    setVatType(vType || 'inclusive');
    if (gNo !== undefined) setGstNo(gNo || '');
    if (vNo !== undefined) setVatNo(vNo || '');
  };

  const setPaymentGatewayInfo = (enabled) => {
    setIsPaymentGatewayAllocated(Boolean(enabled));
  };

  const setCartPaymentMethod = (nextPaymentMethod) => {
    const normalizedMethod = nextPaymentMethod?.toUpperCase();

    if (['CARD', 'ONLINE'].includes(normalizedMethod)) {
      setPaymentMethod(normalizedMethod);
    } else {
      setPaymentMethod('CASH'); // Fallback default
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantId,
        tableId,
        orderType,
        paymentMethod,
        isPaymentGatewayAllocated,
        addItem,
        removeItem,
        updateQuantity,
        updateItemNote,
        syncMenuPrices,
        getQuantityForMenuItem,
        clearCart,
        totalAmount,
        totalItems,
        setTableInfo,
        setCartOrderType,
        setCartPaymentMethod,
        setPaymentGatewayInfo,
        taxEnabled,
        taxRate,
        taxType,
        subtotalAmount,
        cgstRate,
        sgstRate,
        cgstAmount,
        sgstAmount,
        taxAmount,
        grandTotal,
        setTaxInfo,
        vatEnabled,
        vatRate,
        vatType,
        vatAmount,
        gstNo,
        vatNo,
        gstAmount: breakdown.gstAmount,
        gstBase: breakdown.gstBase,
        vatBase: breakdown.vatBase,
        gstBreakdown: breakdown.gstBreakdown,
        vatBreakdown: breakdown.vatBreakdown,
        taxLines: breakdown.lines,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
