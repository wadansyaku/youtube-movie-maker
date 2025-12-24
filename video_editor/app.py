"""
AI-Powered Video Editor (Vrew Clone)
=====================================

A Streamlit application for:
- Text-based video editing via transcription
- Automatic silence removal
- Text-to-video generation from scripts
"""

import os
import tempfile
from pathlib import Path

import streamlit as st
import pandas as pd

# Import utility modules
from utils.transcription import (
    extract_audio,
    transcribe_audio,
    format_segments_to_df,
    get_segments_to_keep
)
from utils.video_editor import (
    cut_segments,
    remove_silence,
    get_video_info
)
from utils.tts_generator import generate_script_audio
from utils.video_generator import (
    assemble_video,
    generate_video_from_script
)
from utils.exporter import prepare_download, get_temp_path


# ========================================
# Page Configuration
# ========================================

st.set_page_config(
    page_title="AI Video Editor",
    page_icon="🎬",
    layout="wide",
    initial_sidebar_state="expanded"
)


# ========================================
# Custom CSS
# ========================================

st.markdown("""
<style>
    /* Main container styling */
    .main .block-container {
        padding-top: 2rem;
        max-width: 100%;
    }
    
    /* Header styling */
    h1 {
        color: #1E88E5;
        border-bottom: 2px solid #1E88E5;
        padding-bottom: 0.5rem;
    }
    
    /* Subtitle table styling */
    .stDataFrame {
        width: 100%;
    }
    
    /* Button styling */
    .stButton > button {
        width: 100%;
        border-radius: 8px;
        padding: 0.5rem 1rem;
    }
    
    /* Progress bar */
    .stProgress > div > div {
        background-color: #1E88E5;
    }
    
    /* Video player container */
    .video-container {
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        padding: 1rem;
        background: #fafafa;
    }
    
    /* Segment info cards */
    .segment-card {
        background: #f5f5f5;
        border-radius: 8px;
        padding: 1rem;
        margin: 0.5rem 0;
    }
</style>
""", unsafe_allow_html=True)


# ========================================
# Session State Initialization
# ========================================

def init_session_state():
    """Initialize session state variables."""
    defaults = {
        "mode": "edit",  # 'edit' or 'generate'
        "video_path": None,
        "edited_video_path": None,
        "segments_df": None,
        "transcription_done": False,
        "script_text": "",
        "generated_video_path": None,
        "processing": False,
        "model_size": "base",
        "language": "ja"
    }
    
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


# ========================================
# Sidebar
# ========================================

def render_sidebar():
    """Render the sidebar with settings and mode selection."""
    with st.sidebar:
        st.image("https://via.placeholder.com/150x50?text=AIVideoEditor", width=150)
        st.title("🎬 AI Video Editor")
        
        st.divider()
        
        # Mode selection
        st.subheader("📌 モード")
        mode = st.radio(
            "編集モードを選択",
            options=["edit", "generate"],
            format_func=lambda x: "📹 動画編集" if x == "edit" else "📝 テキストから生成",
            label_visibility="collapsed"
        )
        st.session_state.mode = mode
        
        st.divider()
        
        # Settings
        st.subheader("⚙️ 設定")
        
        st.session_state.model_size = st.selectbox(
            "Whisperモデルサイズ",
            options=["tiny", "base", "small", "medium", "large"],
            index=1,
            help="大きいモデルほど精度が高いですが、処理に時間がかかります"
        )
        
        st.session_state.language = st.selectbox(
            "言語",
            options=["ja", "en", "zh", "ko"],
            format_func=lambda x: {
                "ja": "🇯🇵 日本語",
                "en": "🇺🇸 English",
                "zh": "🇨🇳 中文",
                "ko": "🇰🇷 한국어"
            }.get(x, x),
            index=0
        )
        
        st.divider()
        
        # Help section
        with st.expander("❓ ヘルプ"):
            st.markdown("""
            **動画編集モード:**
            1. 動画をアップロード
            2. 自動文字起こしを実行
            3. 不要な部分のチェックを外す
            4. 編集した動画をエクスポート
            
            **テキスト生成モード:**
            1. 台本を入力
            2. 動画を生成
            3. エクスポート
            """)


# ========================================
# Video Edit Mode
# ========================================

def render_edit_mode():
    """Render the video editing interface."""
    st.header("📹 テキストベース動画編集")
    st.caption("動画をアップロードして、テキストを編集する感覚でカット編集できます")
    
    # Two-column layout
    col_video, col_editor = st.columns([1, 1], gap="large")
    
    with col_video:
        st.subheader("🎥 動画プレビュー")
        
        # Video upload
        uploaded_file = st.file_uploader(
            "動画ファイルをアップロード",
            type=["mp4", "mov", "avi", "mkv"],
            help="MP4, MOV, AVI, MKV形式に対応"
        )
        
        if uploaded_file:
            # Save uploaded file temporarily
            temp_path = get_temp_path(".mp4")
            with open(temp_path, "wb") as f:
                f.write(uploaded_file.read())
            st.session_state.video_path = temp_path
            
            # Display video
            st.video(temp_path)
            
            # Video info
            try:
                info = get_video_info(temp_path)
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.metric("長さ", f"{info['duration']:.1f}秒")
                with col2:
                    st.metric("解像度", f"{info['size'][0]}x{info['size'][1]}")
                with col3:
                    st.metric("FPS", f"{info['fps']:.0f}")
            except:
                pass
        
        # Action buttons
        st.divider()
        
        btn_col1, btn_col2 = st.columns(2)
        
        with btn_col1:
            transcribe_btn = st.button(
                "🎤 文字起こし開始",
                disabled=st.session_state.video_path is None,
                use_container_width=True
            )
        
        with btn_col2:
            silence_btn = st.button(
                "🔇 無音部分を削除",
                disabled=st.session_state.video_path is None,
                use_container_width=True
            )
        
        # Transcription logic
        if transcribe_btn and st.session_state.video_path:
            with st.spinner("文字起こし中... (初回はモデルダウンロードに時間がかかります)"):
                progress = st.progress(0, text="音声を抽出中...")
                
                # Extract audio
                audio_path = extract_audio(st.session_state.video_path)
                progress.progress(30, text="文字起こし中...")
                
                # Transcribe
                segments = transcribe_audio(
                    audio_path,
                    model_size=st.session_state.model_size,
                    language=st.session_state.language
                )
                progress.progress(90, text="データを整形中...")
                
                # Convert to DataFrame
                df = format_segments_to_df(segments)
                st.session_state.segments_df = df
                st.session_state.transcription_done = True
                
                progress.progress(100, text="完了！")
                
                # Cleanup
                if os.path.exists(audio_path):
                    os.remove(audio_path)
                
                st.success("✅ 文字起こしが完了しました！")
                st.rerun()
        
        # Silence removal logic
        if silence_btn and st.session_state.video_path:
            with st.spinner("無音部分を検出中..."):
                progress = st.progress(0, text="無音を検出中...")
                
                edited_path, silence_ranges = remove_silence(
                    st.session_state.video_path,
                    min_silence_len=500,
                    silence_thresh=-40
                )
                
                progress.progress(100, text="完了！")
                
                st.session_state.edited_video_path = edited_path
                st.success(f"✅ {len(silence_ranges)}箇所の無音部分を削除しました！")
                st.rerun()
        
        # Show edited video if available
        if st.session_state.edited_video_path:
            st.divider()
            st.subheader("✂️ 編集後のプレビュー")
            st.video(st.session_state.edited_video_path)
            
            # Download button
            video_bytes = prepare_download(st.session_state.edited_video_path)
            st.download_button(
                "⬇️ 編集済み動画をダウンロード",
                data=video_bytes,
                file_name="edited_video.mp4",
                mime="video/mp4",
                use_container_width=True
            )
    
    with col_editor:
        st.subheader("📝 字幕エディタ")
        
        if st.session_state.segments_df is not None:
            df = st.session_state.segments_df.copy()
            
            # Editable table
            st.caption("チェックを外すと、その区間が動画からカットされます")
            
            edited_df = st.data_editor(
                df[["include", "start_str", "end_str", "text"]],
                column_config={
                    "include": st.column_config.CheckboxColumn(
                        "含める",
                        help="この区間を残すかどうか",
                        default=True
                    ),
                    "start_str": st.column_config.TextColumn(
                        "開始",
                        disabled=True
                    ),
                    "end_str": st.column_config.TextColumn(
                        "終了",
                        disabled=True
                    ),
                    "text": st.column_config.TextColumn(
                        "テキスト",
                        width="large"
                    )
                },
                hide_index=True,
                use_container_width=True,
                num_rows="fixed"
            )
            
            # Update session state
            st.session_state.segments_df["include"] = edited_df["include"]
            st.session_state.segments_df["text"] = edited_df["text"]
            
            st.divider()
            
            # Selection summary
            included_count = edited_df["include"].sum()
            total_count = len(edited_df)
            st.info(f"📊 {included_count}/{total_count} 区間が選択されています")
            
            # Apply edits button
            apply_btn = st.button(
                "✂️ 選択した区間で動画を編集",
                type="primary",
                use_container_width=True
            )
            
            if apply_btn:
                with st.spinner("動画を編集中..."):
                    # Merge original timing data
                    merged = st.session_state.segments_df[
                        st.session_state.segments_df["include"] == True
                    ]
                    segments_to_keep = [
                        (row["start"], row["end"])
                        for _, row in merged.iterrows()
                    ]
                    
                    if segments_to_keep:
                        progress = st.progress(0, text="動画を編集中...")
                        
                        edited_path = cut_segments(
                            st.session_state.video_path,
                            segments_to_keep
                        )
                        
                        progress.progress(100, text="完了！")
                        st.session_state.edited_video_path = edited_path
                        st.success("✅ 動画の編集が完了しました！")
                        st.rerun()
                    else:
                        st.error("❌ 少なくとも1つの区間を選択してください")
        else:
            # Empty state
            st.info("👈 まず動画をアップロードして、「文字起こし開始」をクリックしてください")
            
            # Placeholder illustration
            st.markdown("""
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 300px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 16px;
                color: white;
                text-align: center;
            ">
                <div style="font-size: 4rem;">📝</div>
                <div style="font-size: 1.2rem; margin-top: 1rem;">
                    字幕データがここに表示されます
                </div>
            </div>
            """, unsafe_allow_html=True)


# ========================================
# Text-to-Video Generation Mode
# ========================================

def render_generate_mode():
    """Render the text-to-video generation interface."""
    st.header("📝 テキストから動画を生成")
    st.caption("台本を入力すると、音声と字幕付きの動画を自動生成します")
    
    # Two-column layout
    col_input, col_preview = st.columns([1, 1], gap="large")
    
    with col_input:
        st.subheader("📄 台本入力")
        
        script_text = st.text_area(
            "台本を入力してください",
            value=st.session_state.script_text,
            height=300,
            placeholder="""例：
こんにちは、今日はAI動画編集についてご紹介します。
このツールを使えば、テキストを入力するだけで動画が作れます。
ぜひお試しください。""",
            help="文ごとに改行するか、句点で区切ってください"
        )
        st.session_state.script_text = script_text
        
        # Character count
        char_count = len(script_text)
        st.caption(f"文字数: {char_count}")
        
        st.divider()
        
        # Generation settings
        st.subheader("⚙️ 生成設定")
        
        col1, col2 = st.columns(2)
        with col1:
            add_subtitles = st.checkbox("字幕を表示", value=True)
        with col2:
            tts_lang = st.selectbox(
                "読み上げ言語",
                options=["ja", "en"],
                format_func=lambda x: "日本語" if x == "ja" else "English"
            )
        
        st.divider()
        
        # Generate button
        generate_btn = st.button(
            "🎬 動画を生成",
            type="primary",
            disabled=len(script_text.strip()) == 0,
            use_container_width=True
        )
        
        if generate_btn and script_text.strip():
            with st.spinner("動画を生成中..."):
                progress = st.progress(0, text="音声を生成中...")
                
                try:
                    # Generate video
                    progress.progress(30, text="動画を組み立て中...")
                    
                    video_path = generate_video_from_script(
                        script_text,
                        language=tts_lang,
                        add_subtitles=add_subtitles
                    )
                    
                    progress.progress(100, text="完了！")
                    st.session_state.generated_video_path = video_path
                    st.success("✅ 動画の生成が完了しました！")
                    st.rerun()
                    
                except Exception as e:
                    st.error(f"❌ エラーが発生しました: {str(e)}")
    
    with col_preview:
        st.subheader("🎥 プレビュー")
        
        if st.session_state.generated_video_path:
            st.video(st.session_state.generated_video_path)
            
            # Video info
            try:
                info = get_video_info(st.session_state.generated_video_path)
                st.caption(f"長さ: {info['duration']:.1f}秒")
            except:
                pass
            
            # Download button
            video_bytes = prepare_download(st.session_state.generated_video_path)
            st.download_button(
                "⬇️ 動画をダウンロード",
                data=video_bytes,
                file_name="generated_video.mp4",
                mime="video/mp4",
                use_container_width=True
            )
        else:
            # Empty state
            st.markdown("""
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 400px;
                background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
                border-radius: 16px;
                color: white;
                text-align: center;
            ">
                <div style="font-size: 4rem;">🎬</div>
                <div style="font-size: 1.2rem; margin-top: 1rem;">
                    生成された動画がここに表示されます
                </div>
            </div>
            """, unsafe_allow_html=True)


# ========================================
# Main Application
# ========================================

def main():
    """Main application entry point."""
    init_session_state()
    render_sidebar()
    
    if st.session_state.mode == "edit":
        render_edit_mode()
    else:
        render_generate_mode()
    
    # Footer
    st.divider()
    st.caption("🎬 AI Video Editor - Powered by Whisper, MoviePy & gTTS")


if __name__ == "__main__":
    main()
