// ──────────────────────────────────────────────────────────────────────────
// 使用區域分類器
//
// 依 topics + 描述 + 名稱 + 語言，用關鍵字規則把每個專案歸到一個「使用區域」。
// 純啟發式、免額外 API；順序由具體到一般，第一個命中的類別勝出。
// 兩個榜單(星數成長榜 / GitHub Trending)共用。
// ──────────────────────────────────────────────────────────────────────────

/** key 用於前端配色，label 為顯示用繁體中文 */
const RULES = [
  {
    key: 'ai',
    label: 'AI / 機器學習',
    kws: [
      'llm', 'gpt', 'machine learning', 'machine-learning', 'deep learning', 'deep-learning',
      'neural', 'tensorflow', 'pytorch', 'transformer', 'diffusion', 'generative', 'genai',
      'agent', 'rag', 'chatbot', 'nlp', 'computer vision', 'openai', 'anthropic', 'llama',
      'prompt', 'embedding', 'langchain', 'inference', 'fine-tun', 'mcp', 'copilot', 'ai ',
      'a.i.', 'speech', 'text-to', 'image generation', 'multimodal',
    ],
  },
  {
    key: 'web3',
    label: '區塊鏈 / Web3',
    kws: [
      'blockchain', 'crypto', 'web3', 'ethereum', 'bitcoin', 'solana', 'smart contract',
      'defi', 'nft', 'wallet', 'solidity', 'on-chain', 'onchain', 'token', 'staking',
    ],
  },
  {
    key: 'security',
    label: '資安 / 加密',
    kws: [
      'security', 'vulnerab', 'pentest', 'exploit', 'encryption', 'cyber', 'malware',
      'firewall', 'authentication', 'oauth', 'penetration', 'cve', 'osint', 'forensic',
    ],
  },
  {
    key: 'devops',
    label: 'DevOps / 雲端',
    kws: [
      'kubernetes', 'k8s', 'docker', 'container', 'terraform', 'ci/cd', 'cicd', 'devops',
      'serverless', 'helm', 'ansible', 'observability', 'monitoring', 'prometheus', 'grafana',
      'infrastructure', 'self-host', 'selfhost', 'self host', 'deployment', 'cloud native',
    ],
  },
  {
    key: 'data',
    label: '資料 / 資料庫',
    kws: [
      'database', 'postgres', 'mysql', 'mongodb', 'redis', 'sqlite', 'duckdb', 'clickhouse',
      'data engineering', 'etl', 'analytics', 'data science', 'dataframe', 'warehouse',
      'vector database', 'vector db', 'big data', 'spark', 'pandas', 'olap',
    ],
  },
  {
    key: 'mobile',
    label: '行動開發',
    kws: [
      'android', 'ios', 'flutter', 'react native', 'react-native', 'swiftui', 'jetpack compose',
      'mobile app', 'cross-platform app',
    ],
  },
  {
    key: 'frontend',
    label: '前端 / UI',
    kws: [
      'react', 'vue', 'svelte', 'frontend', 'front-end', 'tailwind', 'design system',
      'animation', 'webgl', 'three.js', 'nextjs', 'next.js', 'astro', 'angular', 'ui library',
      'component', 'css', 'web components', 'shadcn',
    ],
  },
  {
    key: 'backend',
    label: '後端 / 框架',
    kws: [
      'backend', 'back-end', 'rest api', 'graphql', 'microservice', 'express', 'fastapi',
      'django', 'rails', 'spring boot', 'nestjs', 'web framework', 'http server', 'grpc',
      'message queue', 'orm',
    ],
  },
  {
    key: 'os',
    label: '作業系統 / 底層',
    kws: [
      'operating system', 'kernel', ' linux', 'firmware', 'embedded', 'low-level', 'low level',
      'systems programming', 'bootloader', 'driver', 'risc-v', 'hypervisor', 'virtual machine',
      'compiler', 'wasm', 'webassembly',
    ],
  },
  {
    key: 'game',
    label: '遊戲',
    kws: ['game', 'gaming', 'game engine', 'godot', 'unity', 'emulator', 'roguelike'],
  },
  {
    key: 'devtools',
    label: '開發工具',
    kws: [
      'cli', 'command line', 'command-line', 'developer tool', 'dev tool', 'editor', 'ide',
      'vscode', 'terminal', 'debugger', 'linter', 'formatter', 'build tool', 'sdk', 'toolkit',
      'automation', 'productivity', 'plugin', 'extension', 'devtool', 'scaffold', 'boilerplate',
    ],
  },
  {
    key: 'design',
    label: '設計 / 創意',
    kws: [
      'design', 'figma', 'icon', 'font', 'illustration', 'wallpaper', 'creative coding',
      'video editing', 'motion', 'animator',
    ],
  },
  {
    key: 'learning',
    label: '學習 / 資源',
    kws: [
      'awesome', 'tutorial', 'roadmap', 'interview', 'cheat sheet', 'cheatsheet', 'curated list',
      'free-for', 'learning', 'course', 'ebook', 'documentation', 'study', 'collection of',
    ],
  },
]

// 關鍵字都沒命中時，用主要語言推測
const LANGUAGE_FALLBACK = {
  Solidity: { key: 'web3', label: '區塊鏈 / Web3' },
  Swift: { key: 'mobile', label: '行動開發' },
  Kotlin: { key: 'mobile', label: '行動開發' },
  Dart: { key: 'mobile', label: '行動開發' },
  Vue: { key: 'frontend', label: '前端 / UI' },
  Svelte: { key: 'frontend', label: '前端 / UI' },
  CSS: { key: 'frontend', label: '前端 / UI' },
  HTML: { key: 'frontend', label: '前端 / UI' },
  Rust: { key: 'os', label: '作業系統 / 底層' },
  C: { key: 'os', label: '作業系統 / 底層' },
  'C++': { key: 'os', label: '作業系統 / 底層' },
  Shell: { key: 'devtools', label: '開發工具' },
}

const OTHER = { key: 'other', label: '其他' }

/**
 * @param {{name?:string, description?:string|null, language?:string|null, topics?:string[]}} repo
 * @returns {{key:string, label:string}}
 */
export function classifyRepo(repo) {
  const haystack = [
    repo.name || '',
    repo.description || '',
    (repo.topics || []).join(' '),
    repo.language || '',
  ]
    .join(' ')
    .toLowerCase()

  for (const rule of RULES) {
    if (rule.kws.some((kw) => haystack.includes(kw))) {
      return { key: rule.key, label: rule.label }
    }
  }
  if (repo.language && LANGUAGE_FALLBACK[repo.language]) {
    return LANGUAGE_FALLBACK[repo.language]
  }
  return OTHER
}
