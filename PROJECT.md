# YouTube Movie Maker (CreativeFlow Studio)

このドキュメントは仕様/設計の詳細版です。概要と最新の案内は `README.md` を参照してください。

AI生成素材を統合管理し、YouTube公開に必要な意思決定ログと編集履歴を残す制作管理アプリ。
UI上の名称は一部「CreativeFlow Studio」のままです。

---

## 目的

- AI生成素材の来歴（プロンプト/ツール/人間の判断）を一元管理
- YouTube収益化審査・著作権対応に備えた Decision Log の記録
- World Bible によるシリーズ一貫性の担保
- ローカルファースト運用を前提とした軽量な制作管理

---

## 使用ツール（外部）

- ChatGPT Plus
- Gemini Pro
- Google AI Studio
- Suno AI プレミアム
- Runway unlimited
- CapCut
- Final Cut Pro

---

## スコープ

### Series/Episode パイプライン（YouTube向け）
```
Series → World Bible → Episode → Scene → Shot → Asset → Decision Log → Export
```

### Project/Scene/Shot パイプライン（映像制作向け）
```
Project → Scene → Shot → Hero選定 → Review → Export
```

---

## 機能一覧（現状）

- Series/World Bible 管理
- Episode 作成・ステータス管理
- Scene/Shot 分解（Episode/Project 両方で利用）
- Decision Log（人間の創造的判断の記録）
- Asset Library（タグ・メタデータ）
- Prompt Pack（再利用可能なプロンプト）
- AI補助（Script/Prompt/SEO 生成）
- Review/Export（JSON出力・コンプライアンス確認）

---

## 起動方法

```bash
# Next.js (localhost:3000) - メインUI
npm run dev
```

---

## データ/ストレージ

- Prisma + SQLite（`data/ymm.db`）
- Assetの`filePath`はローカルパスまたは外部ストレージキーを保持
- S3互換ストレージへの直接アップロード用の署名URL APIあり（任意）

---

## 環境変数（任意）

```env
# NextAuth (optional)
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="re_xxxxx"

# S3 Storage (optional)
S3_ENDPOINT="https://s3.amazonaws.com"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="creativeflow-assets"
S3_REGION="us-east-1"
S3_FORCE_PATH_STYLE="false"
```

※ Gemini/Runway/ElevenLabs/Stability/Stripe などのAPIキーは設定画面で `SystemSettings` に保存。

---

## 構成

```
/
├── prisma/                 # DBスキーマ
├── src/
│   ├── app/                # Next.js App Router
│   ├── components/         # UIコンポーネント
│   ├── lib/                # ユーティリティ/AI連携
│   └── types/              # 共通型定義
├── archive/                # 旧サブアプリの退避領域
├── templates/              # World Bible/PromptPack テンプレート
├── docs/                   # コンプライアンス資料
└── data/                   # SQLite DB など
```

※ 旧サブアプリは `archive/apps/` に退避しています。

---

## 運用/セキュリティ

- Decision Log による人間の創造的判断の証跡化
- AuditLog による操作履歴の保存
- 生成素材は `source` と `generationParams` を必須記録

---

## システム深掘り分析（批判的レビュー）

### 現状構造の整理

- UI/Server は Next.js（App Router）で統一し、Prisma/SQLite で制作データを管理
- Shorts のレンダリングは Remotion を Next.js API から実行し、生成物は Asset Library に登録
- Dynamic Slides は Node（satori + resvg）でPNG生成 → FFmpeg で動画化のパイプライン

### データフロー（動画/スライド）

```
[Next.js UI] -> [Next.js API] -> [DB: Prisma/SQLite]
      |
      +-> [Remotion Renderer] -> data/assets/renders/*.mp4 -> [Asset Library登録]
      |
      +-> [Node (slides)] -> out/slides/*.png -> [FFmpeg] -> out/video_*.mp4
```

- UIと処理系が分離しているため、ローカルファイルパスがプロセス境界を跨いで流通する
- 生成物の実体は FS、メタは DB に分散しており、同期失敗時の整合性が課題

### 重要なリスクと改善ポイント

- **ローカルパス露出**: クライアントにパスを返すため、UIが環境依存になりやすい
- **同期処理/長時間ジョブ**: 動画・スライド生成が同期的で、失敗時の再開/再試行/進捗監視が弱い
- **資産化の漏れ**: 生成物の保存とメタデータ登録の不整合が起きやすい
- **依存差異**: FFmpeg/フォント差異で再現性が下がる
- **観測性不足**: 進捗/失敗原因がログ依存で、ジョブ単位の監査が難しい

### 改善方針（段階導入）

- **スライド生成の資産化**: PNG/JSONの出力をZIP化し、Asset Libraryに登録（追跡可能化） ※実装済み
- **パス検証の強化**: プロジェクトルート外アクセスをブロックし、UIには論理パスのみ提示
- **テンプレートの共通化**: スライドテンプレはNode側で一元管理し、UIから選択可能に固定
- **検証経路の明確化**: テスト（unit/E2E）で生成パイプラインを最低保証
- **ジョブ化の検討**: 長時間処理をキュー化し、UIから再実行/再開を可能にする

### Dynamic Slides の位置づけ

Dynamic Slides は「ローカルファイル生成 → 確認 → 必要時のみ資産化」という人間判断を前提に設計し、
自動生成と監査可能性の両立を目指す。
