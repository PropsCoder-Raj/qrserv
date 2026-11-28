import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HiOutlineShoppingBag } from 'react-icons/hi';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../utils/formatCurrency';

export default function CartBar({ buttonStyle }) {
  const { totalItems, grandTotal } = useCart();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <Motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2"
        >
          <Motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/cart')}
            style={{
              backgroundColor: 'var(--qr-primary, var(--color-primary))',
              borderRadius:
                buttonStyle === 'pill'
                  ? '9999px'
                  : 'var(--qr-radius, 16px)',
            }}
            className="mx-auto flex w-full max-w-lg items-center justify-between px-5 py-4 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <HiOutlineShoppingBag size={22} className="text-white" />
                <span
                  style={{
                    backgroundColor: 'var(--qr-secondary, var(--color-accent))',
                  }}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                >
                  {totalItems}
                </span>
              </div>
              <span className="text-sm font-medium text-white/85">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">
                {formatCurrency(grandTotal)}
              </span>
              <span className="text-xs font-medium text-white/80">
                View Cart →
              </span>
            </div>
          </Motion.button>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
