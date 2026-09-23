import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-warm px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <span className="text-7xl">🍽️</span>
        <h1 className="mt-4 text-2xl font-bold text-text">Page Not Found</h1>
        <p className="mt-2 text-sm text-text-light">
          Looks like this page doesn't exist
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white"
        >
          Go Home
        </button>
      </motion.div>
    </div>
  );
}
