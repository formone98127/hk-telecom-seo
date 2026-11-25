# 電訊格價通

香港手機月費及家居寬頻中立格價比較網站（Astro 靜態站，部署目標：Cloudflare Pages）。

## 本機預覽

```bash
npm install
npm run dev
```

背景模式（見 AGENTS.md）：

```bash
astro dev --background
```

## 接上 Google Sheets

1. 複製 `.env.example` 成 `.env`
2. 填入三個公開 CSV 連結
3. 重新 `npm run build` 即可更新資料

未設定時會自動使用內建 Mock 數據，網站仍可完整預覽。

## 推廣連結

同事打開 `/share/`，揀自己嘅名同頁面，複製帶 `?ref=` 嘅連結即可。
