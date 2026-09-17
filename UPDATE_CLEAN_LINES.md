# 金綠月兔小卡｜移除行間裝飾版

Version: `clean-centered-3`

## 這次修改

- 移除正文行與行之間的金線與菱形，保留原本行距。
- 每行依實際可見字形置中，並保留原本段落的垂直位置。
- `A WORD FOR YOU` 移到小卡最下方的金框內，水平置中，只出現一次。
- 月兔、金框、山景和紅色標題不變。白色中線只是截圖標記，不會畫入小卡。

## 更新方式

解壓縮 `Golden_Moon_Clean_Lines_Update.zip`，將以下兩個檔案覆蓋到原本 `index.html` 所在的同一層。

```text
index.html
card-renderer.js
```

不要只上傳 ZIP。請上傳解壓縮後的檔案。

保留以下原檔，不需要取代：

```text
app.js
style.css
config.js
assets/
data/proverbs.json
.github/
```

更新包沒有示範 JSON，不會覆蓋你的正式資料。原本的 `text` 與 `lines` 格式不變。

## 已自行修改 HTML 時

若你有自訂的 `index.html`，不必整份覆蓋；更新 `card-renderer.js`，並只將 HTML 原本載入該程式的那一行改成：

```html
<script src="card-renderer.js?v=clean-centered-3" defer></script>
```

請勿重複加入同一個 script。

## 排版相容性

在相同內容、字型與設定下，字級、換行、行距和每行位置與上一版相同。只停止繪製行間裝飾。

原本 `config.js` 裡的 `showDividers` 不需要修改；此版不會繪製行間分隔線。

圖片維持 1080 x 1350 PNG。不加回底部祝福語或 `reference`。

本次使用截圖中的內容製作預覽，不會寫入你的正式 JSON。

## 驗證範圍

已完成離線 Chromium 瀏覽器測試，比對新舊行距、字形置中和 PNG 下載內容。分享與剪貼簿使用模擬介面。

尚未直接更新你的 GitHub，也未使用真實 iPhone / LINE 驗證。不包含字型檔。
