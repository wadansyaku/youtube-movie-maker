import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { StorySection as StorySectionType } from '../types/video';

interface Props {
    section: StorySectionType;
    themeColors?: {
        primary: string;
        secondary: string;
        background: string;
        fontFamily?: string;
    };
}

export const StorySection: React.FC<Props> = ({
    section,
    themeColors = {
        primary: '#8B5CF6',
        secondary: '#06B6D4',
        background: '#0F172A',
    },
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const durationInFrames = (section.endSec - section.startSec) * fps;

    // ナレーションテキストのアニメーション
    const textOpacity = interpolate(
        frame,
        [0, 15],
        [0, 1],
        { extrapolateRight: 'clamp' }
    );

    const textY = interpolate(
        frame,
        [0, 20],
        [30, 0],
        { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
    );

    // ムードに応じた色
    const getMoodColors = () => {
        switch (section.mood) {
            case 'dramatic':
                return { gradient: 'from-red-900 via-purple-900 to-black', accent: '#DC2626' };
            case 'exciting':
                return { gradient: 'from-orange-900 via-yellow-900 to-black', accent: '#F59E0B' };
            case 'mysterious':
                return { gradient: 'from-indigo-900 via-purple-900 to-black', accent: '#6366F1' };
            case 'calm':
            default:
                return { gradient: 'from-blue-900 via-teal-900 to-black', accent: '#14B8A6' };
        }
    };

    const moodColors = getMoodColors();

    // 微細な動きエフェクト
    const breatheScale = 1 + Math.sin(frame * 0.05) * 0.01;
    const floatY = Math.sin(frame * 0.03) * 5;

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: `linear-gradient(135deg, ${themeColors.background} 0%, #000 100%)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '60px',
                fontFamily: themeColors.fontFamily || '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* 背景グラデーション */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(ellipse at 50% 30%, ${moodColors.accent}30 0%, transparent 60%)`,
                    transform: `scale(${breatheScale})`,
                }}
            />

            {/* 装飾パーティクル */}
            {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                const radius = 300 + Math.sin(frame * 0.02 + i) * 50;
                const x = Math.cos(angle + frame * 0.005) * radius;
                const y = Math.sin(angle + frame * 0.005) * radius;
                return (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: `${moodColors.accent}40`,
                            transform: `translate(${x}px, ${y}px)`,
                            boxShadow: `0 0 20px ${moodColors.accent}60`,
                        }}
                    />
                );
            })}

            {/* メインコンテンツ */}
            <div
                style={{
                    opacity: textOpacity,
                    transform: `translateY(${textY + floatY}px)`,
                    position: 'relative',
                    zIndex: 10,
                    maxWidth: '900px',
                }}
            >
                {/* ナレーションテキスト */}
                <div
                    style={{
                        fontSize: '48px',
                        fontWeight: '600',
                        color: 'white',
                        textAlign: 'center',
                        lineHeight: 1.5,
                        textShadow: `0 0 40px ${moodColors.accent}40`,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                    }}
                >
                    {section.narration}
                </div>

                {/* ビジュアル説明（サブテキスト） */}
                {section.visualDescription && (
                    <div
                        style={{
                            marginTop: '24px',
                            fontSize: '24px',
                            color: 'rgba(255, 255, 255, 0.6)',
                            textAlign: 'center',
                            fontStyle: 'italic',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                        }}
                    >
                        ✨ {section.visualDescription}
                    </div>
                )}
            </div>

            {/* ムードインジケーター */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '60px',
                    display: 'flex',
                    gap: '8px',
                    opacity: 0.5,
                }}
            >
                {['calm', 'exciting', 'dramatic', 'mysterious'].map((mood) => (
                    <div
                        key={mood}
                        style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: section.mood === mood ? moodColors.accent : 'rgba(255,255,255,0.2)',
                            transition: 'all 0.3s',
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default StorySection;
