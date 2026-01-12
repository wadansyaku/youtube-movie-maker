// Video configuration types for Professional Shorts
export interface Highlight {
  x: number;
  y: number;
  label: string;
  color?: string;
  radius?: number;
}

// キャラクター定義
export interface Character {
  id: string;
  name: string;
  avatar?: string;
  voiceId?: string;
  color?: string; // セリフの背景色
}

// ベースセクション
export interface BaseSection {
  type: SectionType;
  startSec: number;
  endSec: number;
  onScreenText?: string;
  soundEffect?: string;
  bgImage?: string;
  animation?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'zoomIn' | 'bounce';
}

// セクションタイプ（拡張版）
export type SectionType =
  // 基本セクション
  | 'hook'
  | 'conclusion'
  | 'keypoint'
  | 'quiz'
  | 'recap'
  // 新規セクション
  | 'dialogue'    // キャラクター対話
  | 'story'       // ナレーション付きストーリー
  | 'character'   // キャラクター紹介
  | 'title'       // タイトルカード
  | 'fact'        // 事実カード（数字付き）
  | 'comparison'  // 比較（Before/After）
  | 'countdown'   // カウントダウン
  | 'reveal'      // 答え発表演出
  | 'transition'; // トランジション演出

// フックセクション
export interface HookSection extends BaseSection {
  type: 'hook';
  onScreenText: string;
  hookType?: 'number' | 'pattern-break' | 'conclusion' | 'question';
}

// 結論セクション
export interface ConclusionSection extends BaseSection {
  type: 'conclusion';
  onScreenText: string;
  ctaText?: string;
}

// キーポイントセクション
export interface KeyPointSection extends BaseSection {
  type: 'keypoint';
  onScreenText: string;
  image?: string;
  highlight?: Highlight;
  pointNumber?: number;
}

// クイズセクション
export interface QuizSection extends BaseSection {
  type: 'quiz';
  question: string;
  choices: string[];
  answer: string;
  answerSoundEffect?: string;
}

// まとめセクション
export interface RecapSection extends BaseSection {
  type: 'recap';
  onScreenText: string;
  points?: string[];
}

// === 新規セクション ===

// 対話セクション（キャラクター2人の会話）
export interface DialogueSection extends BaseSection {
  type: 'dialogue';
  dialogues: {
    characterId: string;
    text: string;
    emotion?: 'neutral' | 'happy' | 'surprised' | 'thinking' | 'excited';
  }[];
}

// ストーリーセクション（ナレーション付き物語）
export interface StorySection extends BaseSection {
  type: 'story';
  narration: string;
  visualDescription?: string;
  mood?: 'dramatic' | 'calm' | 'exciting' | 'mysterious';
}

// キャラクター紹介セクション
export interface CharacterSection extends BaseSection {
  type: 'character';
  characterId: string;
  introText: string;
  pose?: 'default' | 'wave' | 'think' | 'point';
}

// タイトルカードセクション
export interface TitleSection extends BaseSection {
  type: 'title';
  mainTitle: string;
  subtitle?: string;
  episodeNumber?: number;
}

// 事実カードセクション（数字を大きく表示）
export interface FactSection extends BaseSection {
  type: 'fact';
  number: string;
  unit?: string;
  description: string;
  source?: string;
}

// 比較セクション（Before/After）
export interface ComparisonSection extends BaseSection {
  type: 'comparison';
  leftLabel: string;
  leftContent: string;
  rightLabel: string;
  rightContent: string;
  leftImage?: string;
  rightImage?: string;
}

// カウントダウンセクション
export interface CountdownSection extends BaseSection {
  type: 'countdown';
  startNumber: number;
  endNumber?: number;
  label?: string;
}

// 答え発表セクション
export interface RevealSection extends BaseSection {
  type: 'reveal';
  revealText: string;
  buildup?: string;
  celebrationEffect?: boolean;
}

// トランジションセクション
export interface TransitionSection extends BaseSection {
  type: 'transition';
  transitionText?: string;
  style: 'fade' | 'swipe' | 'zoom' | 'flash' | 'dramatic';
}

// 全セクション型
export type Section =
  | HookSection
  | ConclusionSection
  | KeyPointSection
  | QuizSection
  | RecapSection
  | DialogueSection
  | StorySection
  | CharacterSection
  | TitleSection
  | FactSection
  | ComparisonSection
  | CountdownSection
  | RevealSection
  | TransitionSection;

// 参照情報
export interface Reference {
  title: string;
  url?: string;
}

export interface AudioPlan {
  ttsProvider?: 'google-ai-studio' | 'elevenlabs' | 'none';
  ttsPrompt?: string;
  ttsText?: string;
  ttsVoiceId?: string;
  narrationPath?: string;
  bgmProvider?: 'suno' | 'runway' | 'sora2' | 'local' | 'none';
  bgmPrompt?: string;
  bgmAssetId?: string;
  sfxProvider?: 'local' | 'suno' | 'runway' | 'sora2' | 'none';
  sfxNotes?: string;
}

// 動画全体の設定
export interface VideoConfig {
  title: string;
  themeLabel: string;
  themeId?: 'medical-dark' | 'medical-light' | 'pop-quiz' | 'story-dark' | 'dialogue-bright';
  duration: number;
  narration?: string;
  bgm?: string;
  bgmVolume?: number;
  avatar?: string;
  characters?: Character[];
  sections: Section[];
  references?: Reference[];
  disclaimer?: string;
  audioPlan?: AudioPlan;
  // メタデータ
  seriesId?: string;
  episodeNumber?: number;
  targetAudience?: string;
}

// 30日分コンテンツプラン
export interface ContentPlan {
  theme: string;
  description: string;
  days: DayPlan[];
}

export interface DayPlan {
  day: number;
  title: string;
  hook: string;
  keyPoints: string[];
  cta: string;
  targetViewCount?: number;
}
