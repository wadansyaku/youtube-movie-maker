import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { ComparisonSection as ComparisonSectionType } from '../types/video';

interface Props {
    section: ComparisonSectionType;
    themeColors?: {
        primary: string;
        secondary: string;
        background: string;
        fontFamily?: string;
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
                fontFamily: themeColors.fontFamily || '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
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
                            fontSize: '26px',
                            fontWeight: 'bold',
                            color: themeColors.primary,
                            padding: '8px 24px',
                            background: `${themeColors.primary}20`,
                            borderRadius: '12px',
                            border: `2px solid ${themeColors.primary}40`,
                            letterSpacing: '0.03em',
                        }}
                    >
                        ❌ {section.leftLabel}
                    </div>

                    {/* コンテンツ */}
                    <div
                        style={{
                            fontSize: '34px',
                            fontWeight: '600',
                            color: 'white',
                            textAlign: 'center',
                            padding: '24px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '16px',
                            border: `2px solid ${themeColors.primary}30`,
                            minHeight: '160px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            boxShadow: '0 12px 24px rgba(0,0,0,0.35)',
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
                        fontSize: '52px',
                        fontWeight: '900',
                        color: 'white',
                        textShadow: '0 0 40px rgba(255,255,255,0.6)',
                        flexShrink: 0,
                        letterSpacing: '0.1em',
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
                            fontSize: '26px',
                            fontWeight: 'bold',
                            color: themeColors.secondary,
                            padding: '8px 24px',
                            background: `${themeColors.secondary}20`,
                            borderRadius: '12px',
                            border: `2px solid ${themeColors.secondary}40`,
                            letterSpacing: '0.03em',
                        }}
                    >
                        ✅ {section.rightLabel}
                    </div>

                    {/* コンテンツ */}
                    <div
                        style={{
                            fontSize: '34px',
                            fontWeight: '600',
                            color: 'white',
                            textAlign: 'center',
                            padding: '24px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '16px',
                            border: `2px solid ${themeColors.secondary}30`,
                            minHeight: '160px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 30px ${themeColors.secondary}20`,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
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
