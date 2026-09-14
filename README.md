# 月下抽箴言（極簡互動版）

這是一個可直接部署到 GitHub Pages 的靜態網站。新版將首頁收斂成單一主要操作：「抽一張箴言」，動畫只在互動後出現；原本 JSON、重複隨機抽取、PNG 下載、分享、複製文字與 `?embed=1` 嵌入模式都保留。

## 目錄

```text
index.html
style.css
app.js
config.js
data/
  proverbs.json
  proverbs.template.json
.github/
  workflows/
    pages.yml
```

## 更新箴言

只需要修改 `data/proverbs.json`：

```json
{
  "items": [
    {
      "id": "p001",
      "text": "箴言內容",
      "reference": "箴言 3:5",
      "category": "信心",
      "enabled": true
    }
  ]
}
```

- `id`：每則唯一。
- `text`：顯示內容。
- `reference`：出處，可留空。
- `category`：預留分類欄位。
- `enabled`：`false` 時不參與抽取。

## 隨機抽取

每次都會從完整啟用清單重新抽取，因此同一句之後可以再次出現。

`config.js`：

```js
avoidImmediateRepeat: true
```

- `true`：允許之後重複，但避免連續兩次完全相同。
- `false`：完全獨立隨機，連續兩次相同也可能發生。

## GitHub Pages / Actions

專案已附 `.github/workflows/pages.yml`。

1. 將所有檔案放在 repository 根目錄。
2. GitHub Repository → `Settings` → `Pages`。
3. `Source` 選 `GitHub Actions`。
4. Push 到 `main` 後會自動部署。
5. 也可到 `Actions` 手動執行 `Run workflow`。

## 嵌入模式

完整網址：

```text
https://USERNAME.github.io/REPOSITORY/
```

嵌入活動網站時使用：

```text
https://USERNAME.github.io/REPOSITORY/?embed=1
```

`?embed=1` 會隱藏自己的 Header / Footer，使 iframe 看起來更像活動主站的一部分。

## 介面設計

- 首屏只有月亮、標題與主要 CTA。
- 月亮本身也可以點擊，但保留明確「抽一張箴言」按鈕，不要求使用者猜互動。
- 抽取後才出現兔子、月光與結果卡揭曉動畫。
- 兔子會隨機使用三種 CSS 動畫。
- 支援 `prefers-reduced-motion`，使用者若偏好減少動畫，網站會自動降低動畫效果。
- 下載小卡維持 1080 × 1350 PNG。
