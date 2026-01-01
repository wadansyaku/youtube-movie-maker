# Production OS (Standalone App)

YouTube制作のProduction OSを別アプリとして切り出したMVPです。

※ 本アプリはアーカイブ扱いです。必要時のみ使用してください。

## 起動方法

```bash
cd archive/apps/production-os
npm run dev
```

- デフォルトは `3001` から探し、空いていれば自動でそのポートで起動します。
- もし `3001` が埋まっていれば `3002`, `3003`... を順に探します。
- 起動したポート番号はターミナルに表示されます。

## Visual Debug

- 右下の `Debug` から Grid / Outlines を切り替えできます。
- `?debug=1` を付けると最初から両方ONで開きます。

## データ

- DBはルートの `data/ymm.db` を利用します。
- 生成物はルートの `data/production-os` に保存します。
