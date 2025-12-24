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
- 動画エディタ統合（Streamlit + FastAPI）

---

## 起動方法

```bash
# Next.js (localhost:3000)
npm run dev

# Video Editor API (FastAPI, localhost:8502)
npm run dev:api

# Video Editor UI (Streamlit, localhost:8501)
npm run dev:video-editor

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
├── video_editor/           # Streamlit + FastAPI
├── templates/              # World Bible/PromptPack テンプレート
├── docs/                   # コンプライアンス資料
└── data/                   # SQLite DB など
```

---

## 運用/セキュリティ

- Decision Log による人間の創造的判断の証跡化
- AuditLog による操作履歴の保存
- 生成素材は `source` と `generationParams` を必須記録

