# Production OS (MVP)

## 状態

このMVPはメインアプリから除外済みです。旧ルート/サーバーアクションは `archive/production-os` に退避し、DBスキーマの Item/Template/JobRun/Artifact/Reference はメインアプリから削除しました。

このMVPは別アプリとして `archive/apps/production-os` に退避しています。
GUIで試す場合は `archive/apps/production-os` を起動してください。
ポートは `3001` から自動で空きを探して起動します。
右下の `Debug` でグリッド/アウトラインの視覚デバッグを切り替えられます。

YouTube制作を「Item → JobRun → Artifact」で一元化する内部ツールMVPです。
外部ツールを差し替え可能なステップ設計にして、制作オペレーションを資産化します。

---

## 目的

- 生成/編集を内製しすぎず、外部ツールを“部品”として組み替え可能にする
- 再実行できる制作ログを残す（入力スナップショット + 実行ログ + 成果物）
- テンプレの切り替えだけでフォーマット量産を可能にする

---

## DBスキーマ概要（必須6エンティティ）

### Item
- 制作単位（タイトル/タグ/入力テキスト/KPIメモ）
- Templateの既定値を保持
- Asset/JobRun/Artifact/Referenceと関連

### Asset（既存テーブルを流用）
- アップロード素材
- `source = production-os` で分離
- `metadata` にタグ/役割を保持

### Template
- 出力フォーマットの定義
- `config(JSON)` と `steps(JSON)` を保持
- stepsには外部ツール連携を記録

### JobRun
- Item + Template + 入力スナップショット
- status: queued / running / succeeded / failed
- `inputSnapshot` に steps/入力/参照を保持
- 再実行時は `replayOfJobRunId` で紐付け

### Artifact
- JobRunの成果物
- `uri` に生成結果の保存場所
- KPIメモ（後で自動取得に拡張）

### Reference
- Itemに紐付く参照情報（URL/メモ）

---

## API / サーバー処理一覧

### Server Actions (`src/app/production-os/actions.ts`)
- `createItem`
- `updateItem`
- `createTemplate`
- `createAsset`
- `linkAssetToItem`
- `unlinkAssetFromItem`
- `addReference`
- `deleteReference`
- `createJobRun`
- `rerunJobRun`
- `updateArtifactKpi`

### Runner (`src/lib/production-os/runner.ts`)
- `executeJobRun(jobRunId)`
  - stepsを順次ログ化
  - 成果物(JSON)を `data/production-os/artifacts` に出力
  - ArtifactをDBに保存

---

## 画面一覧

- `/production-os` : Item一覧/検索/作成
- `/production-os/items/[id]` : 入力/実行履歴/成果物/参照情報を1画面で確認
- `/production-os/templates` : テンプレ管理（config/steps）
- `/production-os/assets` : Asset登録（Production OS専用）

---

## 拡張メモ

### 外部ツール連携の追加
1. `Template.steps` に外部ツールのステップを定義
2. `runner.ts` にツールアダプタ（API呼び出し/結果取得）を追加
3. 成果物は `Artifact` として紐付け

### Pipeline正規化への移行
- MVP: `JobRun.inputSnapshot.steps` で運用
- 次段階: `Pipeline` テーブル化 + `PipelineVersion` を追加
- `JobRun` は `pipelineVersionId` を保持して完全再現

### KPI自動取得の追加
- `Artifact.kpiNote` を構造化 (JSON化)
- YouTube API連携 → 日次で自動取得
- `KPIEvent` テーブルで時系列保存

---

## セットアップ（初回）

```bash
npx prisma db push
```

必要なら `data/production-os` 配下に `uploads` / `artifacts` が自動生成されます。
