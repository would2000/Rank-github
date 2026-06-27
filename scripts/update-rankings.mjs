#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// GitHub 趨勢榜 資料管線
//
// 每天 00:00(台灣時間)由 GitHub Action 執行：
//   1. 用 GitHub Search API 蒐集「候選池」(高星 + 新興 + 近期活躍的 repo)
//   2. 記錄今天的星數快照 -> data/snapshots/<台北日期>.json
//   3. 與 N 天前的快照比對，算出各期間「新增星數」-> 排出前 10 名
//   4. 若歷史快照不足(冷啟動)，回退為「該期間新建立、星數最高」的專案
//   5. 輸出前端用的 public/data/rankings.json
//
// 環境變數：
//   GITHUB_TOKEN  建議提供(Action 內建)，可把速率上限拉到 5000/hr
// ──────────────────────────────────────────────────────────────────────────

import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchAllTrending } from './lib/trending.mjs'
import { classifyRepo } from './lib/classify.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SNAP_DIR = join(ROOT, 'data', 'snapshots')
const META_PATH = join(ROOT, 'data', 'repos-meta.json')
const OUT_PATH = join(ROOT, 'public', 'data', 'rankings.json')
const TRENDING_OUT_PATH = join(ROOT, 'public', 'data', 'trending.json')

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''
const TIMEZONE = 'Asia/Taipei'

/** 各分類對應的回看天數 */
const PERIODS = [
  { key: 'daily', days: 1 },
  { key: 'weekly', days: 7 },
  { key: 'monthly', days: 30 },
  { key: 'yearly', days: 365 },
]

const TOP_N = 10
const MAX_SNAPSHOT_AGE_DAYS = 400 // 超過就清掉，控制 repo 體積

// ── 工具：日期(以台北時區為準) ──────────────────────────────────────────────

function toTaipeiDateStr(date) {
  // en-CA 會輸出 YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function dateStrMinusDays(baseStr, days) {
  const d = new Date(`${baseStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

function daysBetween(aStr, bStr) {
  const a = new Date(`${aStr}T00:00:00Z`).getTime()
  const b = new Date(`${bStr}T00:00:00Z`).getTime()
  return Math.round((a - b) / 86_400_000)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ── GitHub API ─────────────────────────────────────────────────────────────

async function gh(path, { retries = 3 } = {}) {
  const url = path.startsWith('http') ? path : `https://api.github.com${path}`
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'rank-github-pipeline',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { headers })
    if (res.ok) return res.json()

    // 速率限制 / 暫時性錯誤 -> 退避重試
    const remaining = res.headers.get('x-ratelimit-remaining')
    if ((res.status === 403 || res.status === 429) && remaining === '0') {
      const reset = Number(res.headers.get('x-ratelimit-reset') || 0) * 1000
      const wait = Math.max(1000, reset - Date.now() + 1000)
      console.warn(`  ! 觸及速率上限，等待 ${Math.round(wait / 1000)}s 後重試`)
      await sleep(Math.min(wait, 65_000))
      continue
    }
    if (res.status >= 500 && attempt < retries) {
      await sleep(1500 * (attempt + 1))
      continue
    }
    const body = await res.text().catch(() => '')
    throw new Error(`GitHub API ${res.status} ${url} :: ${body.slice(0, 200)}`)
  }
  throw new Error(`GitHub API 重試耗盡：${url}`)
}

/** 搜尋 repo，回傳精簡後的項目陣列(最多 pages*100 筆) */
async function searchRepos(query, pages = 1) {
  const out = []
  for (let page = 1; page <= pages; page++) {
    const data = await gh(
      `/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=100&page=${page}`,
    )
    const items = data.items || []
    for (const it of items) out.push(slimRepo(it))
    if (items.length < 100) break
    await sleep(800) // 對 search API 友善一點(30 req/min)
  }
  return out
}

function slimRepo(it) {
  return {
    fullName: it.full_name,
    name: it.name,
    owner: it.owner?.login ?? it.full_name.split('/')[0],
    url: it.html_url,
    description: it.description ?? null,
    language: it.language ?? null,
    stars: it.stargazers_count ?? 0,
    avatarUrl: it.owner?.avatar_url ?? '',
    createdAt: it.created_at ?? null,
    topics: Array.isArray(it.topics) ? it.topics : [],
  }
}

// ── 候選池 ──────────────────────────────────────────────────────────────────

async function buildCandidatePool(todayStr) {
  console.log('→ 蒐集候選池…')
  const monthAgo = dateStrMinusDays(todayStr, 30)
  const weekAgo = dateStrMinusDays(todayStr, 7)

  const queries = [
    { q: 'stars:>5000', pages: 4, tag: '高星 Top' }, // ~400 最高星
    { q: `created:>=${monthAgo} stars:>50`, pages: 2, tag: '近月新興' },
    { q: `pushed:>=${weekAgo} stars:>2000`, pages: 2, tag: '近週活躍' },
  ]

  const pool = new Map()
  for (const { q, pages, tag } of queries) {
    try {
      const repos = await searchRepos(q, pages)
      for (const r of repos) pool.set(r.fullName, r)
      console.log(`  · ${tag}：+${repos.length}（累計 ${pool.size}）`)
    } catch (err) {
      console.warn(`  ! 查詢失敗(${tag})：${err.message}`)
    }
  }
  return pool
}

// ── 快照 / 中繼資料的讀寫 ────────────────────────────────────────────────────

async function loadMeta() {
  if (!existsSync(META_PATH)) return {}
  try {
    return JSON.parse(await readFile(META_PATH, 'utf8'))
  } catch {
    return {}
  }
}

async function listSnapshotDates() {
  if (!existsSync(SNAP_DIR)) return []
  const files = await readdir(SNAP_DIR)
  return files
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .sort()
}

async function loadSnapshot(dateStr) {
  try {
    return JSON.parse(await readFile(join(SNAP_DIR, `${dateStr}.json`), 'utf8'))
  } catch {
    return null
  }
}

/**
 * 找出適合當「N 天前基準」的快照：
 * 年齡需落在 [round(N*0.7), ceil(N*1.5)+1] 之間，並取最接近 N 天的那一份。
 * 回傳 null 代表歷史不足 -> 走冷啟動回退。
 */
function pickBaseline(snapshotDates, todayStr, n) {
  const loAge = Math.max(1, Math.round(n * 0.7))
  const hiAge = Math.ceil(n * 1.5) + 1
  let best = null
  for (const ds of snapshotDates) {
    if (ds >= todayStr) continue
    const age = daysBetween(todayStr, ds)
    if (age < loAge || age > hiAge) continue
    const score = Math.abs(age - n)
    if (!best || score < best.score) best = { date: ds, age, score }
  }
  return best
}

// ── 排名計算 ────────────────────────────────────────────────────────────────

function rankByDelta(todayStars, baselineStars, meta) {
  const rows = []
  for (const [fullName, current] of Object.entries(todayStars)) {
    const past = baselineStars[fullName]
    if (past == null) continue
    const delta = current - past
    if (delta <= 0) continue
    rows.push({ fullName, stars: current, delta })
  }
  rows.sort((a, b) => b.delta - a.delta)
  return rows.slice(0, TOP_N).map((r, i) => enrich(r, meta, i + 1, 'delta'))
}

async function rankByBootstrap(todayStr, days, meta) {
  // 冷啟動：取「該期間內新建立、星數最高」的專案
  const since = dateStrMinusDays(todayStr, days)
  const repos = await searchRepos(`created:>=${since} sort:stars`, 1)
  return repos.slice(0, TOP_N).map((r, i) => {
    // 補進 meta 以利顯示
    meta[r.fullName] = { ...meta[r.fullName], ...r }
    return enrich({ fullName: r.fullName, stars: r.stars, delta: r.stars }, meta, i + 1, 'bootstrap')
  })
}

function enrich(row, meta, rank, source) {
  const m = meta[row.fullName] || {}
  const [owner, name] = row.fullName.split('/')
  const category = classifyRepo({
    name: m.name ?? name,
    description: m.description ?? null,
    language: m.language ?? null,
    topics: m.topics ?? [],
  })
  return {
    rank,
    fullName: row.fullName,
    name: m.name ?? name,
    owner: m.owner ?? owner,
    url: m.url ?? `https://github.com/${row.fullName}`,
    description: m.description ?? null,
    language: m.language ?? null,
    stars: row.stars,
    delta: row.delta,
    avatarUrl: m.avatarUrl || `https://github.com/${owner}.png`,
    source,
    categoryKey: category.key,
    categoryLabel: category.label,
  }
}

// ── 主流程 ──────────────────────────────────────────────────────────────────

async function main() {
  const now = new Date()
  const todayStr = toTaipeiDateStr(now)
  console.log(`\n=== GitHub 趨勢榜更新（台北日期 ${todayStr}）===`)
  if (!TOKEN) console.warn('! 未提供 GITHUB_TOKEN，速率上限較低，可能無法跑完。')

  await mkdir(SNAP_DIR, { recursive: true })
  await mkdir(dirname(OUT_PATH), { recursive: true })

  // 1) 候選池
  const pool = await buildCandidatePool(todayStr)

  // 2) 合併中繼資料 + 記錄今日快照
  const meta = await loadMeta()
  const todayStars = {}
  for (const [fullName, r] of pool) {
    todayStars[fullName] = r.stars
    meta[fullName] = {
      name: r.name,
      owner: r.owner,
      url: r.url,
      description: r.description,
      language: r.language,
      avatarUrl: r.avatarUrl,
      stars: r.stars,
      topics: r.topics,
    }
  }
  await writeFile(
    join(SNAP_DIR, `${todayStr}.json`),
    JSON.stringify({ date: todayStr, stars: todayStars }, null, 0),
  )
  await writeFile(META_PATH, JSON.stringify(meta, null, 0))
  console.log(`→ 已記錄今日快照（${Object.keys(todayStars).length} 個 repo）`)

  // 3) 逐分類計算排名
  const snapshotDates = await listSnapshotDates()
  const categories = {}
  const metaInfo = {}

  for (const { key, days } of PERIODS) {
    const baseline = pickBaseline(snapshotDates, todayStr, days)
    if (baseline) {
      const snap = await loadSnapshot(baseline.date)
      const ranked = rankByDelta(todayStars, snap?.stars ?? {}, meta)
      if (ranked.length > 0) {
        categories[key] = ranked
        metaInfo[key] = { source: 'delta', baselineDate: baseline.date }
        console.log(`  ✓ ${key}：delta 模式（基準 ${baseline.date}，年齡 ${baseline.age} 天）`)
        continue
      }
    }
    // 回退
    categories[key] = await rankByBootstrap(todayStr, days, meta)
    metaInfo[key] = { source: 'bootstrap', baselineDate: null }
    console.log(`  ✓ ${key}：bootstrap 回退（共 ${categories[key].length} 筆）`)
  }

  // 4) 輸出
  const output = {
    updatedAt: now.toISOString(),
    timezone: TIMEZONE,
    categories,
    meta: metaInfo,
  }
  await writeFile(OUT_PATH, JSON.stringify(output, null, 2))
  await writeFile(META_PATH, JSON.stringify(meta, null, 0)) // bootstrap 可能補了 meta
  console.log(`→ 已輸出 ${OUT_PATH}`)

  // 5) GitHub 官方 Trending(獨立榜單，失敗不影響上面的輸出)
  try {
    console.log('→ 抓取 GitHub 官方 Trending…')
    const trendingCategories = await fetchAllTrending()
    await writeFile(
      TRENDING_OUT_PATH,
      JSON.stringify(
        { updatedAt: now.toISOString(), timezone: TIMEZONE, categories: trendingCategories },
        null,
        2,
      ),
    )
    console.log(`→ 已輸出 ${TRENDING_OUT_PATH}`)
  } catch (err) {
    console.warn(`! GitHub Trending 抓取失敗(保留既有資料)：${err.message}`)
  }

  // 6) 清理過舊快照
  await pruneSnapshots(snapshotDates, todayStr)
  console.log('=== 完成 ===\n')
}

async function pruneSnapshots(snapshotDates, todayStr) {
  for (const ds of snapshotDates) {
    if (daysBetween(todayStr, ds) > MAX_SNAPSHOT_AGE_DAYS) {
      await rm(join(SNAP_DIR, `${ds}.json`)).catch(() => {})
      console.log(`  · 清除過舊快照 ${ds}`)
    }
  }
}

main().catch((err) => {
  console.error('資料管線失敗：', err)
  process.exit(1)
})
