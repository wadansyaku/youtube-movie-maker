import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { TitleSection as TitleSectionType } from '../types/video';

interface Props {
    section: TitleSectionType;
    themeColors?: {
        primary: string;
        secondary: string;
        background: string;
        fontFamily?: string;
    };
}

export const TitleSection: React.FC<Props> = ({
    section,
    themeColors = {
        primary: '#8B5CF6',
        secondary: '#F59E0B',
        background: '#0F172A',
    },
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const durationInFrames = (section.endSec - section.startSec) * fps;

    // アニメーション
    const titleOpacity = interpolate(
        frame,
        [0, 15],
        [0, 1],
        { extrapolateRight: 'clamp' }
    );

    const titleScale = interpolate(
        frame,
        [0, 15],
        [0.8, 1],
        { extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.5)) }
    );

    const subtitleOpacity = interpolate(
        frame,
        [10, 25],
        [0, 1],
        { extrapolateRight: 'clamp' }
    );

    const subtitleY = interpolate(
        frame,
        [10, 25],
        [30, 0],
        { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
    );

    const episodeOpacity = interpolate(
        frame,
        [5, 20],
        [0, 1],
        { extrapolateRight: 'clamp' }
    );

    // パーティクル効果
    const particleProgress = (frame % 60) / 60;

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: `radial-gradient(ellipse at center, ${themeColors.background} 0%, #000 100%)`,
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
            {/* 背景エフェクト */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `
                        radial-gradient(circle at 20% 30%, ${themeColors.primary}20 0%, transparent 40%),
                        radial-gradient(circle at 80% 70%, ${themeColors.secondary}20 0%, transparent 40%)
                    `,
                }}
            />

            {/* 輝くライン */}
            <div
                style={{
                    position: 'absolute',
                    width: '200%',
                    height: '2px',
                    background: `linear-gradient(90deg, transparent, ${themeColors.primary}, transparent)`,
                    top: '35%',
                    left: '-50%',
                    transform: `translateX(${particleProgress * 100}%)`,
                    opacity: 0.5,
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    width: '200%',
                    height: '2px',
                    background: `linear-gradient(90deg, transparent, ${themeColors.secondary}, transparent)`,
                    top: '65%',
                    left: '-50%',
                    transform: `translateX(${-particleProgress * 100}%)`,
                    opacity: 0.5,
                }}
            />

            {/* エピソード番号 */}
            {section.episodeNumber && (
                <div
                    style={{
                        opacity: episodeOpacity,
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: themeColors.primary,
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        marginBottom: '20px',
                    }}
                >
                    Episode {section.episodeNumber}
                </div>
            )}

            {/* メインタイトル */}
            <div
                style={{
                    opacity: titleOpacity,
                    transform: `scale(${titleScale})`,
                    fontSize: '76px',
                    fontWeight: '900',
                    textAlign: 'center',
                    background: `linear-gradient(135deg, white 0%, ${themeColors.primary} 50%, ${themeColors.secondary} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.2,
                    textShadow: `0 0 60px ${themeColors.primary}40`,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    letterSpacing: '0.02em',
                    maxWidth: '90%',
                }}
            >
                {section.mainTitle}
            </div>

            {/* サブタイトル */}
            {section.subtitle && (
                <div
                    style={{
                        opacity: subtitleOpacity,
                        transform: `translateY(${subtitleY}px)`,
                        fontSize: '36px',
                        color: 'rgba(255, 255, 255, 0.8)',
                        marginTop: '24px',
                        textAlign: 'center',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxWidth: '80%',
                    }}
                >
                    {section.subtitle}
                </div>
            )}

            {/* 装飾ライン */}
            <div
                style={{
                    marginTop: '40px',
                    width: '200px',
                    height: '4px',
                    background: `linear-gradient(90deg, transparent, ${themeColors.primary}, ${themeColors.secondary}, transparent)`,
                    borderRadius: '2px',
                    opacity: subtitleOpacity,
                }}
            />
        </div>
    );
};

export default TitleSection;
