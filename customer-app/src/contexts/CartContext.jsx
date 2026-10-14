import { createContext, useContext, useState, useEffect } from 'react';
import { getMenuItemSalePrice } from '../utils/menuItemPricing';

const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);

// Builds a stable key that identifies a unique cart line — same menu item
// with different spice level/add-ons/instructions is tracked separately.
export function buildCartItemId(menuItemId, spiceLevel, addOns, specialInstructions) {
  const addOnsKey = (addOns || [])
    .map((a) => a.name)
    .sort()
    .join(',');
  return [menuItemId, spiceLevel?.name || '', addOnsKey, specialInstructions || ''].join('::');
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
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [taxType, setTaxType] = useState('inclusive');
  const [vatEnabled, setVatEnabled] = useState(false);
  const [vatRate, setVatRate] = useState(0);
  const [vatType, setVatType] = useState('inclusive');

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
  }, [restaurantId, tableId, orderType, paymentMethod]);

  const addItem = (item, quantity = 1) => {
    const cartItemId = buildCartItemId(
      item.menuItemId,
      item.spiceLevel,
      item.addOns,
      item.specialInstructions,
    );
    setItems((prev) => {
      const existing = prev.find((i) => i.cartItemId === cartItemId);
      if (existing) {
        return prev.map((i) =>
          i.cartItemId === cartItemId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...item, cartItemId, quantity }];
    });
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
        price: Math.round((getMenuItemSalePrice(menuItem) + optionsPrice) * 100) / 100,
        originalPrice: Math.round((Number(menuItem.price) + optionsPrice) * 100) / 100,
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

  // Separate items into food and liquor groups
  const foodItems = items.filter((i) => (i.itemType || 'food') === 'food');
  const liquorItems = items.filter((i) => (i.itemType || 'food') === 'liquor');
  const foodTotal = foodItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const liquorTotal = liquorItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemTotal = foodTotal + liquorTotal;

  let foodSubtotal = foodTotal;
  let liquorSubtotal = liquorTotal;
  let totalAmount = itemTotal;
  let subtotalAmount = itemTotal;
  let cgstRate = 0;
  let sgstRate = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let vatAmount = 0;
  let taxAmount = 0;
  let grandTotal = itemTotal;

  // Food items — GST (CGST + SGST)
  if (taxEnabled && taxRate > 0 && foodTotal > 0) {
    cgstRate = Math.round(taxRate / 2 * 100) / 100;
    sgstRate = Math.round(taxRate / 2 * 100) / 100;

    if (taxType === 'inclusive') {
      foodSubtotal = Math.round(foodTotal / (1 + taxRate / 100) * 100) / 100;
      const gstTax = Math.round((foodTotal - foodSubtotal) * 100) / 100;
      cgstAmount = Math.round(gstTax / 2 * 100) / 100;
      sgstAmount = Math.round((gstTax - cgstAmount) * 100) / 100;
    } else {
      foodSubtotal = foodTotal;
      cgstAmount = Math.round(foodSubtotal * cgstRate / 100 * 100) / 100;
      sgstAmount = Math.round(foodSubtotal * sgstRate / 100 * 100) / 100;
    }
  }

  // Liquor items — VAT (single tax)
  if (vatEnabled && vatRate > 0 && liquorTotal > 0) {
    if (vatType === 'inclusive') {
      liquorSubtotal = Math.round(liquorTotal / (1 + vatRate / 100) * 100) / 100;
      vatAmount = Math.round((liquorTotal - liquorSubtotal) * 100) / 100;
    } else {
      liquorSubtotal = liquorTotal;
      vatAmount = Math.round(liquorSubtotal * vatRate / 100 * 100) / 100;
    }
  }

  // Combined totals
  subtotalAmount = foodSubtotal + liquorSubtotal;
  taxAmount = (cgstAmount + sgstAmount) + vatAmount;
  totalAmount = itemTotal;
  grandTotal = Math.round((subtotalAmount + taxAmount) * 100) / 100;

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

  const setTaxInfo = (enabled, rate, type, vEnabled, vRate, vType) => {
    setTaxEnabled(enabled);
    setTaxRate(rate);
    setTaxType(type || 'inclusive');
    setVatEnabled(vEnabled || false);
    setVatRate(vRate || 0);
    setVatType(vType || 'inclusive');
  };

  const setPaymentGatewayInfo = (enabled) => {
    setIsPaymentGatewayAllocated(Boolean(enabled));
  };

  const setCartPaymentMethod = (nextPaymentMethod) => {
    setPaymentMethod(nextPaymentMethod === 'CARD' ? 'CARD' : 'CASH');
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
        foodSubtotal,
        liquorSubtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
