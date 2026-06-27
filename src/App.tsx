import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { SourceSwitcher } from './components/SourceSwitcher'
import { CategoryTabs } from './components/CategoryTabs'
import { RepoList } from './components/RepoList'
import { useRankings, useTrending } from './lib/useRankings'
import { CATEGORIES, TRENDING_CATEGORIES } from './lib/categories'
import { formatUpdatedAt } from './lib/format'
import type { CategoryKey, RankedRepo, SourceKey, TrendingCategoryKey } from './types'

const readSourceFromHash = (): SourceKey =>
  typeof window !== 'undefined' && window.location.hash.replace('#', '') === 'official'
    ? 'official'
    : 'growth'

export default function App() {
  const [source, setSource] = useState<SourceKey>(readSourceFromHash)
  const [active, setActive] = useState<CategoryKey>('daily')

  const rankings = useRankings()
  const trending = useTrending()

  // 與 URL hash 同步，讓兩個分頁可被分享/收藏(#growth / #official)
  useEffect(() => {
    const onHash = () => setSource(readSourceFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const isGrowth = source === 'growth'
  const cats = isGrowth ? CATEGORIES : TRENDING_CATEGORIES
  const activeCat = cats.find((c) => c.key === active) ?? cats[0]

  // 切換頂層分頁時，分類重置為第一項(daily 兩邊都有)
  function changeSource(s: SourceKey) {
    setSource(s)
    setActive('daily')
    if (typeof window !== 'undefined') window.location.hash = s
  }

  // ── 依來源取出當前清單與狀態 ──
  const res = isGrowth ? rankings : trending
  let repos: RankedRepo[] = []
  let isDelta = true
  let coldStart = false

  if (isGrowth) {
    if (rankings.status === 'ready') {
      repos = rankings.data.categories[active] ?? []
      const m = rankings.data.meta[active]
      isDelta = m?.source === 'delta'
      coldStart = m?.source === 'bootstrap'
    }
  } else if (trending.status === 'ready') {
    repos = trending.data.categories[active as TrendingCategoryKey] ?? []
  }

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
            追蹤 GitHub 上最受矚目的開源專案。提供兩種榜單：依星數成長排名，以及 GitHub 官方 Trending。
          </p>
        </motion.header>

        {/* ── 頂層分頁:榜單來源 ── */}
        <div className="mt-8 sm:mt-10">
          <SourceSwitcher active={source} onChange={changeSource} />
        </div>

        {/* ── 控制列:分類 ── */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CategoryTabs
            active={active}
            onChange={setActive}
            categories={cats}
            layoutId={isGrowth ? 'tab-growth' : 'tab-official'}
          />
          <div className="text-sm text-[var(--color-ink-faint)]">
            {activeCat.label}・{activeCat.periodLabel}
          </div>
        </div>

        {/* ── 冷啟動提示(僅星數成長榜)── */}
        {isGrowth && coldStart && (
          <div className="mt-4 rounded-xl border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/5 px-4 py-3 text-sm text-[var(--color-ink-soft)]">
            趨勢資料累積中：此榜單暫以「該期間新建立、星數最高」的專案顯示，待每日快照累積足夠後將自動切換為星數成長排名。
          </div>
        )}

        {/* ── 主清單 ── */}
        <main className="mt-5">
          {res.status === 'loading' && <SkeletonList />}
          {res.status === 'error' && (
            <div className="rounded-2xl border border-[var(--color-border)] p-10 text-center text-[var(--color-ink-soft)]">
              載入資料時發生問題（{res.message}）。請稍後重新整理頁面。
            </div>
          )}
          {res.status === 'ready' && (
            <RepoList activeKey={`${source}-${active}`} repos={repos} isDelta={isDelta} />
          )}
        </main>

        {/* ── 頁尾 ── */}
        <footer className="mt-12 border-t border-[var(--color-border)] pt-6 text-sm text-[var(--color-ink-faint)]">
          {isGrowth ? (
            <p>資料來源：GitHub 公開 API。排名依各專案在該期間內新增的星標數計算。</p>
          ) : (
            <p>
              資料來源：GitHub 官方 Trending（
              <a
                href="https://github.com/trending"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-accent)] hover:underline"
              >
                github.com/trending
              </a>
              ）。每日自動抓取最新排行。
            </p>
          )}
          {res.status === 'ready' && (
            <p className="mt-1">
              最後更新：{formatUpdatedAt(res.data.updatedAt)}（台灣時間）
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
