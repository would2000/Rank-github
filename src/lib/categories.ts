import type { CategoryKey } from '../types'

export interface CategoryDef {
  key: CategoryKey
  label: string // 顯示用繁體中文
  short: string // tab 短標
  periodLabel: string // 例如「過去 24 小時」
}

export const CATEGORIES: CategoryDef[] = [
  { key: 'daily', label: '每日榜', short: '每日', periodLabel: '過去 24 小時' },
  { key: 'weekly', label: '每週榜', short: '每週', periodLabel: '過去 7 天' },
  { key: 'monthly', label: '每月榜', short: '每月', periodLabel: '過去 30 天' },
  { key: 'yearly', label: '每年榜', short: '每年', periodLabel: '過去 365 天' },
]

/** GitHub 官方 Trending 只支援 daily / weekly / monthly */
export const TRENDING_CATEGORIES: CategoryDef[] = [
  { key: 'daily', label: '今日榜', short: '今日', periodLabel: '今日新增星數' },
  { key: 'weekly', label: '本週榜', short: '本週', periodLabel: '本週新增星數' },
  { key: 'monthly', label: '本月榜', short: '本月', periodLabel: '本月新增星數' },
]
