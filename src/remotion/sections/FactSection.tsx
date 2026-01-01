import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { FactSection as FactSectionType } from '../types/video';

interface Props {
    section: FactSectionType;
    themeColors?: {
        primary: string;
        secondary: string;
        background: string;
    };
}

export const FactSection: React.FC<Props> = ({
    section,
    themeColors = {
        primary: '#10B981',
        secondary: '#3B82F6',
        background: '#0F172A',
    },
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // 数字のカウントアップアニメーション
    const numberProgress = interpolate(
        frame,
        [0, 30],
        [0, 1],
        { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
    );

    const numberScale = interpolate(
        frame,
        [0, 20, 25],
        [0.5, 1.1, 1],
        { extrapolateRight: 'clamp' }
    );

    const descriptionOpacity = interpolate(
        frame,
        [20, 35],
        [0, 1],
        { extrapolateRight: 'clamp' }
    );

    const descriptionY = interpolate(
        frame,
        [20, 35],
        [40, 0],
        { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
    );

    const sourceOpacity = interpolate(
        frame,
        [35, 45],
        [0, 1],
        { extrapolateRight: 'clamp' }
    );

    // パルスエフェクト
    const pulseScale = 1 + Math.sin(frame * 0.1) * 0.02;

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: `linear-gradient(135deg, ${themeColors.background} 0%, #1E293B 100%)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '60px',
                fontFamily: 'sans-serif',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* 背景の輝きエフェクト */}
            <div
                style={{
                    position: 'absolute',
                    width: '500px',
                    height: '500px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${themeColors.primary}30 0%, transparent 70%)`,
                    transform: `scale(${pulseScale})`,
                }}
            />

            {/* 数字 */}
            <div
                style={{
                    transform: `scale(${numberScale})`,
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '16px',
                    position: 'relative',
                    zIndex: 10,
                }}
            >
                <span
                    style={{
                        fontSize: '180px',
                        fontWeight: '900',
                        background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        lineHeight: 1,
                        textShadow: `0 0 80px ${themeColors.primary}60`,
                    }}
                >
                    {section.number}
                </span>
                {section.unit && (
                    <span
                        style={{
                            fontSize: '48px',
                            fontWeight: 'bold',
                            color: 'rgba(255, 255, 255, 0.8)',
                        }}
                    >
                        {section.unit}
                    </span>
                )}
            </div>

            {/* 説明文 */}
            <div
                style={{
                    opacity: descriptionOpacity,
                    transform: `translateY(${descriptionY}px)`,
                    fontSize: '48px',
                    fontWeight: '600',
                    color: 'white',
                    textAlign: 'center',
                    marginTop: '40px',
                    maxWidth: '900px',
                    lineHeight: 1.4,
                    position: 'relative',
                    zIndex: 10,
                }}
            >
                {section.description}
            </div>

            {/* ソース */}
            {section.source && (
                <div
                    style={{
                        opacity: sourceOpacity,
                        position: 'absolute',
                        bottom: '80px',
                        fontSize: '24px',
                        color: 'rgba(255, 255, 255, 0.5)',
                    }}
                >
                    📊 {section.source}
                </div>
            )}

            {/* 装飾要素 */}
            <div
                style={{
                    position: 'absolute',
                    top: '60px',
                    left: '60px',
                    width: '100px',
                    height: '100px',
                    border: `3px solid ${themeColors.primary}40`,
                    borderRadius: '20px',
                    transform: 'rotate(15deg)',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    bottom: '150px',
                    right: '80px',
                    width: '60px',
                    height: '60px',
                    background: `${themeColors.secondary}20`,
                    borderRadius: '50%',
                }}
            />
        </div>
    );
};

export default FactSection;
