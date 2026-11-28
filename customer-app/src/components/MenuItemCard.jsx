import { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { HiPlus, HiMinus, HiOutlineClock, HiOutlineAdjustments } from 'react-icons/hi';
import { useCart } from '../contexts/CartContext';
import ItemCustomizationModal from './ItemCustomizationModal';
import { getMenuItemSalePrice, getMenuItemDiscountLabel } from '../utils/menuItemPricing';
import { formatCurrency } from '../utils/formatCurrency';
import { mergeClassicConfig } from '../utils/designTheme';

export default function MenuItemCard({ item, designConfig }) {
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

  const safeDesign = mergeClassicConfig(designConfig);
  const { layout, shape } = safeDesign;
  const isGrid = layout.itemViewMode === 'grid';

  const customization = item.customization || {};
  const hasCustomization =
    (customization.spiceLevels?.length || 0) > 0 || (customization.addOns?.length || 0) > 0;

  const cartItem = items.find(
    (i) =>
      i.menuItemId === item._id &&
      !i.spiceLevel &&
      !i.addOns?.length &&
      !i.specialInstructions &&
      !i.cookingNote,
  );
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
      gstRate: Number(item.gstRate) || 0,
      vatRate: Number(item.vatRate) || 0,
    });
  };

  const handleConfirmCustomization = (selection, quantity) => {
    addItem(selection, quantity);
    setCustomizing(false);
  };

  const isLiquor = (item.itemType || 'food') === 'liquor';
  const imageSrc = item.image
    ? item.image.startsWith('http')
      ? item.image
      : `${import.meta.env.VITE_API_URL || ''}${item.image}`
    : '';

  const actionButtonStyle =
    shape.buttonStyle === 'outline'
      ? {
          backgroundColor: 'transparent',
          color: 'var(--qr-primary, var(--color-primary))',
          border: '1.5px solid var(--qr-primary, var(--color-primary))',
          borderRadius: 'var(--qr-btn-radius, 8px)',
        }
      : {
          backgroundColor: 'var(--qr-primary, var(--color-primary))',
          color: '#FFFFFF',
          border: '1.5px solid var(--qr-primary, var(--color-primary))',
          borderRadius: 'var(--qr-btn-radius, 8px)',
        };

  return (
    <Motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        backgroundColor: 'var(--qr-surface, var(--color-surface))',
        borderColor: 'var(--qr-border, var(--color-border))',
        borderRadius: 'var(--qr-radius, 16px)',
      }}
      className={`border p-3 shadow-sm ${
        isGrid ? 'flex flex-col justify-between gap-2.5' : 'flex justify-between gap-3'
      }`}
    >
      {isGrid && imageSrc ? (
        <img
          src={imageSrc}
          alt={item.name}
          style={{ borderRadius: 'var(--qr-radius-sm, 10px)' }}
          className="h-28 w-full object-cover"
        />
      ) : null}

      <div className="min-w-0 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start gap-1.5">
            {layout.showDietaryBadges && (
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
            )}
            <h3
              style={{ color: 'var(--qr-text, var(--color-text))' }}
              className={`${isGrid ? 'line-clamp-2' : 'truncate'} text-sm font-semibold leading-tight`}
            >
              {item.name}
            </h3>
          </div>
          {layout.showDescriptions && item.description && (
            <p
              style={{ color: 'var(--qr-text-muted, var(--color-text-light))' }}
              className="mt-1 line-clamp-2 text-xs"
            >
              {item.description}
            </p>
          )}
          {layout.showDescriptions && item.ingredients && !isGrid && (
            <p
              style={{ color: 'var(--qr-text-muted, var(--color-text-light))' }}
              className="mt-1 line-clamp-2 text-xs"
            >
              <span className="font-medium">Ingredients: </span>
              {item.ingredients}
            </p>
          )}
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              style={{ color: 'var(--qr-text, var(--color-text))' }}
              className="flex flex-wrap items-baseline gap-x-1.5 text-sm font-bold"
            >
              <span className={hasPriceDrop ? 'text-green-700' : ''}>
                {formatCurrency(salePrice)}
              </span>
              {hasPriceDrop && (
                <del
                  style={{ color: 'var(--qr-text-muted, var(--color-text-light))' }}
                  className="text-xs font-normal"
                >
                  {formatCurrency(item.price)}
                </del>
              )}
              {hasPriceDrop && (
                <span className="rounded bg-green-100 px-1 py-0.5 text-[10px] font-semibold text-green-700">
                  {getMenuItemDiscountLabel(item)}
                </span>
              )}
              {isLiquor && vatEnabled && vatType === 'inclusive' && (
                <span
                  style={{ color: 'var(--qr-text-muted, var(--color-text-light))' }}
                  className="ml-1 text-[10px] font-normal"
                >
                  (incl. VAT)
                </span>
              )}
              {!isLiquor && taxEnabled && taxType === 'inclusive' && (
                <span
                  style={{ color: 'var(--qr-text-muted, var(--color-text-light))' }}
                  className="ml-1 text-[10px] font-normal"
                >
                  (incl. tax)
                </span>
              )}
            </span>
            {item.preparationTime > 0 && !isGrid && (
              <span
                style={{ color: 'var(--qr-text-muted, var(--color-text-light))' }}
                className="flex items-center gap-0.5 text-xs"
              >
                <HiOutlineClock size={12} />
                {item.preparationTime} min
              </span>
            )}
          </div>

          {hasCustomization ? (
            <Motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleAdd}
              style={actionButtonStyle}
              className="flex shrink-0 items-center gap-1 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide shadow-sm"
            >
              <HiOutlineAdjustments size={13} />
              {qty > 0 ? `(${qty})` : isGrid ? 'Add' : 'Customize'}
            </Motion.button>
          ) : qty === 0 ? (
            <Motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleAdd}
              style={actionButtonStyle}
              className="shrink-0 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide shadow-sm"
            >
              Add
            </Motion.button>
          ) : (
            <div
              style={{
                backgroundColor: 'var(--qr-primary, var(--color-primary))',
                borderRadius: 'var(--qr-btn-radius, 8px)',
              }}
              className="flex shrink-0 items-center gap-1 px-1 py-0.5 shadow-sm"
            >
              <Motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => updateQuantity(cartItem.cartItemId, qty - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-white hover:bg-black/15"
              >
                <HiMinus size={14} />
              </Motion.button>
              <span className="min-w-[18px] text-center text-sm font-bold text-white">
                {qty}
              </span>
              <Motion.button
                whileTap={{ scale: 0.85 }}
                onClick={handleAdd}
                className="flex h-7 w-7 items-center justify-center rounded-md text-white hover:bg-black/15"
              >
                <HiPlus size={14} />
              </Motion.button>
            </div>
          )}
        </div>
      </div>

      {!isGrid && imageSrc ? (
        <img
          src={imageSrc}
          alt={item.name}
          style={{ borderRadius: 'var(--qr-radius-sm, 12px)' }}
          className="h-24 w-24 flex-shrink-0 object-cover"
        />
      ) : null}

      {customizing && (
        <ItemCustomizationModal
          item={item}
          onClose={() => setCustomizing(false)}
          onConfirm={handleConfirmCustomization}
        />
      )}
    </Motion.div>
  );
}
