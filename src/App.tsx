import { useState } from 'react'
import { motion } from 'framer-motion'
import { CategoryTabs } from './components/CategoryTabs'
import { RepoList } from './components/RepoList'
import { useRankings } from './lib/useRankings'
import { CATEGORIES } from './lib/categories'
import { formatUpdatedAt } from './lib/format'
import type { CategoryKey } from './types'

export default function App() {
  const [active, setActive] = useState<CategoryKey>('daily')
  const state = useRankings()

  const activeCat = CATEGORIES.find((c) => c.key === active)!
  const repos = state.status === 'ready' ? state.data.categories[active] ?? [] : []
  const meta = state.status === 'ready' ? state.data.meta[active] : undefined
  const isDelta = meta?.source === 'delta'

  return (
    <div className="bg-aura min-h-dvh">
      <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
        {/* ── 標題區 ── */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-2 text-sm text-[var(--color-ink-faint)]">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-[var(--color-up)]" />
            每日 00:00(台灣時間)自動更新
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
            GitHub{' '}
            <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] bg-clip-text text-transparent">
              趨勢榜
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-[var(--color-ink-soft)]">
            追蹤 GitHub 上最受矚目的開源專案，依星數成長排出每日、每週、每月、每年的前 10 名。
          </p>
        </motion.header>

        {/* ── 控制列 ── */}
        <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
          <CategoryTabs active={active} onChange={setActive} />
          <div className="text-sm text-[var(--color-ink-faint)]">
            {activeCat.label}・{activeCat.periodLabel}
          </div>
        </div>

        {/* ── 冷啟動提示 ── */}
        {meta && !isDelta && (
          <div className="mt-4 rounded-xl border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/5 px-4 py-3 text-sm text-[var(--color-ink-soft)]">
            趨勢資料累積中：此榜單暫以「該期間新建立、星數最高」的專案顯示，待每日快照累積足夠後將自動切換為星數成長排名。
          </div>
        )}

        {/* ── 主清單 ── */}
        <main className="mt-5">
          {state.status === 'loading' && <SkeletonList />}
          {state.status === 'error' && (
            <div className="rounded-2xl border border-[var(--color-border)] p-10 text-center text-[var(--color-ink-soft)]">
              載入資料時發生問題（{state.message}）。請稍後重新整理頁面。
            </div>
          )}
          {state.status === 'ready' && (
            <RepoList activeKey={active} repos={repos} isDelta={isDelta} />
          )}
        </main>

        {/* ── 頁尾 ── */}
        <footer className="mt-12 border-t border-[var(--color-border)] pt-6 text-sm text-[var(--color-ink-faint)]">
          <p>
            資料來源：GitHub 公開 API。排名依各專案在該期間內新增的星標數計算。
          </p>
          {state.status === 'ready' && (
            <p className="mt-1">
              最後更新：{formatUpdatedAt(state.data.updatedAt)}（台灣時間）
            </p>
          )}
          <p className="mt-3 text-[var(--color-ink-faint)]/70">
            靈感來自 trendshift.io · 以 React + Framer Motion 打造
          </p>
        </footer>
      </div>
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="h-[88px] animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  )
}
