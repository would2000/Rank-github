/** 數字加上千分位，並對 1k 以上做精簡顯示(如 12.3k) */
export function compactNumber(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  if (n < 1_000_000) return Math.round(n / 1000) + 'k'
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
}

/** 以台灣時間顯示「最後更新」 */
export function formatUpdatedAt(iso: string): string {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d)
  } catch {
    return iso
  }
}

/** 各語言對應的代表色(GitHub linguist 風格，取常見者) */
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Jupyter: '#DA5B0B',
  'Jupyter Notebook': '#DA5B0B',
  Lua: '#000080',
  Zig: '#ec915c',
  Elixir: '#6e4a7e',
  Scala: '#c22d40',
  Haskell: '#5e5086',
  MDX: '#fcb32c',
}

export function languageColor(lang: string | null): string {
  if (!lang) return '#71718a'
  return LANGUAGE_COLORS[lang] ?? '#9aa0c2'
}

/** 使用區域分類的色彩(對應 classify.mjs 的 key)，用於分類標籤底色/文字。 */
export const CATEGORY_COLORS: Record<string, string> = {
  ai: '#a78bfa',
  web3: '#f59e0b',
  security: '#ef4444',
  devops: '#38bdf8',
  data: '#22d3ee',
  mobile: '#34d399',
  frontend: '#f472b6',
  backend: '#60a5fa',
  os: '#94a3b8',
  game: '#fb7185',
  devtools: '#84cc16',
  design: '#e879f9',
  learning: '#fbbf24',
  other: '#9aa0c2',
}

export function categoryColor(key: string | undefined): string {
  if (!key) return '#9aa0c2'
  return CATEGORY_COLORS[key] ?? '#9aa0c2'
}
