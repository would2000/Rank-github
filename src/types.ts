export type CategoryKey = 'daily' | 'weekly' | 'monthly' | 'yearly'

/** 單一專案在某榜單上的排名項目 */
export interface RankedRepo {
  rank: number
  fullName: string // owner/name
  name: string
  owner: string
  url: string
  description: string | null
  language: string | null
  stars: number
  /** 本期新增星數；bootstrap 模式下為該期間新建立專案的總星數 */
  delta: number
  avatarUrl: string
  /** 'delta' = 真實趨勢(快照差異)；'bootstrap' = 冷啟動回退(Search API) */
  source: 'delta' | 'bootstrap'
}

export interface CategoryMeta {
  /** 此榜單目前是否為真實趨勢資料 */
  source: 'delta' | 'bootstrap'
  /** 用來計算差異的基準快照日期(delta 模式才有) */
  baselineDate: string | null
}

export interface RankingsData {
  /** ISO 8601，產生時間(UTC) */
  updatedAt: string
  timezone: string
  categories: Record<CategoryKey, RankedRepo[]>
  meta: Record<CategoryKey, CategoryMeta>
}
