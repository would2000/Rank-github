# GitHub 趨勢榜 · Top 10

追蹤 GitHub 上最受矚目的開源專案，依「星數成長」排出 **每日 / 每週 / 每月 / 每年** 前 10 名。靈感來自 [trendshift.io](https://trendshift.io)。

- 🇹🇼 介面全繁體中文
- 🕛 每天 **00:00（台灣時間，UTC+8）** 由 GitHub Action 自動更新
- ⭐ 每個專案附上 GitHub 連結與功能描述
- 🎬 React + Framer Motion，依 Taste / Motion 設計原則打造
- 🚀 純前端，部署於 GitHub Pages

## 技術棧

Vite · React 18 · TypeScript · Tailwind CSS v4 · Framer Motion

## 排名怎麼算？

採「**星數快照差異**」這種真趨勢做法：

1. 每天由 GitHub Action 透過 GitHub Search API 蒐集候選池（高星 + 新興 + 近期活躍的 repo），記錄當天星數快照到 `data/snapshots/<日期>.json`。
2. 與 N 天前的快照比對，算出各專案在該期間「**新增的星數**」，由高到低取前 10 名。
   - 每日＝對比 1 天前、每週＝7 天、每月＝30 天、每年＝365 天。
3. **冷啟動回退**：歷史快照還不夠時，該榜單暫以「該期間內新建立、星數最高」的專案顯示，並於畫面標示；待快照累積足夠後自動切換為星數成長排名（每日約需 1 天、每週數天、每月約 3 週、每年約 8 個月）。

> 快照與排名結果都會由 Action 自動 commit 回 repo，所以歷史會隨時間累積、排名也越來越貼近真實趨勢。

## 本機開發

```bash
npm install
npm run dev            # 開發伺服器
npm run update-rankings   # 手動跑一次資料管線（會寫入 public/data/rankings.json）
npm run build         # 產出 dist/
npm run preview       # 預覽正式版
```

> `update-rankings` 未帶 `GITHUB_TOKEN` 也能跑，但速率上限較低。可設定環境變數 `GITHUB_TOKEN=<你的 PAT>` 提高上限。

## 部署到 GitHub Pages

1. 把專案推上 GitHub（預設分支 `main`）。
2. 到 repo 的 **Settings → Pages → Build and deployment**，將 **Source** 設為 **GitHub Actions**。
3. （可選）到 **Settings → Actions → General → Workflow permissions**，確認允許 **Read and write permissions**，讓 Action 能把每日快照 commit 回 repo。
4. 之後：
   - 每天 16:00 UTC（台灣 00:00）自動更新資料並重新部署。
   - 推送到 `main` 會重新部署前端。
   - 也可在 **Actions** 分頁手動 **Run workflow** 立即更新。

工作流程定義於 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)。

## 專案結構

```
.
├── .github/workflows/deploy.yml   # 每日更新 + 部署
├── scripts/update-rankings.mjs    # 資料管線(快照差異 / 冷啟動回退)
├── data/                          # 由 Action 維護的歷史快照與中繼資料
│   ├── snapshots/<日期>.json
│   └── repos-meta.json
├── public/data/rankings.json      # 前端讀取的榜單(管線輸出)
└── src/                           # 前端
    ├── components/                # CategoryTabs / RepoCard / RepoList / CountUp
    ├── lib/                       # 資料載入、格式化、分類定義
    ├── App.tsx
    └── types.ts
```

## 備註

- 專案描述沿用 GitHub 上的原始描述（可能為英文或其他語言），屬來源資料；其餘介面皆為繁體中文。
