import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { RevealSection as RevealSectionType } from '../types/video';

interface Props {
    section: RevealSectionType;
    themeColors?: {
        primary: string;
        secondary: string;
        background: string;
    };
}

export const RevealSection: React.FC<Props> = ({
    section,
    themeColors = {
        primary: '#10B981',
        secondary: '#F59E0B',
        background: '#0F172A',
    },
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const durationInFrames = (section.endSec - section.startSec) * fps;

    // ビルドアップフェーズ
    const buildupEnd = Math.min(20, durationInFrames / 2);
    const revealStart = buildupEnd;

    const buildupOpacity = interpolate(
        frame,
        [0, 10],
        [0, 1],
        { extrapolateRight: 'clamp' }
    );

    const buildupScale = interpolate(
        frame,
        [0, buildupEnd],
        [0.95, 1.05],
        { extrapolateRight: 'clamp' }
    );

    // 答え発表アニメーション
    const revealScale = interpolate(
        frame,
        [revealStart, revealStart + 15, revealStart + 20],
        [0, 1.2, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2)) }
    );

    const revealOpacity = interpolate(
        frame,
        [revealStart, revealStart + 10],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // 祝福エフェクト
    const celebrationOpacity = section.celebrationEffect
        ? interpolate(frame, [revealStart + 10, revealStart + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        : 0;

    const isRevealed = frame >= revealStart;

    // パーティクル
    const particles = Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const distance = interpolate(
            frame,
            [revealStart, revealStart + 30],
            [0, 300 + Math.random() * 100],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        const particleOpacity = interpolate(
            frame,
            [revealStart, revealStart + 10, revealStart + 30],
            [0, 1, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        return {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            opacity: particleOpacity,
            color: i % 2 === 0 ? themeColors.primary : themeColors.secondary,
        };
    });

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
                fontFamily: 'sans-serif',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* 祝福パーティクル */}
            {section.celebrationEffect && particles.map((p, i) => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: p.color,
                        transform: `translate(${p.x}px, ${p.y}px)`,
                        opacity: p.opacity * celebrationOpacity,
                        boxShadow: `0 0 10px ${p.color}`,
                    }}
                />
            ))}

            {/* ビルドアップテキスト */}
            {section.buildup && !isRevealed && (
                <div
                    style={{
                        opacity: buildupOpacity,
                        transform: `scale(${buildupScale})`,
                        fontSize: '48px',
                        fontWeight: '600',
                        color: 'rgba(255, 255, 255, 0.8)',
                        textAlign: 'center',
                        animation: 'pulse 0.5s ease-in-out infinite',
                    }}
                >
                    {section.buildup}
                </div>
            )}

            {/* 答え発表 */}
            {isRevealed && (
                <div
                    style={{
                        opacity: revealOpacity,
                        transform: `scale(${revealScale})`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '20px',
                    }}
                >
                    {/* 正解アイコン */}
                    <div
                        style={{
                            fontSize: '80px',
                            filter: `drop-shadow(0 0 30px ${themeColors.primary})`,
                        }}
                    >
                        ✨
                    </div>

                    {/* 答えテキスト */}
                    <div
                        style={{
                            fontSize: '72px',
                            fontWeight: '900',
                            background: `linear-gradient(135deg, white 0%, ${themeColors.primary} 50%, ${themeColors.secondary} 100%)`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textAlign: 'center',
                            textShadow: `0 0 60px ${themeColors.primary}40`,
                            maxWidth: '900px',
                            lineHeight: 1.3,
                        }}
                    >
                        {section.revealText}
                    </div>
                </div>
            )}

            {/* 背景グロー */}
            {isRevealed && (
                <div
                    style={{
                        position: 'absolute',
                        width: '600px',
                        height: '600px',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${themeColors.primary}30 0%, transparent 70%)`,
                        opacity: celebrationOpacity,
                        animation: 'pulse 1s ease-in-out infinite',
                    }}
                />
            )}
        </div>
    );
};

export default RevealSection;
