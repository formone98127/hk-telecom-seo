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

## 價錢資料

未接 Google Sheets 時，Build 會自動以 [求Plan王](https://findplanking.com/) 市況價作為計劃基礎。

**每月 1 號** GitHub Actions 會自動重新上線，更新價錢同頁面月份內容。

想即刻更新：去 GitHub → Actions → `Deploy to GitHub Pages` → `Run workflow`。

## 接上 Google Sheets（可選人手覆寫）

1. 複製 `.env.example` 成 `.env`
2. 填入三個公開 CSV 連結
3. 重新 `npm run build` 即可更新資料

## 推廣連結

同事打開 `/share/`，揀自己嘅名同頁面，複製帶 `?ref=` 嘅連結即可。
