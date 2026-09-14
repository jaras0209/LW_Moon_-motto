# 嵌入快速說明

## 推薦網址

正式頁：
`https://你的帳號.github.io/midautumn-proverbs/`

嵌入模式：
`https://你的帳號.github.io/midautumn-proverbs/?embed=1`

`?embed=1` 會隱藏本站自己的上方導覽、頁尾與「回活動首頁」區塊，放進其他網站時比較乾淨。

## HTML iframe

```html
<section style="width:min(1120px, 100%); margin:auto;">
  <iframe
    src="https://你的帳號.github.io/midautumn-proverbs/?embed=1"
    title="月下抽箴言"
    loading="lazy"
    allow="web-share"
    style="display:block;width:100%;min-height:1050px;border:0;background:#f3ead8;"
  ></iframe>
</section>
```

## Google Sites

「插入」→「嵌入」→「網址」→ 貼上 `?embed=1` 網址。

如果手機版高度不足，請把 Google Sites 的嵌入區塊往下拉高；建議至少 900～1100px。
