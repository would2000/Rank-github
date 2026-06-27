// ──────────────────────────────────────────────────────────────────────────
// 抓取 GitHub 官方 Trending 榜(https://github.com/trending)
//
// GitHub 沒有 Trending 的官方 API，但該頁是伺服器端渲染的 HTML，
// 直接 fetch 後用 cheerio 解析即可。支援 daily / weekly / monthly。
// ──────────────────────────────────────────────────────────────────────────

import * as cheerio from 'cheerio'

const SINCE = [
  { key: 'daily', since: 'daily' },
  { key: 'weekly', since: 'weekly' },
  { key: 'monthly', since: 'monthly' },
]

const TOP_N = 10

function parseInteger(text) {
  const m = String(text).replace(/,/g, '').match(/[\d]+/)
  return m ? Number(m[0]) : 0
}

/** 解析單一 since 的 Trending 頁面 HTML，回傳前 TOP_N 名 */
function parseTrendingHtml(html) {
  const $ = cheerio.load(html)
  const rows = []

  $('article.Box-row').each((i, el) => {
    if (rows.length >= TOP_N) return
    const article = $(el)

    // 名稱：<h2 class="h3 ..."><a href="/owner/repo">
    const href = (article.find('h2 a').attr('href') || '').trim()
    const fullName = href.replace(/^\//, '').replace(/\s+/g, '')
    if (!fullName || !fullName.includes('/')) return
    const [owner, name] = fullName.split('/')

    // 描述
    const description = article.find('p').first().text().trim() || null

    // 語言
    const language =
      article.find('[itemprop="programmingLanguage"]').first().text().trim() || null

    // 總星數：指向 /stargazers 的連結
    const totalText = article
      .find('a[href$="/stargazers"]')
      .first()
      .text()
      .trim()
    const stars = parseInteger(totalText)

    // 本期新增星數：右側 "1,234 stars today/this week/this month"
    const periodText = article.find('span.float-sm-right').first().text().trim()
    const delta = parseInteger(periodText)

    rows.push({
      rank: rows.length + 1,
      fullName,
      name,
      owner,
      url: `https://github.com/${fullName}`,
      description,
      language,
      stars,
      delta,
      avatarUrl: `https://github.com/${owner}.png?size=88`,
      source: 'trending',
    })
  })

  return rows
}

async function fetchTrendingPage(since) {
  const res = await fetch(`https://github.com/trending?since=${since}`, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; rank-github-pipeline/1.0; +https://github.com)',
      Accept: 'text/html',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

/** 回傳 { daily, weekly, monthly } 三份排名陣列 */
export async function fetchAllTrending() {
  const categories = {}
  for (const { key, since } of SINCE) {
    const html = await fetchTrendingPage(since)
    categories[key] = parseTrendingHtml(html)
    console.log(`  · GitHub Trending ${key}：${categories[key].length} 筆`)
    await new Promise((r) => setTimeout(r, 600))
  }
  return categories
}
