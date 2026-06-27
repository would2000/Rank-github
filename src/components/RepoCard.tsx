import { motion } from 'framer-motion'
import type { RankedRepo } from '../types'
import { CountUp } from './CountUp'
import { categoryColor, languageColor } from '../lib/format'

interface Props {
  repo: RankedRepo
  index: number
  isDelta: boolean
}

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.04 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

/** 前三名的排名數字鍍金，凸顯層級。 */
function rankClass(rank: number): string {
  if (rank === 1) return 'text-[var(--color-accent)]'
  if (rank <= 3) return 'text-[var(--color-ink)]'
  return 'text-[var(--color-ink-faint)]'
}

export function RepoCard({ repo, index, isDelta }: Props) {
  return (
    <motion.a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="show"
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--color-accent)]/40 sm:gap-5 sm:p-5"
    >
      {/* 排名 + 頭像 */}
      <div className="flex items-center gap-3 sm:gap-4">
        <span
          className={`w-8 text-right font-mono text-2xl font-bold tabular-nums sm:w-10 sm:text-3xl ${rankClass(
            repo.rank,
          )}`}
        >
          {repo.rank}
        </span>
        <img
          src={repo.avatarUrl}
          alt={`${repo.owner} 頭像`}
          loading="lazy"
          width={44}
          height={44}
          className="hidden h-11 w-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] object-cover sm:block"
        />
      </div>

      {/* 名稱 + 描述 + 語言 */}
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5 truncate">
          <span className="truncate text-[var(--color-ink-soft)]">{repo.owner}</span>
          <span className="text-[var(--color-ink-faint)]">/</span>
          <span className="truncate font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
            {repo.name}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
          {repo.description ?? '（此專案尚無描述）'}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[var(--color-ink-faint)]">
          {repo.language && (
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: languageColor(repo.language) }}
              />
              {repo.language}
            </span>
          )}
          {repo.categoryLabel && (
            <span
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium"
              style={{
                color: categoryColor(repo.categoryKey),
                borderColor: `${categoryColor(repo.categoryKey)}55`,
                backgroundColor: `${categoryColor(repo.categoryKey)}14`,
              }}
            >
              {repo.categoryLabel}
            </span>
          )}
        </div>
      </div>

      {/* 星數 + 本期新增 */}
      <div className="flex flex-col items-end gap-1 pl-2 text-right">
        <div className="flex items-center gap-1.5 font-semibold text-[var(--color-ink)]">
          <StarIcon />
          <CountUp value={repo.stars} delay={0.04 * index} />
        </div>
        {isDelta ? (
          <div className="flex items-center gap-1 text-sm font-medium text-[var(--color-up)]">
            <span aria-hidden>▲</span>
            <CountUp value={repo.delta} prefix="+" delay={0.04 * index} />
            <span className="text-[var(--color-ink-faint)]">星</span>
          </div>
        ) : (
          <span className="text-xs text-[var(--color-ink-faint)]">熱門新專案</span>
        )}
      </div>
    </motion.a>
  )
}

function StarIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-[var(--color-accent)]"
      aria-hidden
    >
      <path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 18.9 6.1 21.3l1.3-6.6-4.9-4.6 6.6-.8z" />
    </svg>
  )
}
