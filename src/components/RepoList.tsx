import { AnimatePresence, motion } from 'framer-motion'
import type { CategoryKey, RankedRepo } from '../types'
import { RepoCard } from './RepoCard'

interface Props {
  activeKey: CategoryKey
  repos: RankedRepo[]
  isDelta: boolean
}

/** 切換分類時整批退場再進場——AnimatePresence 控制清單的編排轉場。 */
export function RepoList({ activeKey, repos, isDelta }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
        className="flex flex-col gap-3"
      >
        {repos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center text-[var(--color-ink-faint)]">
            目前尚無資料，請稍後再回來查看。
          </div>
        ) : (
          repos.map((repo, i) => (
            <RepoCard key={repo.fullName} repo={repo} index={i} isDelta={isDelta} />
          ))
        )}
      </motion.div>
    </AnimatePresence>
  )
}
