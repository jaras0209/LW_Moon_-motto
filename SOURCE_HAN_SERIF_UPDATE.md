# 思源宋體統一字型更新

這一版將網頁與下載小卡的中文顯示統一為 **思源宋體（Traditional Chinese / Taiwan）**。

## 為什麼修改

先前使用多個字型 fallback，在 LINE / Safari / iOS 等環境中，個別字元可能會由不同系統字型補字，造成「晚、撒、割」等字的筆畫與比例看起來不一致。

新版做法：

- CSS 與 Canvas 都指定同一個 `Source Han Serif TW Web` family。
- 優先使用裝置本機已安裝的思源宋體。
- 若本機沒有，瀏覽器會從 Adobe 官方 Source Han Serif GitHub release 載入繁中 Taiwan WOFF2。
- 抽取按鈕會等待字型載入流程，降低 Canvas 先用 fallback 字型產圖的機率。
- 不再載入 Google Noto Serif / Noto Sans。

## 更新目前 GitHub Pages

覆蓋：

```text
index.html
style.css
app.js
card-renderer.js
```

保留：

```text
config.js
data/proverbs.json
assets/
.github/workflows/
```

更新後 push 到目前部署 branch，等待 GitHub Pages Action 完成。LINE 內建瀏覽器若仍顯示舊版，請重新開啟連結或在網址後暫時加 `?v=3`。

> 注意：完整繁中字型檔較大，首次開啟可能比之前多一段字型下載時間；之後會由瀏覽器快取。
