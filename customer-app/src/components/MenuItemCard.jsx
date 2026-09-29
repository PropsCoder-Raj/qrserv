import { motion } from 'framer-motion';
import { HiPlus, HiMinus, HiOutlineClock } from 'react-icons/hi';
import { useCart } from '../contexts/CartContext';

export default function MenuItemCard({ item }) {
  const { items, addItem, updateQuantity, taxEnabled, taxType, vatEnabled, vatType } =
    useCart();
  const cartItem = items.find((i) => i.menuItemId === item._id);
  const qty = cartItem?.quantity || 0;

  const handleAdd = () => {
    addItem({
      menuItemId: item._id,
      name: item.name,
      price: item.price,
      itemType: item.itemType || 'food',
    });
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
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text">
             {item.price}
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

          {qty === 0 ? (
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
                onClick={() => updateQuantity(item._id, qty - 1)}
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
    </motion.div>
  );
}
