# 金綠中秋月兔小卡｜置中版更新

本版以已確認的「金綠中秋月兔祝福卡」為排版參考。
正文每行水平置中，整段在紅色標題與湖景之間的閱讀區垂直置中。
沿用原圖的墨綠底、金框、滿月黑兔、燈籠與山湖景。
不加回頁尾祝福句，不顯示 reference。

## 更新方式

解壓縮 Golden_Moon_Centered_Update.zip，將以下檔案放到原本 index.html 所在的同一層：

```text
index.html
style.css
app.js
card-renderer.js
assets/
```

請一起更新，不要只更新 CSS。圖片內的文字是由 card-renderer.js 繪製。
更新包不包含 config.js、data/ 與 .github/；保留你現有的正式資料與部署設定。
不需要更改 proverbs.json。可選的 lines 指定換行仍可使用。
完整網站包內的 data/ 僅為示範資料，不要覆蓋你的正式箴言。

## 排版與預覽

小卡維持 1080 x 1350 PNG。網頁預覽與下載共用同一張 Canvas。
短句與長句都以同一條中心線排列，並依文字實際可見範圍校正標點空白。
文字長度不同時會調整行數與字級，不改寫原文，不寫死示意圖上的文字。
範例預覽使用測試換行，不會自動寫入你的正式 JSON。
版號：centered-reference-2。入口檔已更新 CSS / JS 版號，減少舊快取影響。
不包含字型檔；網路字型無法載入時使用系統字型，字形與換行可能略有差異。

---

# 神給你的一句話｜金綠月兔版

這是可獨立部署的靜態網站，不需要 npm、建置指令或資料庫。
網頁操作：抽一句話 → 下載小卡；並保留分享、複製文字與再抽一句。

## 已上線的網站如何更新

請優先使用 Golden_Moon_Centered_Update.zip。解壓縮後將內容放到原本 index.html 所在層，不要只上傳 ZIP。

```text
index.html                 # 覆蓋
style.css                  # 覆蓋
app.js                     # 覆蓋
card-renderer.js           # 新增，必須上傳
assets/                    # 新增整個資料夾
  card-background.webp
  moon.png
  rabbit.svg
```

更新包刻意不包含 config.js、data/ 和 .github/。
保留你原本的正式箴言、自訂網址與部署流程。
舊的 config.js 直接相容；cardFooter 即使還留著，新版也不會繪製那句頁尾文字。
config.example.js 僅供參考，網頁不會讀取它。

更新後沿用你現有的 GitHub Pages / Actions 流程。如畫面未更新，先確認部署成功並重新整理瀏覽器。
不要刪除原本的 config.js；它仍然是網頁使用的設定檔。

## 箴言 JSON：原格式可直接繼續用

預設資料位置是 data/proverbs.json。text 是完整正文，系統會依標點、可用寬度與字級自動分行。
不會刪字或替你改寫內容。小卡的內文是每次動態繪製，不是把示意圖固定當作結果。

```json
{
  "items": [
    {
      "id": "p001",
      "text": "不要放棄，帶著信心繼續向前。",
      "enabled": true
    }
  ]
}
```

## 精確換行：lines 是選用欄位

希望指定某一則每行顯示什麼，才需要加上 lines；不用將全部箴言重做。

```json
{
  "id": "p001",
  "text": "不要放棄，帶著信心繼續向前。",
  "lines": ["不要放棄，", "帶著信心", "繼續向前。"],
  "enabled": true
}
```

lines 串起來的內容必須和 text 一致（比對時忽略空白）。
如不一致，系統會忽略 lines，回到 text 自動排版，避免小卡和複製的內容不同。
一行超過安全寬度時仍會自動分行，不會溢出金框。
text 中的 JSON 換行字元 \n 也會被保留為分行提示。
長文會縮小字級，行數多時收起分隔線。超過排版上限時顯示錯誤，不會悄悄截斷文字。

reference、category 可留在舊資料，但不會顯示或加入分享、複製、檔名。
公開靜態網站的 JSON 不是私密資料庫；不想公開的欄位請從正式 JSON 刪除。

## 保留的設定

avoidImmediateRepeat: true 允許之後重複，但避免連續兩次相同。
avoidImmediateRepeat: false 每次獨立隨機，連續兩次也可以相同。
只有一則資料也能持續抽取。rabbitTone 支援 black / white，網頁與小卡使用相同純色剪影。

## 測試與圖片素材

測試範圍見 TEST_REPORT.md。即使裝置不支援原生分享，仍保留 PNG 下載與圖片預覽。
請在實際上線後用手機確認 LINE、Safari、Chrome 與嵌入頁的保存流程。
素材來自本次對話中你確認的中秋圖稿，已移除圖稿上固定文字。
不包含字型檔；原有 Google Fonts 無法載入時會使用系統字型，分行可能略有差異。
本地預覽請用靜態 HTTP 伺服器，例如 python -m http.server 8000；不建議直接雙擊 HTML。
