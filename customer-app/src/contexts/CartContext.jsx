import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [restaurantId, setRestaurantId] = useState(() => localStorage.getItem('cartRestaurantId') || '');
  const [tableId, setTableId] = useState(() => localStorage.getItem('cartTableId') || '');
  const [orderType, setOrderType] = useState(() => localStorage.getItem('cartOrderType') || 'takeaway');
  const [paymentMethod, setPaymentMethod] = useState(() => localStorage.getItem('cartPaymentMethod') || 'cash');
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

  const addItem = (item) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.menuItemId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (menuItemId) => {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  };

  const updateQuantity = (menuItemId, quantity) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.menuItemId === menuItemId ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

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
    const gatewayEnabled = Boolean(enabled);
    setIsPaymentGatewayAllocated(gatewayEnabled);
    setPaymentMethod((prev) => {
      if (!gatewayEnabled) return 'cash';
      return prev === 'online' || prev === 'cash' ? prev : 'online';
    });
  };

  const setCartPaymentMethod = (nextPaymentMethod) => {
    if (!isPaymentGatewayAllocated) {
      setPaymentMethod('cash');
      return;
    }
    setPaymentMethod(nextPaymentMethod === 'online' ? 'online' : 'cash');
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
