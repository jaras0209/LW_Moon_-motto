# 月下抽箴言｜獨立靜態網頁

這是一個可獨立部署、再嵌入活動主站的純前端靜態網站。

- 不需要資料庫
- 不需要後端
- 箴言資料獨立放在 `data/proverbs.json`
- 使用者抽取時採隨機方式
- 採有放回隨機抽取，同一則箴言之後可以再次被抽到
- 預設避免連續兩次出現完全相同的箴言，可在 `config.js` 關閉此限制
- 可下載 1080×1350 PNG 小卡
- 支援手機原生分享（瀏覽器支援時）
- `?embed=1` 可啟用嵌入模式，隱藏本站 Header / Footer

## 檔案結構

```text
midautumn_proverb_draw/
├─ index.html
├─ style.css
├─ app.js
├─ config.js
├─ data/
│  └─ proverbs.json
├─ EMBED.md
└─ README.md
```

## 1. 箴言 JSON 格式

請編輯 `data/proverbs.json`。

```json
{
  "meta": {
    "title": "月下箴言",
    "subtitle": "在月光裡，領受一句給今天的話",
    "updatedAt": "2026-09-14",
    "version": 1
  },
  "items": [
    {
      "id": "p001",
      "text": "你要放的箴言內容",
      "reference": "箴言 3:5-6",
      "category": "信心",
      "enabled": true
    }
  ]
}
```

### 欄位說明

- `id`：每一則唯一 ID，建議固定，不要重複，例如 `p001`。
- `text`：小卡主文，必填。
- `reference`：出處，可留空字串 `""`。
- `category`：分類，目前畫面不顯示，但保留給未來篩選／統計使用。
- `enabled`：`true` 會加入抽取池；`false` 暫時停用但不用刪除資料。
- `meta.updatedAt`：你每次更新箴言後可以改日期，頁尾會顯示。

> 正式部署前請刪掉目前的 `sample-001` ～ `sample-004` 示範資料。

## 2. GitHub Pages 部署（最推薦）

1. 登入 GitHub，建立新的 Repository，例如 `midautumn-proverbs`。
2. 將本資料夾內所有檔案上傳到 Repository 根目錄。
3. 在 Repository 進入 **Settings → Pages**。
4. `Build and deployment` 選 **Deploy from a branch**。
5. Branch 選 `main`，Folder 選 `/(root)`，按 **Save**。
6. GitHub 會提供網址，通常是：
   `https://你的帳號.github.io/midautumn-proverbs/`
7. 測試：直接打開該網址，按「抽一張箴言」，再測試 PNG 下載。

### 之後更新箴言

只需要：

1. 打開 GitHub 裡的 `data/proverbs.json`
2. 按鉛筆 Edit
3. 新增／修改資料
4. Commit changes
5. GitHub Pages 會自動更新，不需要重新改網站程式。

## 3. Google Sites 的定位

Google Sites 很適合「嵌入」這個網頁，但不適合拿來直接託管這組 HTML / JavaScript / JSON 原始檔。

建議架構：

```text
GitHub Pages
  └─ 真正執行抽箴言程式
       ↓ iframe / 網址嵌入
Google Sites 或既有活動主站
```

在 Google Sites：

1. 編輯頁面。
2. 右側選 **插入 → 嵌入 → 網址**。
3. 貼入 GitHub Pages 網址，建議尾端加 `?embed=1`：
   `https://你的帳號.github.io/midautumn-proverbs/?embed=1`
4. 選「整頁」或拉高嵌入區塊，建議高度至少 900～1100px。
5. 發布後以手機實際測試。

## 4. 嵌回目前的中秋活動頁

目前活動主頁：
`https://midautumn-bbq-night.twt249.chatgpt.site/`

如果主站支援 HTML iframe，建議：

```html
<iframe
  src="https://你的帳號.github.io/midautumn-proverbs/?embed=1"
  title="月下抽箴言"
  loading="lazy"
  style="width:100%; min-height:1050px; border:0; background:#f3ead8;"
  allow="web-share"
></iframe>
```

如果主站不允許 iframe，則做一張「月下抽箴言」入口卡，點擊後另開 GitHub Pages 網址即可。

## 5. config.js 可以改什麼

`config.js` 裡可以改：

- JSON 路徑
- 活動品牌文字
- 卡片活動日期／地點
- 卡片底部祝福
- 返回活動主站 URL
- `avoidImmediateRepeat`：`true` 時避免連續兩次同一句；`false` 時連續重複也可能發生

通常日後只改 `data/proverbs.json` 就夠了。

## 6. 本機預覽注意事項

因為瀏覽器基於安全限制，直接雙擊 `index.html` 用 `file://` 開啟時，`fetch('./data/proverbs.json')` 可能會被擋。

正確測試方式：

```bash
python3 -m http.server 8080
```

然後瀏覽：

`http://localhost:8080/`

部署到 GitHub Pages 後不會有這個問題。

## 7. 大量箴言維護建議

如果你有 50～300 則，建議先在 Google Sheets 維護：

| id | text | reference | category | enabled |
|---|---|---|---|---|
| p001 | … | 箴言 3:5-6 | 信心 | TRUE |

再轉成 JSON。`id` 建議永久固定，未來若要做「抽取統計」、「每人只抽一次」或「分類抽取」都會比較容易延伸。

## 8. 隨機抽取邏輯

這版改為「有放回抽樣」：

1. 每次按下抽取，都從所有 `enabled: true` 的箴言中重新建立完整抽取池。
2. 抽到某一則之後，不會把它從資料池永久移除，因此下一次或之後仍可能再次抽到。
3. 不再使用 `localStorage` 記錄「本輪已抽過」內容，也沒有「抽完整輪才重置」的概念。
4. 預設 `avoidImmediateRepeat: true`，當箴言超過 1 則時，只排除上一張，避免連續兩次完全相同；第三次之後仍可再次抽到第一張。
5. 若希望每一次完全獨立隨機，連續兩次抽到同一句也可以，將 `config.js` 改成：

```js
avoidImmediateRepeat: false,
```

這種模式比較適合箴言數量有限、參加者可以自由重複抽取的活動。
