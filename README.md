# 神給你的一句話

2026-09-14 / 簡約月兔剪影版

獨立靜態網頁：抽一句話、下載 PNG、分享、複製、再抽一次。不需要後端或建置工具。

## 已有 GitHub 網站：先看 UPDATE.md

使用 **God_Word_UI_Update_Only.zip** 更新同名檔案。更新包不含 `data/` 或 `.github/`，不會覆蓋正式箴言和現有部署流程。

完整包內的 JSON 是示範祝福文字，不是你在 GitHub 上的正式資料。尚未連線你的 repository，也未代你 commit。

## 資料格式

繼續維護 `data/proverbs.json`：

```json
{
  "items": [
    {
      "id": "p001",
      "text": "在這裡放入你準備的話語。",
      "enabled": true
    }
  ]
}
```

`text` 必須是文字；`enabled: false` 會停用該則內容。`id` 建議維持唯一。`category` 及 `meta` 可保留，不顯示於畫面。另也支援純字串陣列。

建議每則約 20–100 個中文字，手機上較好閱讀。長文字會自動縮字，不會自動刪掉結尾。需要換行時在 JSON 字串裡使用 `\n`。

### 不再顯示出處

新範本已移除 `reference`。舊檔案有這個欄位也仍可使用；程式不讀取它來產生畫面、圖片、朗讀標籤、分享、複製文字或檔名。

**畫面不顯示不等於資料保密。** 靜態網站的 JSON 可由公開網址讀取。不希望出處存在公開資料時，請在上傳前從 JSON 刪除 `reference`。既有公開 Git 歷史不會因為這次 UI 更新而被清除。若出處寫在 `text` 本身，請自行移除；程式不會猜測並改寫正文。

## 設定：config.js

```js
avoidImmediateRepeat: true, // 可重複，只避免立即抽到同一句
rabbitTone: 'black'        // 'black' 或 'white'
```

`avoidImmediateRepeat: false` 代表每次獨立抽取，連續同句也可以。只有一則時仍可持續抽取。

`pageTitle`、`cardTitle`、`cardFooter` 分別是網頁標題、圖片標題、圖片底部祝福。`rabbitTone` 同時影響網頁與下載圖片。月兔使用同一個單色路徑，沒有眼睛或陰影裝飾。

## 第一次部署

將完整包解壓後的檔案放在 repository 根目錄，不是只上傳 ZIP。內附原版 `.github/workflows/pages.yml`；其監聽 `main`。GitHub 的 `Settings → Pages → Source` 選擇 `GitHub Actions`。分支不是 `main` 時，請配合修改 workflow。

本機預覽需要 HTTP server，不建議直接雙擊 `file://` 開啟：

```sh
python -m http.server 8000
```

瀏覽器開啟 `http://localhost:8000/`。公開部署請使用 HTTPS。

## 下載、分享與相容性

PNG 為 1080 × 1350，在瀏覽器產生。抽取之後即可閱讀，不必等待動畫結束。已加入鍵盤焦點、朗讀文字及減少動態效果支援。

原生分享受瀏覽器、HTTPS 與 iframe 權限影響；不保證每個 LINE 內建瀏覽器都有相同選單。下載後的提示會提供「開啟圖片」備援入口，必要時以長按圖片儲存。

字型使用 Google Fonts 外部連結；無法載入時使用裝置字型。包內不附字型檔案。

嵌入說明見 `EMBED.md`，測試範圍見 `TEST_REPORT.md`。

## 官方文件

- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- Web Share API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API
