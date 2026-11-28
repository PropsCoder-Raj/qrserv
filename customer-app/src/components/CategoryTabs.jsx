import { useRef, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';

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
          <Motion.button
            key={cat._id}
            ref={isActive ? activeRef : null}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(cat._id)}
            style={{
              backgroundColor: isActive
                ? 'var(--qr-primary, var(--color-primary))'
                : 'var(--qr-surface, var(--color-surface))',
              color: isActive
                ? '#FFFFFF'
                : 'var(--qr-text-muted, var(--color-text-secondary))',
              borderColor: isActive
                ? 'var(--qr-primary, var(--color-primary))'
                : 'var(--qr-border, var(--color-border))',
              borderRadius: 'var(--qr-btn-radius, 9999px)',
            }}
            className={`flex-shrink-0 border px-4 py-2 text-sm font-medium transition-all ${
              isActive ? 'shadow-md' : ''
            }`}
          >
            {cat.name}
            {cat.itemCount > 0 && (
              <span
                className={`ml-1.5 text-xs ${
                  isActive ? 'text-white/75' : 'opacity-70'
                }`}
              >
                ({cat.itemCount})
              </span>
            )}
          </Motion.button>
        );
      })}
    </div>
  );
}
