import { motion } from 'framer-motion'
import type { SourceKey } from '../types'

interface Props {
  active: SourceKey
  onChange: (key: SourceKey) => void
}

const SOURCES: { key: SourceKey; label: string; hint: string }[] = [
  { key: 'growth', label: '星數成長榜', hint: '依期間內新增星數' },
  { key: 'official', label: 'GitHub Trending', hint: 'GitHub 官方趨勢' },
]

/**
 * 頂層分頁:在「星數成長榜」與「GitHub 官方 Trending」之間切換。
 * 用底線指示器(共享元素)做轉場，視覺上與第二層的膠囊分類 tab 區隔出層級。
 */
export function SourceSwitcher({ active, onChange }: Props) {
  return (
    <nav className="flex items-end gap-6 border-b border-[var(--color-border)]" aria-label="榜單來源">
      {SOURCES.map((s) => {
        const selected = s.key === active
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            aria-current={selected ? 'page' : undefined}
            className="group relative -mb-px flex flex-col items-start pb-3 pt-1 text-left"
          >
            <span
              className={`text-lg font-bold tracking-tight transition-colors sm:text-xl ${
                selected
                  ? 'text-[var(--color-ink)]'
                  : 'text-[var(--color-ink-faint)] group-hover:text-[var(--color-ink-soft)]'
              }`}
            >
              {s.label}
            </span>
            <span className="hidden text-xs text-[var(--color-ink-faint)] sm:block">
              {s.hint}
            </span>
            {selected && (
              <motion.span
                layoutId="source-underline"
                className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)]"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
