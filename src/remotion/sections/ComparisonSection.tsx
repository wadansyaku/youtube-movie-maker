import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { ComparisonSection as ComparisonSectionType } from '../types/video';

interface Props {
    section: ComparisonSectionType;
    themeColors?: {
        primary: string;
        secondary: string;
        background: string;
    };
}

export const ComparisonSection: React.FC<Props> = ({
    section,
    themeColors = {
        primary: '#EF4444',
        secondary: '#10B981',
        background: '#0F172A',
    },
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // 左側のアニメーション
    const leftOpacity = interpolate(
        frame,
        [0, 15],
        [0, 1],
        { extrapolateRight: 'clamp' }
    );

    const leftX = interpolate(
        frame,
        [0, 15],
        [-100, 0],
        { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
    );

    // 右側のアニメーション
    const rightOpacity = interpolate(
        frame,
        [15, 30],
        [0, 1],
        { extrapolateRight: 'clamp' }
    );

    const rightX = interpolate(
        frame,
        [15, 30],
        [100, 0],
        { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
    );

    // VS表示
    const vsScale = interpolate(
        frame,
        [10, 25, 30],
        [0, 1.2, 1],
        { extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2)) }
    );

    const vsOpacity = interpolate(
        frame,
        [10, 20],
        [0, 1],
        { extrapolateRight: 'clamp' }
    );

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
                fontFamily: 'sans-serif',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* 背景分割 */}
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '50%',
                    height: '100%',
                    background: `linear-gradient(180deg, ${themeColors.primary}10 0%, transparent 100%)`,
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    width: '50%',
                    height: '100%',
                    background: `linear-gradient(180deg, ${themeColors.secondary}10 0%, transparent 100%)`,
                }}
            />

            {/* 比較コンテンツ */}
            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    gap: '40px',
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 10,
                }}
            >
                {/* 左側（Before） */}
                <div
                    style={{
                        flex: 1,
                        opacity: leftOpacity,
                        transform: `translateX(${leftX}px)`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '20px',
                    }}
                >
                    {/* ラベル */}
                    <div
                        style={{
                            fontSize: '28px',
                            fontWeight: 'bold',
                            color: themeColors.primary,
                            padding: '8px 24px',
                            background: `${themeColors.primary}20`,
                            borderRadius: '12px',
                            border: `2px solid ${themeColors.primary}40`,
                        }}
                    >
                        ❌ {section.leftLabel}
                    </div>

                    {/* コンテンツ */}
                    <div
                        style={{
                            fontSize: '36px',
                            fontWeight: '600',
                            color: 'white',
                            textAlign: 'center',
                            padding: '24px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '16px',
                            border: `2px solid ${themeColors.primary}30`,
                            minHeight: '150px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {section.leftContent}
                    </div>
                </div>

                {/* VS */}
                <div
                    style={{
                        opacity: vsOpacity,
                        transform: `scale(${vsScale})`,
                        fontSize: '48px',
                        fontWeight: '900',
                        color: 'white',
                        textShadow: '0 0 30px rgba(255,255,255,0.5)',
                        flexShrink: 0,
                    }}
                >
                    VS
                </div>

                {/* 右側（After） */}
                <div
                    style={{
                        flex: 1,
                        opacity: rightOpacity,
                        transform: `translateX(${rightX}px)`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '20px',
                    }}
                >
                    {/* ラベル */}
                    <div
                        style={{
                            fontSize: '28px',
                            fontWeight: 'bold',
                            color: themeColors.secondary,
                            padding: '8px 24px',
                            background: `${themeColors.secondary}20`,
                            borderRadius: '12px',
                            border: `2px solid ${themeColors.secondary}40`,
                        }}
                    >
                        ✅ {section.rightLabel}
                    </div>

                    {/* コンテンツ */}
                    <div
                        style={{
                            fontSize: '36px',
                            fontWeight: '600',
                            color: 'white',
                            textAlign: 'center',
                            padding: '24px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '16px',
                            border: `2px solid ${themeColors.secondary}30`,
                            minHeight: '150px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 30px ${themeColors.secondary}20`,
                        }}
                    >
                        {section.rightContent}
                    </div>
                </div>
            </div>

            {/* 装飾線 */}
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '10%',
                    bottom: '10%',
                    width: '2px',
                    background: `linear-gradient(180deg, transparent, rgba(255,255,255,0.3), transparent)`,
                    transform: 'translateX(-50%)',
                }}
            />
        </div>
    );
};

export default ComparisonSection;
