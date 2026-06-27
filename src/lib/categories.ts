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
