# YouTube Movie Maker

AI量産を助長しない、人間の創造的判断を必須とする動画制作パイプライン

## 特徴

- 🎯 **Human-in-the-Loop必須**: 全ての制作判断に人間の意図を記録（DecisionLog）
- 📚 **World Bible駆動**: シリーズごとの世界観一貫性を担保
- 🔒 **監査可能性**: 全AI生成素材のメタデータ完全記録
- ⚡ **ローカルファースト**: SQLiteベース、オフライン動作可能

## 技術スタック

- Next.js 14 (App Router)
- Prisma + SQLite
- TailwindCSS
- TypeScript

## セットアップ

```bash
# 依存関係インストール
npm install

# データベース初期化
npm run db:push

# 開発サーバー起動
npm run dev
```

## 主要機能

1. **Series CRUD + World Bible**: シリーズ管理と世界観定義
2. **Episode Workspace**: エピソード別の作業スペース
3. **Asset Library**: 映像/音楽/画像の素材管理（タグ付き）
4. **PromptPack Manager**: Runway/Suno用プロンプト管理
5. **DecisionLog**: 必須の編集意図・人間貢献記録
6. **YouTube Export**: メタデータ+素材台帳+編集意図のエクスポート
7. **Dynamic Slides**: YAML/JSON → SVG/PNG → MP4 の自動生成

## ディレクトリ構造

```
├── prisma/           # DBスキーマ
├── src/app/          # Next.js App Router
├── src/components/   # Reactコンポーネント
├── src/lib/          # ユーティリティ
├── templates/        # World Bible/PromptPackテンプレート
├── docs/             # コンプライアンスチェックリスト
├── slides/           # スライド仕様 + テンプレ + フォント
└── data/             # SQLite DB + アセット保存
```

## 安全設計

- 作業ディレクトリ制限（プロジェクトルート外アクセス禁止）
- ローカル/コンテナ前提
- ファイルパス検証

## Dynamic Slides

### 使い方（UI）

1. `slides/spec.yml` を編集
2. 動画エディタ画面で `Dynamic Slides` を ON
3. `Generate Slides` → `Generate Video` の順に実行

### 使い方（CLI）

```bash
# サンプル
npm run slides:render

# サンプルspecで実行
npm run slides:render:example
```

### スライド仕様（最低限）

```yaml
meta:
  width: 1920
  height: 1080
  theme: dark
  template: classic
  slideDuration: 5
slides:
  - title: "タイトル"
    bullets:
      - "箇条書き1"
      - "箇条書き2"
```

### 出力

- `out/slides/<job_id>/*.png`
- `out/slides/<job_id>/deck.json`
- `out/video_<job_id>.mp4`

### 検証

```bash
# Dynamic Slides パイプラインのE2E確認
python scripts/verify_slides_pipeline.py
```

※ FFmpeg が必要です。
