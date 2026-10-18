import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiPlus, HiMinus, HiOutlineClock, HiOutlineAdjustments } from 'react-icons/hi';
import { useCart } from '../contexts/CartContext';
import ItemCustomizationModal from './ItemCustomizationModal';
import { getMenuItemSalePrice, getMenuItemDiscountLabel } from '../utils/menuItemPricing';
import { formatCurrency } from '../utils/formatCurrency';

export default function MenuItemCard({ item }) {
  const {
    items,
    addItem,
    updateQuantity,
    getQuantityForMenuItem,
    taxEnabled,
    taxType,
    vatEnabled,
    vatType,
  } = useCart();
  const [customizing, setCustomizing] = useState(false);

  const customization = item.customization || {};
  const hasCustomization =
    (customization.spiceLevels?.length || 0) > 0 || (customization.addOns?.length || 0) > 0;

  const cartItem = items.find((i) => i.menuItemId === item._id && !i.spiceLevel && !i.addOns?.length && !i.specialInstructions);
  const qty = hasCustomization ? getQuantityForMenuItem(item._id) : cartItem?.quantity || 0;
  const salePrice = getMenuItemSalePrice(item);
  const hasPriceDrop = salePrice < Number(item.price);

  const handleAdd = () => {
    if (hasCustomization) {
      setCustomizing(true);
      return;
    }
    addItem({
      menuItemId: item._id,
      name: item.name,
      price: salePrice,
      originalPrice: Number(item.price),
      discountType: item.discountType || '',
      discountValue: Number(item.discountValue) || 0,
      itemType: item.itemType || 'food',
    });
  };

  const handleConfirmCustomization = (selection, quantity) => {
    addItem(selection, quantity);
    setCustomizing(false);
  };

  const isLiquor = (item.itemType || 'food') === 'liquor';
  const imageSrc = item.image ? 
    `${import.meta.env.VITE_API_URL || ''}${item.image}`
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex gap-3 rounded-2xl border border-border bg-surface p-3 shadow-sm"
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={item.name}
          className="h-24 w-24 flex-shrink-0 rounded-xl object-cover"
        />
      ) : null}

      <div className="min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start gap-1.5">
            <span
              className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm border ${
                item.isVeg ? 'border-green-600' : 'border-red-600'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  item.isVeg ? 'bg-green-600' : 'bg-red-600'
                }`}
              />
            </span>
            <h3 className="truncate text-sm font-semibold leading-tight text-text">
              {item.name}
            </h3>
          </div>
          {item.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-text-light">
              {item.description}
            </p>
          )}
          {item.ingredients && (
            <p className="mt-1 line-clamp-2 text-xs text-text-light">
              <span className="font-medium text-text-secondary">Ingredients: </span>
              {item.ingredients}
            </p>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex flex-wrap items-baseline gap-x-1.5 text-sm font-bold text-text">
              <span className={hasPriceDrop ? 'text-green-700' : ''}>{formatCurrency(salePrice)}</span>
              {hasPriceDrop && <del className="text-xs font-normal text-text-light">{formatCurrency(item.price)}</del>}
              {hasPriceDrop && <span className="rounded bg-green-100 px-1 py-0.5 text-[10px] font-semibold text-green-700">{getMenuItemDiscountLabel(item)}</span>}
              {isLiquor && vatEnabled && vatType === 'inclusive' && (
                <span className="ml-1 text-[10px] font-normal text-text-light">
                  (incl. VAT)
                </span>
              )}
              {!isLiquor && taxEnabled && taxType === 'inclusive' && (
                <span className="ml-1 text-[10px] font-normal text-text-light">
                  (incl. tax)
                </span>
              )}
            </span>
            {item.preparationTime > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-text-light">
                <HiOutlineClock size={12} />
                {item.preparationTime} min
              </span>
            )}
          </div>

          {hasCustomization ? (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleAdd}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm active:bg-primary-dark"
            >
              <HiOutlineAdjustments size={14} />
              {qty > 0 ? `Customize (${qty})` : 'Customize'}
            </motion.button>
          ) : qty === 0 ? (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleAdd}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm active:bg-primary-dark"
            >
              Add
            </motion.button>
          ) : (
            <div className="flex items-center gap-1 rounded-lg bg-primary px-1 py-0.5 shadow-sm">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => updateQuantity(cartItem.cartItemId, qty - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-white hover:bg-primary-dark"
              >
                <HiMinus size={14} />
              </motion.button>
              <span className="min-w-[20px] text-center text-sm font-bold text-white">
                {qty}
              </span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={handleAdd}
                className="flex h-7 w-7 items-center justify-center rounded-md text-white hover:bg-primary-dark"
              >
                <HiPlus size={14} />
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {customizing && (
        <ItemCustomizationModal
          item={item}
          onClose={() => setCustomizing(false)}
          onConfirm={handleConfirmCustomization}
        />
      )}
    </motion.div>
  );
}
