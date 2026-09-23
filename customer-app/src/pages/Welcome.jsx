import { motion } from 'framer-motion';
import { HiOutlineQrcode } from 'react-icons/hi';

export default function Welcome() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary to-primary-dark px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-sm"
        >
          <HiOutlineQrcode size={48} className="text-white" />
        </motion.div>

        <h1 className="text-3xl font-bold text-white">
          QR Order
        </h1>
        <p className="mt-3 text-base text-white/70 leading-relaxed max-w-xs mx-auto">
          Scan the QR code on your table to view the menu and place your order
        </p>

        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-6 py-4 backdrop-blur-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
              1
            </div>
            <p className="text-sm text-white/80">Scan QR code on your table</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-6 py-4 backdrop-blur-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
              2
            </div>
            <p className="text-sm text-white/80">Browse menu & add items</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-6 py-4 backdrop-blur-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
              3
            </div>
            <p className="text-sm text-white/80">Place order & track status</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
