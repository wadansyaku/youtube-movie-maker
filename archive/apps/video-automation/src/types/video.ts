// Video configuration types for Medical Shorts
export interface Highlight {
  x: number;
  y: number;
  label: string;
  color?: string;
}

export interface BaseSection {
  type: 'hook' | 'conclusion' | 'keypoint' | 'quiz' | 'recap';
  startSec: number;
  endSec: number;
  onScreenText?: string;
  soundEffect?: string; // Path to SE file
}

export interface HookSection extends BaseSection {
  type: 'hook';
  onScreenText: string;
}

export interface ConclusionSection extends BaseSection {
  type: 'conclusion';
  onScreenText: string;
}

export interface KeyPointSection extends BaseSection {
  type: 'keypoint';
  onScreenText: string;
  image?: string;
  highlight?: Highlight;
}

export interface QuizSection extends BaseSection {
  type: 'quiz';
  question: string;
  choices: string[];
  answer: string;
  answerSoundEffect?: string; // Path to correct answer SE
}

export interface RecapSection extends BaseSection {
  type: 'recap';
  onScreenText: string;
}

export type Section = HookSection | ConclusionSection | KeyPointSection | QuizSection | RecapSection;

export interface Reference {
  title: string;
  url?: string;
}

export interface VideoConfig {
  title: string;
  themeLabel: string;
  themeId?: 'medical-dark' | 'medical-light' | 'pop-quiz';
  duration: number;
  narration?: string;
  bgm?: string;
  bgmVolume?: number;
  avatar?: string;
  sections: Section[];
  references?: Reference[];
  disclaimer?: string;
}
