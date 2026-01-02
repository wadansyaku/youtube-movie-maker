# 本格ショート動画制作システム - 進捗状況

*最終更新: 2026-01-02 / 進捗のスナップショットです*

---

## ✅ 完了済みの機能

### 1. セクションコンポーネント（9種類追加）

| セクション | ファイル | 状態 |
|-----------|---------|------|
| dialogue | `src/remotion/sections/DialogueSection.tsx` | ✅ 完了 |
| title | `src/remotion/sections/TitleSection.tsx` | ✅ 完了 |
| fact | `src/remotion/sections/FactSection.tsx` | ✅ 完了 |
| story | `src/remotion/sections/StorySection.tsx` | ✅ 完了 |
| character | `src/remotion/sections/CharacterSection.tsx` | ✅ 完了 |
| comparison | `src/remotion/sections/ComparisonSection.tsx` | ✅ 完了 |
| transition | `src/remotion/sections/TransitionSection.tsx` | ✅ 完了 |
| countdown | `src/remotion/sections/CountdownSection.tsx` | ✅ 完了 |
| reveal | `src/remotion/sections/RevealSection.tsx` | ✅ 完了 |

### 2. 型定義拡張

- `src/remotion/types/video.ts`
  - 14種類のセクションタイプ（既存5 + 新規9）
  - Character インターフェース
  - ContentPlan / DayPlan インターフェース

### 3. MedicalShorts統合

- `src/remotion/MedicalShorts.tsx`
  - 全14種類のセクションをレンダリング可能に

### 4. 30日コンテンツプランナー

- `src/app/content-planner/page.tsx`
  - テーマ入力 → 30日分のタイトル・フック・キーポイント・CTA自動生成
  - カレンダー形式表示
  - 各Dayから「動画を作成」でShorts Makerへ連携

### 5. 20シーン対話形式テンプレート

- `src/app/shorts-maker/page.tsx` に追加
- `data/templates/20scene_dialogue.json`
- **タイミング: 1シーン3秒 × 20シーン = 60秒**

### 6. AIプロンプト生成ページ

- `src/app/prompt-generator/page.tsx`
- **Runway Gen4/4.5**: 各シーン用映像プロンプト
- **Suno AI**: BGM・効果音プロンプト（3スタイル選択可能）
- **Google AI Studio TTS**: キャラクター別セリフ + ボイス選択

### 7. ナビゲーション更新

- `src/components/layout/Sidebar.tsx`
- MAIN: 統合スタジオ / Shorts制作 / 30日企画 / プロンプト生成 / 自動制作 / 素材ライブラリ

---

## 🔄 未完了・今後実装予定

### Phase 3: AIキャラクターシステム

| 項目 | 状態 | 説明 |
|-----|------|------|
| WorldBible連携 | ⏳ 未実装 | シリーズからキャラクター定義を読み込む |
| キャラクターアバター画像 | ⏳ 未実装 | Runway生成画像を使用 |
| キャラクター別音声ID | ⏳ 未実装 | TTS用のボイスマッピング |

### Phase 4: 対話スクリプトジェネレーター

| 項目 | 状態 | 説明 |
|-----|------|------|
| Gemini連携 | ⏳ 未実装 | テーマから対話スクリプト自動生成 |
| 物語形式スクリプト | ⏳ 未実装 | ナレーション形式の自動生成 |

### Phase 5: AIツール連携強化

| 項目 | 状態 | 説明 |
|-----|------|------|
| Runway API直接呼び出し | ⏳ 未実装 | 現在はプロンプトコピー方式 |
| Suno API直接呼び出し | ⏳ 未実装 | 現在はプロンプトコピー方式 |
| Google TTS API直接呼び出し | ⏳ 未実装 | 現在はプロンプトコピー方式 |
| 素材自動インポート | ⏳ 未実装 | 生成素材を素材ライブラリへ自動登録 |

### Phase 6: バッチ処理

| 項目 | 状態 | 説明 |
|-----|------|------|
| 30日分一括レンダリング | ⏳ 未実装 | キューイングシステム |
| 進捗モニタリング | ⏳ 未実装 | 全体進捗の可視化 |

---

## 📁 作成済みファイル一覧

```
新規ファイル:
├── src/remotion/sections/
│   ├── DialogueSection.tsx
│   ├── TitleSection.tsx
│   ├── FactSection.tsx
│   ├── StorySection.tsx
│   ├── CharacterSection.tsx
│   ├── ComparisonSection.tsx
│   ├── TransitionSection.tsx
│   ├── CountdownSection.tsx
│   └── RevealSection.tsx
├── src/app/content-planner/page.tsx
├── src/app/prompt-generator/page.tsx
└── data/templates/20scene_dialogue.json

変更ファイル:
├── src/remotion/types/video.ts
├── src/remotion/MedicalShorts.tsx
├── src/app/shorts-maker/page.tsx
└── src/components/layout/Sidebar.tsx
```

---

## 🎯 現在のワークフロー

```
1. /content-planner    テーマから30日分の企画を生成
2. /shorts-maker       Day選択 → 20シーン動画作成
3. レシピ保存          JSONファイルをダウンロード
4. /prompt-generator   JSONアップロード → AI用プロンプト生成
5. 外部ツール          Runway/Suno/Google AI Studioで素材生成
6. /assets             生成素材をアップロード
7. /automation         最終レンダリング
```

---

## 🔧 技術仕様

| 項目 | 値 |
|-----|-----|
| 20シーン動画時間 | 60秒（3秒/シーン） |
| セクションタイプ | 14種類 |
| BGMスタイル | 3種類（教育系/ドラマチック/クイズ系） |
| TTSボイス | 30種類（日本語対応） |
| TypeScriptエラー | 0件 |

---

## 📝 備考

- API料金節約のため、現在はプロンプト出力→外部ツールでコピペ方式
- Runway Unlimited、Suno Premierプランを想定
- 将来的にはAPI直接連携でフル自動化予定
