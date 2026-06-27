import { useEffect, useState } from 'react'
import type { RankingsData } from '../types'

type State =
  | { status: 'loading' }
  | { status: 'ready'; data: RankingsData }
  | { status: 'error'; message: string }

/** 載入 public/data/rankings.json(由 GitHub Action 每日產生) */
export function useRankings(): State {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let alive = true
    const url = `${import.meta.env.BASE_URL}data/rankings.json`
    fetch(url, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<RankingsData>
      })
      .then((data) => alive && setState({ status: 'ready', data }))
      .catch((err) =>
        alive && setState({ status: 'error', message: String(err?.message ?? err) }),
      )
    return () => {
      alive = false
    }
  }, [])

  return state
}
