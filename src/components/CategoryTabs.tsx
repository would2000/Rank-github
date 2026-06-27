import { motion } from 'framer-motion'
import { CATEGORIES } from '../lib/categories'
import type { CategoryKey } from '../types'

interface Props {
  active: CategoryKey
  onChange: (key: CategoryKey) => void
}

/** 分類切換列：滑動指示器用 layoutId 做共享元素轉場，切換時平滑位移。 */
export function CategoryTabs({ active, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="榜單分類"
      className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-1 backdrop-blur"
    >
      {CATEGORIES.map((cat) => {
        const selected = cat.key === active
        return (
          <button
            key={cat.key}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(cat.key)}
            className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors sm:px-5 ${
              selected ? 'text-[var(--color-bg)]' : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
            }`}
          >
            {selected && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)]"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10 whitespace-nowrap">{cat.short}</span>
          </button>
        )
      })}
    </div>
  )
}
