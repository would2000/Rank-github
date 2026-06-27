import { motion } from 'framer-motion'
import { CATEGORIES, type CategoryDef } from '../lib/categories'
import type { CategoryKey } from '../types'

interface Props {
  active: CategoryKey
  onChange: (key: CategoryKey) => void
  /** 可傳入不同的分類清單(例如 Trending 只有三項) */
  categories?: CategoryDef[]
  /** 指示器 layoutId，不同分頁用不同 id 避免轉場互相干擾 */
  layoutId?: string
}

/** 分類切換列：滑動指示器用 layoutId 做共享元素轉場，切換時平滑位移。 */
export function CategoryTabs({
  active,
  onChange,
  categories = CATEGORIES,
  layoutId = 'tab-pill',
}: Props) {
  return (
    <div
      role="tablist"
      aria-label="榜單分類"
      className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-1 backdrop-blur"
    >
      {categories.map((cat) => {
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
                layoutId={layoutId}
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
