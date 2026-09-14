# 嵌入原活動網頁

繼續使用同一個 GitHub Pages 網址，後方加 `?embed=1`。此模式隱藏本站的頁首與頁尾，抽取、下載、分享、複製功能都保留。

```html
<iframe
  src="https://YOUR_ACCOUNT.github.io/YOUR_REPO/?embed=1"
  title="神給你的一句話"
  loading="lazy"
  allow="web-share"
  style="display:block;width:100%;height:900px;border:0;background:#f3ead8;">
</iframe>
```

新版不會自動改變外層 iframe 高度；可先設 900px，再依主網站實際寬度調整。現有 Google Sites 嵌入區塊可沿用原網址，不需重建程式。

分享與下載仍受外層 iframe 權限、瀏覽器與裝置影響。建議在嵌入區塊旁保留一個「開啟完整網頁」連結，指向不帶 `?embed=1` 的網址。這只是相容性備援，不代表可跳過主網站的安全限制。

官方參考：https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API
