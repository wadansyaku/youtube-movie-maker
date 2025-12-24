# AI-Powered Video Editor (Vrew Clone)

テキストを編集する感覚で動画をカット編集できるAI動画エディタ。

## 機能

- 📹 **動画編集モード**: 動画をアップロード → 自動文字起こし → テキストで編集
- 📝 **テキスト生成モード**: 台本から動画を自動生成
- 🔇 **無音削除**: 無音部分を自動検出・削除
- ⬇️ **エクスポート**: 編集した動画をMP4でダウンロード

## セットアップ

```bash
# 1. 依存関係インストール
cd video_editor
pip install -r requirements.txt

# 2. アプリ起動
streamlit run app.py
```

## 必要環境

- Python 3.9+
- FFmpeg (moviepyが使用)

### FFmpegインストール

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
# https://ffmpeg.org/download.html からダウンロード
```

## 使い方

### 動画編集モード

1. 動画ファイルをアップロード
2. 「文字起こし開始」をクリック
3. 字幕エディタで不要な部分のチェックを外す
4. 「選択した区間で動画を編集」をクリック
5. 動画をダウンロード

### テキスト生成モード

1. サイドバーで「テキストから生成」モードを選択
2. 台本を入力
3. 「動画を生成」をクリック
4. 動画をダウンロード

## 技術スタック

- **UI**: Streamlit
- **動画処理**: MoviePy
- **音声認識**: faster-whisper
- **音声合成**: gTTS
- **データ処理**: Pandas
