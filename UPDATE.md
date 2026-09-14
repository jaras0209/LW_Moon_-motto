# 已部署網站的更新方式

## 建議使用更新包

解壓 `God_Word_UI_Update_Only.zip`。將下列四個檔案更新到 GitHub 內與舊 `index.html` 相同的目錄：

```text
index.html
style.css
app.js
config.js
```

請四個一起更新，不要新舊混用。包內的 Markdown 說明檔可一起更新，不會出現在主畫面。

**保留你原本的 `data/proverbs.json` 與 `.github/workflows/pages.yml`。** 更新包故意不包含這兩者。

原本有自訂 `config.js` 時，更新前請先保留 `dataUrl`、`parentSiteUrl`、`avoidImmediateRepeat`、活動日期等自己調整的值，再帶入新版設定。

## GitHub 更新

在原 repository 的部署分支上傳這四個同名檔案，Commit changes。既有 workflow 若已監聽該分支的 push，就會自動部署。等 Actions 顯示成功後，重新整理網頁。不必換網址，不必新增另一個 workflow。

不要只把 ZIP 上傳到 repository；要上傳解壓後的檔案。也不要多套一層目錄。

## 出處欄位

新 UI 忽略 `reference`，舊 JSON 可直接沿用。若不希望出處仍留在公開 JSON，請另行刪除正式資料的 `reference`欄位，不要用示範資料整份覆蓋。

## 上線後確認

打開網頁確認新標題，抽一句話後試下載與複製，再在實際 LINE 內與 `?embed=1` 測試一次。原生分享選單仍取決於使用者手機及外層網站權限。
