import { useEffect, useState } from 'react'
import type { RankingsData, TrendingData } from '../types'

export type Resource<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string }

/** 載入 public/data 下的 JSON(由 GitHub Action 每日產生) */
function useJsonResource<T>(filename: string): Resource<T> {
  const [state, setState] = useState<Resource<T>>({ status: 'loading' })

  useEffect(() => {
    let alive = true
    const url = `${import.meta.env.BASE_URL}data/${filename}`
    fetch(url, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<T>
      })
      .then((data) => alive && setState({ status: 'ready', data }))
      .catch(
        (err) => alive && setState({ status: 'error', message: String(err?.message ?? err) }),
      )
    return () => {
      alive = false
    }
  }, [filename])

  return state
}

/** 星數成長榜(快照差異) */
export function useRankings(): Resource<RankingsData> {
  return useJsonResource<RankingsData>('rankings.json')
}

/** GitHub 官方 Trending */
export function useTrending(): Resource<TrendingData> {
  return useJsonResource<TrendingData>('trending.json')
}
