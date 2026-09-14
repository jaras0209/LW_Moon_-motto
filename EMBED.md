# 嵌入快速說明

## 推薦網址

正式頁：

```text
https://你的帳號.github.io/midautumn-proverbs/
```

嵌入模式：

```text
https://你的帳號.github.io/midautumn-proverbs/?embed=1
```

`?embed=1` 會隱藏本站自己的 Header、Footer 與「關於月下箴言」，只留下抽取互動與結果，更適合嵌入既有活動頁。

## HTML iframe

```html
<iframe
  src="https://你的帳號.github.io/midautumn-proverbs/?embed=1"
  title="月下抽箴言"
  loading="lazy"
  allow="web-share"
  style="display:block;width:100%;min-height:980px;border:0;background:#f3ead8;"
></iframe>
```

新版在抽取完成後會自動收斂首頁內容，將結果卡移到視覺主角，因此不需要再預留原先那麼大的 iframe 高度。

## Google Sites

「插入」→「嵌入」→「網址」→ 貼上帶有 `?embed=1` 的網址。

建議先把嵌入區塊高度抓約 950～1100px；若你的 Google Sites 手機版仍出現內部捲動，再稍微拉高即可。
