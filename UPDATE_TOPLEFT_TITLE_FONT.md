# Golden Moon 小卡更新說明

本次更新重點：

1. **將 `A WORD FOR YOU` 與 `今晚 神給你的話` 移到左上角**
2. **原本左上角的活動資訊移到底部置中**
3. **調整小卡字型策略**：
   - 小卡主文字體：`Noto Serif TC` 優先
   - 備援：`Source Han Serif TC`、`Noto Serif CJK TC`
   - UI 字體：`Noto Sans TC` 優先
4. **加入字型就緒等待**，降低首次載入時字型跑掉、版面跳動的情況

## 需要覆蓋的檔案

- `index.html`
- `style.css`
- `app.js`
- `card-renderer.js`

## 不需要變動的檔案

- `config.js`
- `data/proverbs.json`
- `assets/`
- `.github/workflows/pages.yml`

## 建議更新方式

若你已部署在 GitHub Pages：

1. 將上述 4 個檔案覆蓋到原專案根目錄
2. commit 並 push 到 GitHub
3. 等待 GitHub Pages 自動重新部署
4. 重新整理頁面並清除快取確認新版已生效

