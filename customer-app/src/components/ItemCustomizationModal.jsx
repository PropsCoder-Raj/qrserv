import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiPlus, HiMinus } from 'react-icons/hi';
import { SPICE_EMOJI_FALLBACK, ADD_ON_EMOJI_FALLBACK } from '../utils/customizationPresets';
import { getMenuItemSalePrice, getMenuItemDiscountLabel } from '../utils/menuItemPricing';
import { roundTo3, formatCurrency } from '../utils/formatCurrency';

export default function ItemCustomizationModal({ item, onClose, onConfirm }) {
  const customization = item.customization || {};
  const spiceLevels = customization.spiceLevels || [];
  const addOns = customization.addOns || [];
  const allowSpecialInstructions = customization.allowSpecialInstructions !== false;

  const [spiceLevel, setSpiceLevel] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [cookingNote, setCookingNote] = useState(
    item.cookingNote || item.specialInstructions || '',
  );
  const [quantity, setQuantity] = useState(1);

  const toggleAddOn = (addOn) => {
    setSelectedAddOns((prev) =>
      prev.some((a) => a.name === addOn.name)
        ? prev.filter((a) => a.name !== addOn.name)
        : [...prev, addOn],
    );
  };

  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + (Number(a.priceDelta) || 0), 0);
  const spiceDelta = Number(spiceLevel?.priceDelta) || 0;
  const saleBasePrice = getMenuItemSalePrice(item);
  const originalUnitPrice = roundTo3(Number(item.price) + addOnsTotal + spiceDelta);
  const unitPrice = roundTo3(saleBasePrice + addOnsTotal + spiceDelta);

  const handleConfirm = () => {
    const note = cookingNote.trim();
    onConfirm(
      {
        menuItemId: item._id,
        name: item.name,
        price: unitPrice,
        originalPrice: originalUnitPrice,
        discountType: item.discountType || '',
        discountValue: Number(item.discountValue) || 0,
        itemType: item.itemType || 'food',
        spiceLevel: spiceLevel || undefined,
        addOns: selectedAddOns,
        cookingNote: note || undefined,
        specialInstructions: note || undefined,
      },
      quantity,
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-surface p-4 sm:rounded-2xl"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-text">{item.name}</h3>
              <p className="text-xs text-text-light">Customize your order</p>
              {unitPrice < originalUnitPrice && (
                <p className="mt-1 text-xs text-green-700">
                  <del className="mr-1 text-text-light">{formatCurrency(originalUnitPrice)}</del>
                  {formatCurrency(unitPrice)} · {getMenuItemDiscountLabel(item)}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface-cool text-text-secondary"
            >
              <HiX size={16} />
            </button>
          </div>

          {spiceLevels.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-text">Spice Level</p>
              <div className="flex flex-wrap gap-2">
                {spiceLevels.map((level) => {
                  const active = spiceLevel?.name === level.name;
                  return (
                    <button
                      key={level.name}
                      type="button"
                      onClick={() => setSpiceLevel(active ? null : level)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        active
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-surface-cool text-text-secondary'
                      }`}
                    >
                      <span>{level.emoji || SPICE_EMOJI_FALLBACK}</span>
                      <span>{level.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {addOns.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-text">Add-ons</p>
              <div className="flex flex-wrap gap-2">
                {addOns.map((addOn) => {
                  const active = selectedAddOns.some((a) => a.name === addOn.name);
                  return (
                    <button
                      key={addOn.name}
                      type="button"
                      onClick={() => toggleAddOn(addOn)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        active
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-surface-cool text-text-secondary'
                      }`}
                    >
                      <span>{addOn.emoji || ADD_ON_EMOJI_FALLBACK}</span>
                      <span>{addOn.name}</span>
                      {addOn.priceDelta > 0 && <span>+{formatCurrency(addOn.priceDelta)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {allowSpecialInstructions && (
            <div className="mb-4">
              <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-text">
                <span>Cooking Note</span>
                <span className="text-[11px] font-normal text-text-light">Optional</span>
              </label>
              <input
                type="text"
                value={cookingNote}
                onChange={(e) => setCookingNote(e.target.value)}
                placeholder="e.g., Extra spicy, No onions, sauce on side"
                className="w-full rounded-xl border border-border bg-surface-cool px-3 py-2.5 text-sm outline-none placeholder:text-text-light focus:border-primary"
              />
            </div>
          )}

          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-text">Quantity</p>
            <div className="flex items-center gap-1 rounded-xl bg-surface-cool p-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-primary-50 hover:text-primary"
              >
                <HiMinus size={14} />
              </button>
              <span className="min-w-[24px] text-center text-sm font-bold text-text">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-primary-50 hover:text-primary"
              >
                <HiPlus size={14} />
              </button>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 active:bg-primary-dark"
          >
            Add to Cart • {formatCurrency(unitPrice * quantity)}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
