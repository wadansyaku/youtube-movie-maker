# YouTube Movie Maker (CreativeFlow Studio)

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
- 動画エディタ統合（Next.js + FastAPI）

---

## 起動方法

```bash
# Next.js (localhost:3000) - メインUI + 動画エディタ
npm run dev

# Video Editor API (FastAPI, localhost:8502)
npm run dev:api

# Next.js + Video Editor API 同時起動
npm run dev:all
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
├── video_editor/           # Streamlit + FastAPI
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

- UIは Next.js（制作管理）と Streamlit（動画編集）が共存し、FastAPI が動画処理の実体
- ストレージは SQLite + ローカルパスで共有され、APIが絶対パスを返してクライアントが参照
- 動画生成/編集は Python（MoviePy）で同期実行、Next.js はメタデータ管理に集中
- Dynamic Slides は Node（satori + resvg）でPNG生成 → Python合成の二段構成

### データフロー（動画/スライド）

```
[Next.js UI] -> [Next.js API] -> [DB: Prisma/SQLite]
      |
      +-> [FastAPI] -> [Node (slides)] -> out/slides/*.png -> [FFmpeg/MoviePy] -> out/video_*.mp4
      |
      +-> [FastAPI] -> out/slides_packages/*.zip -> [Asset Library登録]
```

- UIと処理系が分離しているため、ローカルファイルパスがプロセス境界を跨いで流通する
- 生成物の実体は FS、メタは DB に分散しており、同期失敗時の整合性が課題

### 重要なリスクと改善ポイント

- **パイプライン分散**: Next.js / FastAPI / Streamlit / Node が別々に進化しやすく、破壊的変更の影響範囲が読みにくい
- **ローカルパス露出**: クライアントにパスを返すため、UIが環境依存になりやすい
- **同期処理/長時間ジョブ**: 動画・スライド生成が同期的で、失敗時の再開/再試行/進捗監視が弱い
- **資産化の漏れ**: 動画編集結果は保存が任意で、生成Runの記録とAsset管理の一貫性が担保されにくい
- **依存の二重化**: Node + Pythonの二重依存によりCI再現性が下がる（FFmpeg/フォント差異）
- **入力検証の偏り**: UI側入力は手動依存で、APIはパス依存のため、仕様変更時の崩れが起きやすい
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
