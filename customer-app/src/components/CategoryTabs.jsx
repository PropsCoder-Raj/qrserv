import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function CategoryTabs({ categories, activeId, onSelect }) {
  const scrollRef = useRef(null);
  const activeRef = useRef(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const left = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left, behavior: 'smooth' });
    }
  }, [activeId]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide"
      style={{ scrollbarWidth: 'none' }}
    >
      {categories.map((cat) => {
        const isActive = activeId === cat._id;
        return (
          <motion.button
            key={cat._id}
            ref={isActive ? activeRef : null}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(cat._id)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              isActive
                ? 'bg-primary text-white shadow-md'
                : 'bg-surface text-text-secondary border border-border hover:border-primary-100'
            }`}
          >
            {cat.name}
            {cat.itemCount > 0 && (
              <span
                className={`ml-1.5 text-xs ${
                  isActive ? 'text-white/70' : 'text-text-light'
                }`}
              >
                ({cat.itemCount})
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
